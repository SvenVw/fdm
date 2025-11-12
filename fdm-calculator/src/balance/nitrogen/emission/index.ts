/**
 * @file This module calculates total nitrogen emissions from a field by aggregating various
 * emission pathways. It serves as an orchestrator, calling specialized functions to quantify
 * emissions from different sources, such as ammonia volatilization and nitrate leaching.
 *
 * The primary function, `calculateNitrogenEmission`, combines these individual emission
 * calculations into a single, comprehensive `NitrogenEmission` object.
 *
 * @packageDocumentation
 */
import type {
    CultivationDetail,
    FertilizerDetail,
    FieldInput,
    NitrogenEmission,
} from "../types"
import { calculateNitrogenEmissionViaAmmonia } from "./ammonia"
import { calculateNitrogenEmissionViaNitrate } from "./nitrate"

/**
 * Calculates the total nitrogen emission from a field by summing losses from various pathways.
 *
 * This function integrates calculations for different forms of nitrogen loss, including:
 * - Ammonia (`NH3`) volatilization from fertilizers and crop residues.
 * - Nitrate (`NO3`) leaching.
 *
 * It calls dedicated calculators for each pathway and aggregates their results to provide a
 * complete picture of nitrogen emissions for a given field.
 *
 * @param cultivations - An array of cultivations occurring on the field.
 * @param harvests - An array of harvest events from the field.
 * @param fertilizerApplications - An array of fertilizer application events.
 * @param cultivationDetailsMap - A map providing detailed data for each cultivation type.
 * @param fertilizerDetailsMap - A map providing detailed data for each fertilizer type.
 * @returns A `NitrogenEmission` object detailing the total and component-specific nitrogen losses.
 */
export function calculateNitrogenEmission(
    cultivations: FieldInput["cultivations"],
    harvests: FieldInput["harvests"],
    fertilizerApplications: FieldInput["fertilizerApplications"],
    cultivationDetailsMap: Map<string, CultivationDetail>,
    fertilizerDetailsMap: Map<string, FertilizerDetail>,
): NitrogenEmission {
    /** Calculate the total amount of Nitrogen volatilized as Ammonia by fertilizer */
    const ammonia = calculateNitrogenEmissionViaAmmonia(
        cultivations,
        harvests,
        fertilizerApplications,
        cultivationDetailsMap,
        fertilizerDetailsMap,
    )

    /** Calculate the total amount of Nitrogen volatilized as Ammonia by crop residues */
    const nitrate = calculateNitrogenEmissionViaNitrate()

    const emission = {
        total: ammonia.total.add(nitrate.total),
        ammonia: ammonia,
        nitrate: nitrate,
    }

    return emission
}
