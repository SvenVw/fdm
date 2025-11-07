/**
 * @file Calculates the "filling" of the phosphate usage norm (`fosfaatgebruiksnorm`) for the
 * Dutch regulations of 2025. This calculation is complex due to the "Stimulating organic-rich
 * fertilizers" regulation, which provides a discount on the phosphate contribution of certain
 * fertilizer types.
 *
 * @packageDocumentation
 */
import {
    type Fertilizer,
    type FertilizerApplication,
    withCalculationCache,
} from "@svenvw/fdm-core"
import Decimal from "decimal.js"
import pkg from "../../../../package"
import { table11Mestcodes } from "./table-11-mestcodes"
import type { NL2025NormsFillingInput, NormFilling } from "./types"

const rvoMestcodesOrganicRich25Percent = ["111", "112"] // Compost, Zeer schone compost
const rvoMestcodesOrganicRich75Percent = ["110", "10", "61", "25", "56"] // Champost, Rundvee - Vaste mest, Geiten - Vaste mest, Paarden - Vaste mest, Schapen - Mest, alle systemen
const rvoMestcodesOrganicRich75PercentOrganic = ["40"] // Varkens - Vaste mest (for organic certification)

/**
 * Calculates the norm filling for phosphate, applying the regulation for organic-rich fertilizers.
 *
 * This function implements the Dutch regulation that encourages the use of organic-rich
 * fertilizers by discounting their phosphate contribution to the usage norm. The logic includes:
 *
 * 1.  **Threshold Check**: Verifies if at least 20 kg/ha of P2O5 from organic-rich sources is applied.
 *     If not, all fertilizers are counted at 100% of their phosphate value.
 * 2.  **Prioritized Discounting**: If the threshold is met, it prioritizes fertilizers with a higher
 *     discount (25% contribution) over those with a lower discount (75% contribution) to maximize
 *     the farmer's benefit.
 * 3.  **Iterative Application**: The discount is applied iteratively up to the phosphate usage norm limit.
 *     Any phosphate applied from organic-rich sources that exceeds this limit is counted at 100%.
 *
 * @param input - The standardized input object containing application data, fertilizer definitions,
 *   and the phosphate usage norm for the field.
 * @returns An object detailing the total `normFilling` for phosphate and a breakdown for each
 *   individual `applicationFilling`, including details about any applied discounts.
 */
