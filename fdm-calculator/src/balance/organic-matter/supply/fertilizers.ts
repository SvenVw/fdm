import Decimal from "decimal.js"
import type {
    OrganicMatterSupplyFertilizers,
    FertilizerDetail,
    FieldInput,
} from "../types.d"

/**
 * Calculates the total organic matter supply from all fertilizer sources (manure, compost and other fertilizers).
 *
 * This function aggregates the organic matter contributions from manure, compost and other fertilizers
 * by iterating through the applications once and directing each to the appropriate calculation.
 * @param fertilizerApplications - An array of fertilizer applications, each containing the application amount and a reference to the fertilizer details.
 * @param fertilizerDetailsMap - A map containing details for each fertilizer, including its type and organic matter content.
 * @returns An object containing the total organic matter supplied by all fertilizers, as well as a breakdown by fertilizer type (manure, compost, other).
 */
export function calculateOrganicMatterSupplyByFertilizers(
    fertilizerApplications: FieldInput["fertilizerApplications"],
    fertilizerDetailsMap: Map<string, FertilizerDetail>,
): OrganicMatterSupplyFertilizers {
    const initialSupply: OrganicMatterSupplyFertilizers = {
        total: new Decimal(0),
        manure: { total: new Decimal(0), applications: [] },
        compost: { total: new Decimal(0), applications: [] },
        other: { total: new Decimal(0), applications: [] },
    }

    const aggregatedSupply = fertilizerApplications.reduce(
        (acc, application) => {
            const fertilizerDetail = fertilizerDetailsMap.get(
                application.p_id_catalogue,
            )

            if (!fertilizerDetail) {
                throw new Error(
                    `Fertilizer application ${application.p_id} has no fertilizerDetails`,
                )
            }
            if (fertilizerDetail.p_eom === undefined || fertilizerDetail.p_eom === null) {
                // Skip if no organic matter content is defined for this fertilizer
                return acc;
            }

            const p_eom = new Decimal(fertilizerDetail.p_eom)
            const p_amount = new Decimal(application.p_amount ?? 0)
            let applicationValue = new Decimal(0)

            // p_eom is g OM per kg fertilizer; p_amount is kg fertilizer / ha
            // applicationValue is kg OM / ha
            applicationValue = p_amount.times(p_eom).dividedBy(1000)
            const newApplicationEntry = {
                id: application.p_id,
                value: applicationValue,
            }

            switch (fertilizerDetail.p_type) {
                case "manure":
                    acc.manure.total = acc.manure.total.add(applicationValue)
                    acc.manure.applications.push(newApplicationEntry)
                    break
                case "compost":
                    acc.compost.total = acc.compost.total.add(applicationValue)
                    acc.compost.applications.push(newApplicationEntry)
                    break
                default:
                    // This covers "other" types and "mineral" type (since mineral fertilizers have no p_eom)
                    acc.other.total = acc.other.total.add(applicationValue)
                    acc.other.applications.push(newApplicationEntry)
                    break
            }

            return acc
        },
        initialSupply,
    )

    // Calculate the total amount of Organic Matter supplied by all fertilizers
    aggregatedSupply.total = aggregatedSupply.manure.total
        .add(aggregatedSupply.compost.total)
        .add(aggregatedSupply.other.total)

    return aggregatedSupply
}
