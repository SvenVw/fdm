/**
 * @file Calculates the "filling" of the nitrogen usage norm (`stikstofgebruiksnorm`) for the
 * Dutch regulations of 2025. This involves calculating the effective nitrogen applied from
 * various fertilizers, which depends on their nitrogen working coefficients (`werkingscoëfficiënt`).
 *
 * @packageDocumentation
 */
import { type Cultivation, withCalculationCache } from "@svenvw/fdm-core"
import Decimal from "decimal.js"
import pkg from "../../../../package"
import { getRegion } from "../value/stikstofgebruiksnorm"
import type { RegionKey } from "../value/types"
import { table9 } from "./table-9"
import { table11Mestcodes } from "./table-11-mestcodes"
import type {
    NL2025NormsFillingInput,
    NormFilling,
    WorkingCoefficientDetails,
} from "./types"

/**
 * Calculates the effective nitrogen application (norm filling) for a given set of fertilizers.
 *
 * This function determines the contribution of each fertilizer application to the nitrogen
 * usage norm. The core of the calculation is the application of a "working coefficient"
 * to the total nitrogen in the fertilizer, which represents the portion of nitrogen that
 * is considered effective in the year of application.
 *
 * The working coefficient is determined by a complex set of rules based on fertilizer type,
 * soil type, land use (arable vs. grassland), application timing, and whether the manure
 * is produced on-farm.
 *
 * @param input - The standardized input object containing all necessary data for the calculation.
 * @returns A promise that resolves to an object containing the total `normFilling` for nitrogen
 *   and a detailed breakdown for each individual `applicationFilling`.
 * @throws {Error} If a fertilizer definition cannot be found for an application.
 */
export async function calculateNL2025FertilizerApplicationFillingForStikstofGebruiksNorm(
    input: NL2025NormsFillingInput,
): Promise<NormFilling> {
    const {
        applications,
        fertilizers,
        b_centroid,
        has_grazing_intention,
        cultivations,
    } = input

    const applicationFillings: NormFilling["applicationFilling"] = []
    let totalNormFilling = new Decimal(0)

    const soilType = await getRegion(b_centroid)

    for (const application of applications) {
        const fertilizer = fertilizers.find(
            (f) => f.p_id_catalogue === application.p_id_catalogue,
        )
        if (!fertilizer) {
            throw new Error(
                `Fertilizer ${application.p_id_catalogue} not found for application ${application.p_app_id}`,
            )
        }

        // If nitrogen content is not known (explicitly 0 or undefined/null), use the value from Table 11 based on p_type_rvo
        let nitrogenContentValue = fertilizer.p_n_rt
        if (
            nitrogenContentValue === 0 ||
            nitrogenContentValue === undefined ||
            nitrogenContentValue === null
        ) {
            const table11Entry = table11Mestcodes.find(
                (entry) => entry.p_type_rvo === fertilizer.p_type_rvo,
            )
            nitrogenContentValue = table11Entry?.p_n_rt ?? 0
        }
        const p_n_rt = new Decimal(nitrogenContentValue)

        const p_app_date = new Date(application.p_app_date)
        const isCurrentBouwland = isBouwland(cultivations, p_app_date)

        // Determine the onFarmProduced status of the *actual fertilizer* based on temporary logic.
        // TODO: Implement proper determination of onFarmProduced based on actual farm data.
        const onFarmProduced = has_grazing_intention // Assume that if farm performs grazing, drijfmest and vaste mest are from the farm itself, otherwise supplied.

        const workingCoefficientDetails = getWorkingCoefficient(
            fertilizer.p_type_rvo,
            soilType,
            has_grazing_intention,
            isCurrentBouwland,
            p_app_date,
            onFarmProduced,
        )

        // Calculate norm filling: amount * nitrogen content * (working coefficient / 100) / 1000
        const p_app_amount = new Decimal(application.p_app_amount)
        const normFilling = p_app_amount
            .times(p_n_rt)
            .times(workingCoefficientDetails.p_n_wcl)
            .dividedBy(1000)
        totalNormFilling = totalNormFilling.plus(normFilling)

        const descriptionParts = [workingCoefficientDetails.description]
        if (workingCoefficientDetails.subTypeDescription) {
            descriptionParts.push(workingCoefficientDetails.subTypeDescription)
        }
        const normFillingDetailString = `Werkingscoëfficiënt: ${workingCoefficientDetails.p_n_wcl * 100}% - ${descriptionParts.join(" - ")}`

        applicationFillings.push({
            p_app_id: application.p_app_id,
            normFilling: normFilling.toNumber(),
            normFillingDetails: normFillingDetailString,
        })
    }

    return {
        normFilling: totalNormFilling.toNumber(),
        applicationFilling: applicationFillings,
    }
}

/**
 * Determines if a field is classified as "Bouwland" (arable land) on a specific date.
 *
 * This function checks the active cultivation on the given date and determines if it
 * falls into a category that is exempt from being considered arable land (e.g., certain
 * types of grassland).
 *
 * @param cultivations - An array of all cultivations for the field.
 * @param p_app_date - The date of the fertilizer application.
 * @returns `true` if the field is considered arable land on the given date, otherwise `false`.
 */