export function calculateNL2025FertilizerApplicationFillingForFosfaatGebruiksNorm(
    input: NL2025NormsFillingInput,
): NormFilling {
    const {
        applications,
        fertilizers,
        has_organic_certification,
        fosfaatgebruiksnorm,
    } = input

    // Create maps for efficient lookups of fertilizers and RVO types.
    // This avoids iterating over the arrays repeatedly in a loop.
    const fertilizersMap = new Map(
        fertilizers.map((fertilizer) => [
            fertilizer.p_id_catalogue,
            fertilizer,
        ]),
    )

    // Determines if at least 20 kg P2O5 / ha is applied with organic-rich fertilizers
    const condition1 =
        determineCondition1StimuleringOrganischeStofrijkeMeststoffen(
            applications,
            fertilizersMap,
            has_organic_certification,
        )

    let totalFilling = new Decimal(0)
    const normLimit = new Decimal(fosfaatgebruiksnorm)
    let remainingDiscountablePhosphate = normLimit // This tracks the remaining P that can be discounted

    // Separate applications into standard and organic-rich
    const standardApplications: {
        application: FertilizerApplication
        p_p_rt: Decimal
        p_app_amount: Decimal
    }[] = []
    const organicRichApplications: {
        application: FertilizerApplication
        p_p_rt: Decimal
        p_app_amount: Decimal
        p_type_rvo: string
        discountFactor: Decimal
        originalIndex: number
    }[] = []

    applications.forEach((application, index) => {
        const p_app_amount = new Decimal(application.p_app_amount ?? 0)
        const p_p_rt = new Decimal(
            fertilizersMap.get(application.p_id_catalogue)?.p_p_rt ??
                table11Mestcodes.find(
                    (t) =>
                        t.p_type_rvo ===
                        fertilizersMap.get(application.p_id_catalogue)
                            ?.p_type_rvo,
                )?.p_p_rt ??
                0,
        )
        const p_type_rvo =
            fertilizersMap.get(application.p_id_catalogue)?.p_type_rvo ?? ""

        if (
            rvoMestcodesOrganicRich25Percent.includes(p_type_rvo) ||
            rvoMestcodesOrganicRich75Percent.includes(p_type_rvo) ||
            (rvoMestcodesOrganicRich75PercentOrganic.includes(p_type_rvo) &&
                has_organic_certification)
        ) {
            let discountFactor: Decimal
            if (rvoMestcodesOrganicRich25Percent.includes(p_type_rvo)) {
                discountFactor = new Decimal(0.25)
            } else {
                discountFactor = new Decimal(0.75)
            }
            organicRichApplications.push({
                application,
                p_p_rt,
                p_app_amount,
                p_type_rvo,
                discountFactor,
                originalIndex: index,
            })
        } else {
            standardApplications.push({ application, p_p_rt, p_app_amount })
        }
    })

    // Sort organic-rich applications to prioritize 25% discount over 75% discount
    organicRichApplications.sort((a, b) =>
        a.discountFactor.cmp(b.discountFactor),
    )

    // Initialize applicationsFilling with placeholders to maintain original order
    const orderedApplicationsFilling: {
        p_app_id: string
        normFilling: number
        normFillingDetails?: string
    }[] = new Array(applications.length)

    // Process standard applications first
    for (const { application, p_p_rt, p_app_amount } of standardApplications) {
        const normFilling = p_app_amount.times(p_p_rt).dividedBy(1000)
        totalFilling = totalFilling.plus(normFilling)
        orderedApplicationsFilling[
            applications.findIndex(
                (app) => app.p_app_id === application.p_app_id,
            )
        ] = {
            p_app_id: application.p_app_id,
            normFilling: normFilling.toNumber(),
        }
    }

    // Process organic-rich applications with iterative discounting
    if (condition1) {
        for (const {
            application,
            p_p_rt,
            p_app_amount,
            discountFactor,
            originalIndex,
        } of organicRichApplications) {
            const actualPhosphateApplied = p_app_amount
                .times(p_p_rt)
                .dividedBy(1000)
            let currentApplicationFilling = new Decimal(0)
            let normFillingDetails: string

            // Calculate how much of this application can be discounted
            const phosphateToDiscount = Decimal.min(
                actualPhosphateApplied,
                remainingDiscountablePhosphate,
            )

            if (phosphateToDiscount.gt(0)) {
                currentApplicationFilling = currentApplicationFilling.plus(
                    phosphateToDiscount.times(discountFactor),
                )
                remainingDiscountablePhosphate =
                    remainingDiscountablePhosphate.minus(phosphateToDiscount)
                normFillingDetails = `OS-rijke meststof (${discountFactor.times(
                    100,
                )}% korting) draagt ${phosphateToDiscount
                    .times(discountFactor)
                    .toFixed(2)}kg bij aan de norm.`
            } else {
                normFillingDetails =
                    "OS-rijke meststof, geen korting toegepast."
            }

            // Add any remaining actual phosphate (beyond the discountable limit) at 100%
            const phosphateBeyondDiscount =
                actualPhosphateApplied.minus(phosphateToDiscount)
            if (phosphateBeyondDiscount.gt(0)) {
                currentApplicationFilling = currentApplicationFilling.plus(
                    phosphateBeyondDiscount,
                )
                normFillingDetails += ` Plus ${phosphateBeyondDiscount.toFixed(
                    2,
                )}kg (100% geteld) boven de kortingslimiet.`
            }

            totalFilling = totalFilling.plus(currentApplicationFilling)
            orderedApplicationsFilling[originalIndex] = {
                p_app_id: application.p_app_id,
                normFilling: currentApplicationFilling.toNumber(),
                normFillingDetails: normFillingDetails,
            }
        }
    } else {
        // If condition1 is not met, organic-rich fertilizers are counted at 100%
        for (const {
            application,
            p_p_rt,
            p_app_amount,
            originalIndex,
        } of organicRichApplications) {
            const normFilling = p_app_amount.times(p_p_rt).dividedBy(1000)
            totalFilling = totalFilling.plus(normFilling)
            orderedApplicationsFilling[originalIndex] = {
                p_app_id: application.p_app_id,
                normFilling: normFilling.toNumber(),
                normFillingDetails:
                    "OS-rijke meststof, minimumdrempel niet gehaald, 100% geteld.",
            }
        }
    }

    // Return the total norm filling and the breakdown per application.
    return {
        normFilling: totalFilling.toNumber(),
        applicationFilling: orderedApplicationsFilling,
    }
}

