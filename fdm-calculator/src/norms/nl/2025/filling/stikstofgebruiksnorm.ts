import type {
    Fertilizer,
    FertilizerApplication,
    CurrentSoilData,
    Cultivation,
} from "@svenvw/fdm-core"
import type { NormFilling } from "./types"
import { table11Mestcodes } from "./table-11-mestcodes"
import { table9 } from "./table-9"
import { getRegion } from "../stikstofgebruiksnorm"
import type { RegionKey } from "../types"
import Decimal from "decimal.js"

/**
 * Calculates the nitrogen utilization norm filling for a set of fertilizer applications.
 * This function determines the amount of effective nitrogen applied, taking into account
 * fertilizer type, nitrogen content, working coefficients, soil type, grazing intention,
 * and land use (bouwland/arable land).
 *
 * @param {Object} params - The parameters for the calculation.
 * @param {FertilizerApplication[]} params.applications - An array of fertilizer applications.
 * @param {Fertilizer[]} params.fertilizers - An array of available fertilizers.
 * @param {CurrentSoilData[]} params.soilData - Current soil data for the farm.
 * @param {boolean} params.b_grazing_intention - Indicates if there is a grazing intention for the farm.
 * @param {Cultivation[]} params.cultivations - An array of cultivations for the farm.
 * @returns {Promise<NormFilling>} An object containing the total norm filling and details for each application.
 */
export async function calculateFertilizerApplicationFillingForNitrogen({
    applications,
    fertilizers,
    soilData,
    b_grazing_intention,
    cultivations,
}: {
    applications: FertilizerApplication[]
    fertilizers: Fertilizer[]
    soilData: CurrentSoilData[]
    b_grazing_intention: boolean
    cultivations: Cultivation[]
}): Promise<NormFilling> {
    const applicationFillings: NormFilling["applicationFilling"] = []
    let totalNormFilling = new Decimal(0)

    const soilType = await getRegion(soilData)

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
        const isDrijfmest = [
            "14",
            "18",
            "19",
            "60",
            "46",
            "50",
            "30",
            "76",
            "81",
            "91",
            "92",
        ].includes(fertilizer.p_type_rvo ?? "")
        const fertilizerOnFarmProduced = isDrijfmest // Assume drijfmest is on-farm, vaste mest is not for now.

        const p_n_wcl = getWorkingCoefficient(
            fertilizer.p_type_rvo,
            soilType,
            b_grazing_intention,
            isCurrentBouwland,
            p_app_date,
            fertilizerOnFarmProduced, // Pass the determined onFarmProduced status
        )

        // Calculate norm filling: amount * nitrogen content * (working coefficient / 100) / 1000
        const p_app_amount = new Decimal(application.p_app_amount)
        const normFilling = p_app_amount
            .times(p_n_rt)
            .times(p_n_wcl)
            .dividedBy(1000)
        totalNormFilling = totalNormFilling.plus(normFilling)

        applicationFillings.push({
            p_app_id: application.p_app_id,
            normFilling: normFilling.toNumber(),
        })
    }

    return {
        normFilling: totalNormFilling.toNumber(),
        applicationFilling: applicationFillings,
    }
}

/**
 * Determines if a field is considered "Bouwland" (arable land) at a given application date.
 * A field is not considered Bouwland if its active cultivation's `b_lu_catalogue` code
 * is one of the specified non-bouwland codes.
 *
 * @param {Cultivation[]} cultivations - An array of cultivations for the farm.
 * @param {Date} p_app_date - The date of the fertilizer application.
 * @returns {boolean} True if the field is considered Bouwland, false otherwise.
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
 * Determines the working coefficient for a given fertilizer application based on various conditions.
 * The working coefficient is retrieved from `table9` and depends on the fertilizer type,
 * whether it's produced on-farm, soil type, grazing intention, land use, and application date.
 *
 * @param {string | null | undefined} p_type_rvo - The RVO fertilizer type code.
 * @param {RegionKey | undefined} soilType - The soil type of the field.
 * @param {boolean} b_grazing_intention - Indicates if there is a grazing intention for the farm.
 * @param {boolean} isBouwland - True if the land is arable land (bouwland), false otherwise.
 * @param {Date} p_app_date - The date of the fertilizer application.
 * @param {boolean} fertilizerOnFarmProduced - True if the fertilizer is produced on the farm, false otherwise.
 * @returns {number} The working coefficient as a decimal (e.g., 0.45 for 45%). Defaults to 1.0 (100%) if no specific rule applies.
 */
export function getWorkingCoefficient(
    p_type_rvo: string | null | undefined,
    soilType: RegionKey | undefined,
    b_grazing_intention: boolean,
    isBouwland: boolean,
    p_app_date: Date,
    fertilizerOnFarmProduced: boolean, // New parameter
): number {
    const p_n_wcl = 1.0 // Default working coefficient is 100% (1.0)

    if (!p_type_rvo) {
        return p_n_wcl
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
                        !subType.grondsoortCode.includes(soilType as any)
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
                    return matchingSubType.p_n_wcl
                }
            } else if (entry.p_n_wcl !== undefined) {
                // If no subTypes, use the main entry's p_n_wcl
                return entry.p_n_wcl
            }
        }
    }

    return p_n_wcl // If no specific rule is found, return the default 100% (1.0)
}