export function isBouwland(
    cultivations: Cultivation[],
    p_app_date: Date,
): boolean {
    const nonBouwlandCodes = ["nl_265", "nl_266", "nl_331", "nl_332"]

    const activeCultivation = cultivations.find((c) => {
        const startDate = new Date(c.b_start)
        const endDate = c.b_end ? new Date(c.b_end) : undefined
        return (
            p_app_date >= startDate &&
            (endDate === undefined || p_app_date <= endDate)
        )
    })

    if (
        !activeCultivation ||
        nonBouwlandCodes.includes(activeCultivation.b_lu_catalogue)
    ) {
        return false
    }

    return true
}

/**
 * Determines the nitrogen working coefficient for a specific fertilizer application.
 *
 * This function navigates a complex set of rules, primarily defined in `table9.ts`, to find
 * the correct working coefficient. The selection depends on a hierarchy of conditions:
 * - The RVO fertilizer type (`p_type_rvo`).
 * - Whether the fertilizer was produced on the farm.
 * - For certain fertilizers, subtypes are considered based on soil type, grazing intention,
 *   land use (arable/grassland), and the application date.
 *
 * If no specific rule matches, a default coefficient of 1.0 (100%) is returned, which is
 * typical for synthetic mineral fertilizers.
 *
 * @param p_type_rvo - The RVO code identifying the fertilizer type.
 * @param soilType - The soil type classification of the field.
 * @param b_grazing_intention - A flag indicating if the farm has a grazing intention.
 * @param isBouwland - A flag indicating if the field is currently arable land.
 * @param p_app_date - The date of the fertilizer application.
 * @param fertilizerOnFarmProduced - A flag indicating if the fertilizer was produced on-farm.
 * @returns An object containing the `p_n_wcl` (the working coefficient), and a descriptive
 *   string explaining how the coefficient was determined.
 */
export function getWorkingCoefficient(
    p_type_rvo: string | null | undefined,
    soilType: RegionKey | undefined,
    b_grazing_intention: boolean,
    isBouwland: boolean,
    p_app_date: Date,
    fertilizerOnFarmProduced: boolean, // New parameter
): WorkingCoefficientDetails {
    const defaultDetails: WorkingCoefficientDetails = {
        p_n_wcl: 1.0,
        description: "Kunstmest",
    }

    if (!p_type_rvo) {
        return defaultDetails
    }

    for (const entry of table9) {
        if (entry.p_type_rvo.includes(p_type_rvo)) {
            // If the table entry explicitly specifies an onFarmProduced requirement,
            // the fertilizer's onFarmProduced status must match it.
            if (
                entry.onFarmProduced !== undefined &&
                entry.onFarmProduced !== fertilizerOnFarmProduced
            ) {
                continue // Mismatch, try next entry
            }

            if (entry.subTypes) {
                const matchingSubType = entry.subTypes.find((subType) => {
                    if (
                        subType.b_grazing_intention !== undefined &&
                        subType.b_grazing_intention !== b_grazing_intention
                    ) {
                        return false
                    }

                    if (
                        subType.grondsoortCode &&
                        !subType.grondsoortCode.includes(soilType as RegionKey)
                    ) {
                        return false
                    }

                    if (
                        subType.isBouwland !== undefined &&
                        subType.isBouwland !== isBouwland
                    ) {
                        return false
                    }

                    if (subType.applicationPeriod) {
                        const appMonth = p_app_date.getMonth() // 0-11 (Jan is 0, Dec is 11)
                        const appDay = p_app_date.getDate()

                        if (
                            subType.applicationPeriod ===
                            "1 september t/m 31 januari"
                        ) {
                            // September (month 8) to January (month 0)
                            if (
                                !(
                                    (appMonth >= 8 && appMonth <= 11) ||
                                    (appMonth === 0 && appDay <= 31)
                                )
                            ) {
                                return false
                            }
                        }
                    }
                    return true // All conditions for this subType match
                })

                if (matchingSubType) {
                    return {
                        p_n_wcl: matchingSubType.p_n_wcl,
                        description: entry.description,
                        subTypeDescription: matchingSubType.description,
                    }
                }
            } else if (entry.p_n_wcl !== undefined) {
                // If no subTypes, use the main entry's p_n_wcl
                return {
                    p_n_wcl: entry.p_n_wcl,
                    description: entry.description,
                }
            }
        }
    }

    return defaultDetails // If no specific rule is found, return the default 100% (1.0)
}

/**
 * A cached version of the `calculateNL2025FertilizerApplicationFillingForStikstofGebruiksNorm` function.
 *
 * This function enhances performance by caching the results of the norm filling calculation.
 * The cache key is generated based on the function's input and the calculator's version,
 * ensuring that the cache is invalidated when the underlying logic or data changes.
 *
 * @param input - The standardized input object containing all necessary data for the calculation.
 * @returns A promise that resolves to an object containing the total `normFilling` for nitrogen
 *   and a detailed breakdown for each individual `applicationFilling`.
 */
export const getNL2025FertilizerApplicationFillingForStikstofGebruiksNorm =
    withCalculationCache(
        calculateNL2025FertilizerApplicationFillingForStikstofGebruiksNorm,
        "calculateNL2025FertilizerApplicationFillingForStikstofGebruiksNorm",
        pkg.calculatorVersion,
    )
