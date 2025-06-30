import type {
    Cultivation,
    FdmType,
    Field,
    SoilAnalysis,
} from "@svenvw/fdm-core"
import type {
    NL2025NormsInput,
    NL2025NormsInputForCultivation,
    NL2025NormsInputForField,
} from "./types.d"

/**
 * Collects all necessary input data from the FDM to calculate the Dutch (NL) norms for the year 2025.
 *
 * This function orchestrates fetching data for a given farm, its fields, cultivations, and soil analyses,
 * and structures it into a format suitable for the various NL 2025 norm calculation functions.
 *
 * @param fdm - An initialized FdmType instance for data access.
 * @param b_id_farm - The unique identifier of the farm for which to collect data.
 * @returns A promise that resolves to an `NL2025NormsInput` object, containing all the
 *   structured data required for the norm calculations.
 */
export async function collectNL2025InputForNorms(
    fdm: FdmType,
    b_id_farm: string,
): Promise<NL2025NormsInput> {
    // 1. Get farm-level data.
    // Assumes `getFarm` exists and might return a property `is_derogatie_bedrijf`.
    // Defaulting to `false` if not present.
    const farmDetails = await fdm.getFarm({ b_id_farm })
    const is_derogatie_bedrijf = farmDetails?.is_derogatie_bedrijf || false

    // 2. Get all fields for the farm.
    const fields = await fdm.getFields({ b_id_farm })

    // 3. Process each field to gather its cultivations and related data.
    const fieldsInputPromises = fields.map(async (field: Field) => {
        const cultivationsOnField = await fdm.getCultivations({
            b_id_farm,
            b_id_field: field.b_id,
        })

        const cultivationsInputPromises = cultivationsOnField.map(
            async (cultivation: Cultivation) => {
                // Get the most recent soil analysis before this cultivation started.
                const soilAnalyses = await fdm.getSoilAnalyses({
                    b_id_farm,
                    b_id_field: field.b_id,
                    timeframe: { end: cultivation.b_lu_start },
                })
                const latestSoilAnalysis = soilAnalyses
                    .sort(
                        (a: SoilAnalysis, b: SoilAnalysis) =>
                            b.b_sampling_date.getTime() -
                            a.b_sampling_date.getTime(),
                    )
                    .at(0)

                const result: NL2025NormsInputForCultivation = {
                    cultivation: {
                        b_lu: cultivation.b_lu,
                        b_lu_catalogue: cultivation.b_lu_catalogue,
                        b_lu_start: cultivation.b_lu_start,
                        b_lu_end: cultivation.b_lu_end,
                        b_lu_variety: cultivation.b_lu_variety,
                    },
                    soilAnalysis: latestSoilAnalysis
                        ? {
                              a_p_cc: latestSoilAnalysis.a_p_cc,
                              a_p_al: latestSoilAnalysis.a_p_al,
                          }
                        : undefined,
                }
                return result
            },
        )

        const cultivations = await Promise.all(cultivationsInputPromises)

        const fieldInput: NL2025NormsInputForField = {
            field: {
                b_id: field.b_id,
                b_centroid: field.b_centroid,
            },
            cultivations,
        }
        return fieldInput
    })

    const fieldsInput = await Promise.all(fieldsInputPromises)

    return {
        farm: {
            is_derogatie_bedrijf,
        },
        fields: fieldsInput,
    }
}
