import type {
    FdmType,
    PrincipalId,
    Timeframe,
    fdmSchema,
} from "@svenvw/fdm-core"
import {
    getCultivations,
    getCultivationsFromCatalogue,
    getFertilizerApplications,
    getFertilizers,
    getFields,
    getHarvests,
    getSoilAnalyses,
} from "@svenvw/fdm-core"
import type { NitrogenBalanceInput } from "./types"

/**
 * Collects necessary input data from a FDM instance for calculating the nitrogen balance.
 *
 * This function orchestrates the retrieval of data related to fields, cultivations,
 * harvests, soil analyses, fertilizer applications, fertilizer details, and cultivation details
 * within a specified farm and timeframe. It fetches data from the FDM database and structures
 * it into a `NitrogenBalanceInput` object.
 *
 * @param fdm - The FDM instance for database interaction.
 * @param principal_id - The ID of the principal (user or service) initiating the data collection.
 * @param b_id_farm - The ID of the farm for which to collect the nitrogen balance input.
 * @param timeframe - The timeframe for which to collect the data.
 * @param fdmPublicDataUrl - The base URL for accessing FDM public data.
 * @returns A promise that resolves with a `NitrogenBalanceInput` object containing all the necessary data.
 * @throws {Error} - Throws an error if data collection or processing fails.
 *
 * @alpha
 */
export async function collectInputForNitrogenBalance(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id_farm: fdmSchema.farmsTypeSelect["b_id_farm"],
    timeframe: Timeframe,
    fdmPublicDataUrl: string,
): Promise<NitrogenBalanceInput> {
    try {
        return await fdm.transaction(async (tx: FdmType) => {
            // Collect the fields for the farm
            const farmFields = await getFields(
                tx,
                principal_id,
                b_id_farm,
                timeframe,
            )

            // Collect the details per field
            const fields = await Promise.all(
                farmFields.map(async (field) => {
                    // Collect the cultivations of the field
                    const cultivations = await getCultivations(
                        tx,
                        principal_id,
                        field.b_id,
                        timeframe,
                    )

                    // Collect the harvests of the cultivations
                    // Collect a promise per cultivation
                    const harvestPromises = cultivations.map(
                        async (cultivation) => {
                            return await getHarvests(
                                tx,
                                principal_id,
                                cultivation.b_lu,
                                timeframe,
                            )
                        },
                    )

                    // Wait for all, then flatten the resulting arrays into one list
                    const harvestArrays = await Promise.all(harvestPromises)
                    const harvests = harvestArrays.flat()
                    const harvestsFiltered = harvests.filter(
                        (harvest) => harvest.b_lu !== undefined,
                    )

                    // Get the soil analyses of the field
                    const soilAnalyses = await getSoilAnalyses(
                        tx,
                        principal_id,
                        field.b_id,
                        timeframe,
                    )

                    // Get the fertilizer applications of the field
                    const fertilizerApplications =
                        await getFertilizerApplications(
                            tx,
                            principal_id,
                            field.b_id,
                            timeframe,
                        )

                    return {
                        field: field,
                        cultivations: cultivations,
                        harvests: harvestsFiltered,
                        fertilizerApplications: fertilizerApplications,
                        soilAnalyses: soilAnalyses,
                    }
                }),
            )

            // Collect the details of the fertilizers
            const fertilizerDetails = await getFertilizers(
                tx,
                principal_id,
                b_id_farm,
            )

            // Collect the details of the cultivations
            const cultivationDetails = await getCultivationsFromCatalogue(
                tx,
                principal_id,
                b_id_farm,
            )

            return {
                fields,
                fertilizerDetails: fertilizerDetails,
                cultivationDetails: cultivationDetails,
                timeFrame: timeframe,
                fdmPublicDataUrl: fdmPublicDataUrl,
            }
        })
    } catch (error) {
        throw new Error(
            `Failed to collect nitrogen balance input for farm ${b_id_farm}: ${
                error instanceof Error ? error.message : String(error)
            }`,
            { cause: error },
        )
    }
}
