/**
 * @file This module calculates the nitrogen supply from various types of fertilizer applications.
 *
 * The primary function, `calculateNitrogenSupplyByFertilizers`, processes a list of
 * fertilizer applications and quantifies the total nitrogen supplied by each, categorizing
 * them by fertilizer type.
 *
 * @packageDocumentation
 */
import { Decimal } from "decimal.js"
import type {
    FertilizerDetail,
    FieldInput,
    NitrogenSupplyFertilizers,
} from "../types"

/**
 * Calculates the total nitrogen supply from all fertilizer applications on a field.
 *
 * This function iterates through a list of fertilizer applications and calculates the
 * total nitrogen supplied by each. It uses the application amount and the nitrogen
 * content (`p_n_rt`) of the fertilizer.
 *
 * The results are aggregated and categorized into mineral, manure, compost, and other
 * fertilizer types, providing a detailed breakdown of the nitrogen supply.
 *
 * @param fertilizerApplications - An array of fertilizer application events.
 * @param fertilizerDetailsMap - A map providing detailed data for each fertilizer type,
 *   including its nitrogen content.
 * @returns An object detailing the total and per-category nitrogen supply from fertilizers.
 * @throws {Error} If fertilizer details are missing for a given application.
 */
export function calculateNitrogenSupplyByFertilizers(
    fertilizerApplications: FieldInput["fertilizerApplications"],
    fertilizerDetailsMap: Map<string, FertilizerDetail>,
): NitrogenSupplyFertilizers {
    const initialSupply: NitrogenSupplyFertilizers = {
        total: new Decimal(0),
        mineral: { total: new Decimal(0), applications: [] },
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
                    `Fertilizer application ${application.p_app_id} has no fertilizerDetails`,
                )
            }

            const p_n_rt = new Decimal(fertilizerDetail.p_n_rt ?? 0)
            const p_app_amount = new Decimal(application.p_app_amount ?? 0)
            let applicationValue = new Decimal(0)

            // p_n_rt is g N per kg fertilizer; p_app_amount is kg fertilizer / ha
            // applicationValue is kg N / ha
            applicationValue = p_app_amount.times(p_n_rt).dividedBy(1000)
            const newApplicationEntry = {
                id: application.p_app_id,
                value: applicationValue,
            }

            switch (fertilizerDetail.p_type) {
                case "mineral":
                    acc.mineral.total = acc.mineral.total.add(applicationValue)
                    acc.mineral.applications.push(newApplicationEntry)
                    break
                case "manure":
                    acc.manure.total = acc.manure.total.add(applicationValue)
                    acc.manure.applications.push(newApplicationEntry)
                    break
                case "compost":
                    acc.compost.total = acc.compost.total.add(applicationValue)
                    acc.compost.applications.push(newApplicationEntry)
                    break
                default:
                    // This covers "other" types
                    acc.other.total = acc.other.total.add(applicationValue)
                    acc.other.applications.push(newApplicationEntry)
                    break
            }

            return acc
        },
        initialSupply,
    )

    // Calculate the total amount of Nitrogen supplied by all fertilizers
    aggregatedSupply.total = aggregatedSupply.mineral.total
        .add(aggregatedSupply.manure.total)
        .add(aggregatedSupply.compost.total)
        .add(aggregatedSupply.other.total)

    return aggregatedSupply
}