/**
 * Checks if the threshold for applying the organic-rich fertilizer discount is met.
 *
 * This function implements "Condition 1" of the regulation, which requires that a minimum
 * of 20 kg/ha of P2O5 from qualifying organic-rich fertilizers is applied.
 *
 * @param applications - An array of all fertilizer applications.
 * @param fertilizersMap - A map for quick lookup of fertilizer definitions.
 * @param has_organic_certification - A flag indicating if the farm is organically certified,
 *   which affects which fertilizers qualify.
 * @returns `true` if the 20 kg/ha threshold is met, otherwise `false`.
 * @internal
 */
function determineCondition1StimuleringOrganischeStofrijkeMeststoffen(
    applications: FertilizerApplication[],
    fertilizersMap: Map<string, Fertilizer>,
    has_organic_certification: boolean,
): boolean {
    // Set the RVO mestcodes for organic-rich fertilizers
    const rvoMestcodesOrganicRich = [
        ...rvoMestcodesOrganicRich25Percent,
        ...rvoMestcodesOrganicRich75Percent,
    ]
    if (has_organic_certification) {
        rvoMestcodesOrganicRich.push(...rvoMestcodesOrganicRich75PercentOrganic)
    }

    // Sum the phosphate dose of organic-rich fertilizers
    const totalPhosphateDoseOrganicDose = applications.reduce(
        (acc, application) => {
            const fertilizer = fertilizersMap.get(application.p_id_catalogue)
            if (!fertilizer) {
                return acc
            }

            const p_p_rt = new Decimal(
                fertilizer.p_p_rt ??
                    table11Mestcodes.find(
                        (t) => t.p_type_rvo === fertilizer.p_type_rvo,
                    )?.p_p_rt ??
                    0,
            )

            if (p_p_rt.isZero()) {
                return acc
            }

            const p_app_amount = new Decimal(application.p_app_amount ?? 0)
            const actualPhosphate = p_app_amount.times(p_p_rt).dividedBy(1000)

            if (rvoMestcodesOrganicRich.includes(fertilizer.p_type_rvo ?? "")) {
                return acc.plus(actualPhosphate)
            }
            return acc
        },
        new Decimal(0),
    )
    return totalPhosphateDoseOrganicDose.gte(20)
}

/**
 * A cached version of the `calculateNL2025FertilizerApplicationFillingForFosfaatGebruiksNorm` function.
 *
 * This function enhances performance by caching the results of the norm filling calculation.
 * The cache key is generated based on the function's input and the calculator's version,
 * ensuring that the cache is invalidated when the underlying logic or data changes.
 *
 * @param input - The standardized input object containing application data, fertilizer definitions,
 *   and the phosphate usage norm for the field.
 * @returns An object detailing the total `normFilling` for phosphate and a breakdown for each
 *   individual `applicationFilling`.
 */
export const getNL2025FertilizerApplicationFillingForFosfaatGebruiksNorm =
    withCalculationCache(
        calculateNL2025FertilizerApplicationFillingForFosfaatGebruiksNorm,
        "calculateNL2025FertilizerApplicationFillingForFosfaatGebruiksNorm",
        pkg.calculatorVersion,
    )
