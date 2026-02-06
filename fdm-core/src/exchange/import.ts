import { eq } from "drizzle-orm"
import { ZodError } from "zod"
import {
    enableCultivationCatalogue,
    enableFertilizerCatalogue,
} from "../catalogues"
import { addCultivation, addCultivationToCatalogue } from "../cultivation"
import * as schema from "../db/schema"
import { addDerogation } from "../derogation"
import { handleError } from "../error"
import { addFarm } from "../farm"
import type { FdmType } from "../fdm.d"
import {
    addFertilizer,
    addFertilizerApplication,
    addFertilizerToCatalogue,
} from "../fertilizer"
import { addField } from "../field"
import { setGrazingIntention } from "../grazing_intention"
import { addHarvest } from "../harvest"
import { createId } from "../id"
import { addOrganicCertification } from "../organic"
import { addSoilAnalysis } from "../soil"
import type { ExchangeData } from "./schemas"
import { exchangeSchema } from "./schemas"

/**
 * Formats a ZodError into a human-readable string.
 */
function formatZodError(error: ZodError): string {
    const issues = error.issues.map((issue) => {
        const path =
            issue.path.length > 0 ? ` at '${issue.path.join(".")}'` : ""
        return `- ${issue.message}${path}`
    })
    return `Validation failed:\n${issues.join("\n")}`
}

export type ImportProgress = {
    step: string
    current: number
    total: number
    message: string
}

export type ImportResult = {
    b_id_farm: string
}

/**
 * Imports a farm and all its associated data from a versioned JSON format.
 *
 * @param fdm The FDM instance.
 * @param principal_id The identifier of the principal performing the import.
 * @param data The JSON data to import.
 * @param onProgress Optional callback for progress reporting.
 * @returns A promise that resolves to the new farm ID.
 */
export async function importFarm(
    fdm: FdmType,
    principal_id: string,
    data: unknown,
    onProgress?: (progress: ImportProgress) => void,
): Promise<ImportResult> {
    // 1. Validation (Outside transaction to fail fast)
    let validatedData: ExchangeData
    try {
        validatedData = exchangeSchema.parse(data)
    } catch (err) {
        if (err instanceof ZodError) {
            throw new Error(formatZodError(err))
        }
        throw err
    }

    try {
        return await fdm.transaction(async (tx: FdmType) => {
            const idMap = new Map<string, string>()

            // Helper to report progress
            const report = (
                step: string,
                current: number,
                total: number,
                message: string,
            ) => {
                if (onProgress) onProgress({ step, current, total, message })
            }

            // 2. Import Farm
            report("farm", 0, 1, "Importing farm...")
            const newFarmId = await addFarm(
                tx,
                principal_id,
                validatedData.farm.b_name_farm,
                validatedData.farm.b_businessid_farm,
                validatedData.farm.b_address_farm,
                validatedData.farm.b_postalcode_farm,
            )
            idMap.set(validatedData.farm.b_id_farm, newFarmId)
            report("farm", 1, 1, "Farm imported.")

            // 3. Private Catalogues

            // 3.1 Fertilizers Catalogue
            const privateFertilizers =
                validatedData.fertilizers_catalogue.filter(
                    (f) => f.p_source === validatedData.farm.b_id_farm,
                )
            report(
                "catalogues",
                0,
                privateFertilizers.length,
                "Importing custom fertilizers...",
            )
            for (let i = 0; i < privateFertilizers.length; i++) {
                const f = privateFertilizers[i]
                const newCatId = await addFertilizerToCatalogue(
                    tx,
                    principal_id,
                    newFarmId,
                    f as any,
                )
                idMap.set(f.p_id_catalogue, newCatId)
                report(
                    "catalogues",
                    i + 1,
                    privateFertilizers.length,
                    `Imported fertilizer ${f.p_name_nl}`,
                )
            }

            // 3.2 Cultivations Catalogue
            const privateCultivations =
                validatedData.cultivations_catalogue.filter(
                    (c) => c.b_lu_source === validatedData.farm.b_id_farm,
                )
            report(
                "catalogues",
                0,
                privateCultivations.length,
                "Importing custom cultivations...",
            )
            for (let i = 0; i < privateCultivations.length; i++) {
                const c = privateCultivations[i]
                const newCatId = createId()
                await addCultivationToCatalogue(tx, {
                    ...c,
                    b_lu_catalogue: newCatId,
                    b_lu_source: newFarmId,
                } as any)
                idMap.set(c.b_lu_catalogue, newCatId)
                report(
                    "catalogues",
                    i + 1,
                    privateCultivations.length,
                    `Imported cultivation ${c.b_lu_name}`,
                )
            }

            // 4. Fields
            report(
                "fields",
                0,
                validatedData.fields.length,
                "Importing fields...",
            )
            for (let i = 0; i < validatedData.fields.length; i++) {
                const field = validatedData.fields[i]
                const acquiring = validatedData.field_acquiring.find(
                    (fa) => fa.b_id === field.b_id,
                )
                if (!acquiring) continue // Should not happen with valid data

                const discarding = validatedData.field_discarding.find(
                    (fd) => fd.b_id === field.b_id,
                )

                const newFieldId = await addField(
                    tx,
                    principal_id,
                    newFarmId,
                    field.b_name,
                    field.b_id_source,
                    field.b_geometry as any,
                    acquiring.b_start,
                    acquiring.b_acquiring_method,
                    discarding?.b_end,
                    field.b_bufferstrip,
                )
                idMap.set(field.b_id, newFieldId)
                report(
                    "fields",
                    i + 1,
                    validatedData.fields.length,
                    `Imported field ${field.b_name}`,
                )
            }

            // 5. Soil Analyses
            report(
                "soil",
                0,
                validatedData.soil_analysis.length,
                "Importing soil analyses...",
            )
            for (let i = 0; i < validatedData.soil_analysis.length; i++) {
                const analysis = validatedData.soil_analysis[i]
                const sampling = validatedData.soil_sampling.find(
                    (ss) => ss.a_id === analysis.a_id,
                )
                if (!sampling) continue

                const newFieldId = idMap.get(sampling.b_id)
                if (!newFieldId) continue

                const newAnalysisId = await addSoilAnalysis(
                    tx,
                    principal_id,
                    analysis.a_date,
                    analysis.a_source,
                    newFieldId,
                    sampling.a_depth_lower,
                    sampling.b_sampling_date,
                    analysis,
                    sampling.a_depth_upper,
                )
                idMap.set(analysis.a_id, newAnalysisId)
                report(
                    "soil",
                    i + 1,
                    validatedData.soil_analysis.length,
                    "Imported soil analysis",
                )
            }

            // 6. Cultivations
            report(
                "cultivations",
                0,
                validatedData.cultivations.length,
                "Importing cultivations...",
            )
            for (let i = 0; i < validatedData.cultivations.length; i++) {
                const cult = validatedData.cultivations[i]
                const start = validatedData.cultivation_starting.find(
                    (cs) => cs.b_lu === cult.b_lu,
                )
                if (!start) continue

                const newFieldId = idMap.get(start.b_id)
                if (!newFieldId) continue

                // Map catalogue ID if it was private
                const newCatId =
                    idMap.get(cult.b_lu_catalogue) || cult.b_lu_catalogue

                // We add cultivation WITHOUT end date initially to avoid automatic harvest creation
                // for 'once' harvestable crops in addCultivation domain function.
                const newCultId = await addCultivation(
                    tx,
                    principal_id,
                    newCatId,
                    newFieldId,
                    start.b_lu_start,
                    undefined, // b_lu_end
                    undefined, // m_cropresidue
                    cult.b_lu_variety,
                )
                idMap.set(cult.b_lu, newCultId)
                report(
                    "cultivations",
                    i + 1,
                    validatedData.cultivations.length,
                    "Imported cultivation",
                )
            }

            // 7. Harvests
            report(
                "harvests",
                0,
                validatedData.cultivation_harvesting.length,
                "Importing harvests...",
            )
            for (
                let i = 0;
                i < validatedData.cultivation_harvesting.length;
                i++
            ) {
                const ch = validatedData.cultivation_harvesting[i]
                const sampling = validatedData.harvestable_sampling.find(
                    (hs) => hs.b_id_harvestable === ch.b_id_harvestable,
                )
                if (!sampling) continue

                const analysis = validatedData.harvestable_analyses.find(
                    (ha) =>
                        ha.b_id_harvestable_analysis ===
                        sampling.b_id_harvestable_analysis,
                )
                if (!analysis) continue

                const newCultId = idMap.get(ch.b_lu)
                if (!newCultId) continue

                await addHarvest(
                    tx,
                    principal_id,
                    newCultId,
                    ch.b_lu_harvest_date,
                    analysis,
                )
                report(
                    "harvests",
                    i + 1,
                    validatedData.cultivation_harvesting.length,
                    "Imported harvest",
                )
            }

            // 7.5 Fix Cultivation End Dates (those that were skipped in step 6)
            report(
                "cultivations",
                0,
                validatedData.cultivations.length,
                "Finalizing cultivation dates...",
            )
            for (let i = 0; i < validatedData.cultivations.length; i++) {
                const cult = validatedData.cultivations[i]
                const end = validatedData.cultivation_ending.find(
                    (ce) => ce.b_lu === cult.b_lu,
                )
                if (!end || (!end.b_lu_end && end.m_cropresidue === null))
                    continue

                const newCultId = idMap.get(cult.b_lu)
                if (!newCultId) continue

                await tx
                    .update(schema.cultivationEnding)
                    .set({
                        b_lu_end: end.b_lu_end,
                        m_cropresidue: end.m_cropresidue,
                    })
                    .where(eq(schema.cultivationEnding.b_lu, newCultId))
            }

            // 8. Fertilizers (Acquiring & Application)

            // 8.1 Fertilizer Acquiring
            report(
                "fertilizers",
                0,
                validatedData.fertilizer_acquiring.length,
                "Importing fertilizer acquisitions...",
            )
            for (
                let i = 0;
                i < validatedData.fertilizer_acquiring.length;
                i++
            ) {
                const fa = validatedData.fertilizer_acquiring[i]

                // Find the catalogue ID for this fertilizer from the picking table
                const picking = validatedData.fertilizer_picking.find(
                    (fp) => fp.p_id === fa.p_id,
                )
                const catId = picking?.p_id_catalogue
                const newCatId = idMap.get(catId) || catId

                if (!newCatId) continue

                const newPId = await addFertilizer(
                    tx,
                    principal_id,
                    newCatId,
                    newFarmId,
                    fa.p_acquiring_amount,
                    fa.p_acquiring_date,
                )
                idMap.set(fa.p_id, newPId)

                // Restore original picking date if it was custom
                if (picking?.p_picking_date) {
                    await tx
                        .update(schema.fertilizerPicking)
                        .set({ p_picking_date: picking.p_picking_date })
                        .where(eq(schema.fertilizerPicking.p_id, newPId))
                }

                report(
                    "fertilizers",
                    i + 1,
                    validatedData.fertilizer_acquiring.length,
                    "Imported fertilizer acquisition",
                )
            }

            // 8.2 Fertilizer Application
            report(
                "fertilizers",
                0,
                validatedData.fertilizer_applying.length,
                "Importing fertilizer applications...",
            )
            for (let i = 0; i < validatedData.fertilizer_applying.length; i++) {
                const app = validatedData.fertilizer_applying[i]
                const newFieldId = idMap.get(app.b_id)
                const newPId = idMap.get(app.p_id)

                if (!newFieldId || !newPId) continue

                await addFertilizerApplication(
                    tx,
                    principal_id,
                    newFieldId,
                    newPId,
                    app.p_app_amount,
                    app.p_app_method,
                    app.p_app_date,
                )
                report(
                    "fertilizers",
                    i + 1,
                    validatedData.fertilizer_applying.length,
                    "Imported fertilizer application",
                )
            }

            // 9. Miscelaneous

            // 9.1 Derogations
            for (const da of validatedData.derogation_applying) {
                const d = validatedData.derogations.find(
                    (dero) => dero.b_id_derogation === da.b_id_derogation,
                )
                if (d) {
                    await addDerogation(
                        tx,
                        principal_id,
                        newFarmId,
                        d.b_derogation_year,
                    )
                }
            }

            // 9.2 Organic Certifications
            for (const och of validatedData.organic_certifications_holding) {
                const oc = validatedData.organic_certifications.find(
                    (cert) => cert.b_id_organic === och.b_id_organic,
                )
                if (oc) {
                    await addOrganicCertification(
                        tx,
                        principal_id,
                        newFarmId,
                        oc.b_organic_traces,
                        oc.b_organic_skal,
                        oc.b_organic_issued,
                        oc.b_organic_expires,
                    )
                }
            }

            // 9.3 Grazing Intentions
            for (const ig of validatedData.intending_grazing) {
                await setGrazingIntention(
                    tx,
                    principal_id,
                    newFarmId,
                    ig.b_grazing_intention_year,
                    ig.b_grazing_intention,
                )
            }

            // 10. Catalogue Enabling/Selecting
            for (const fe of validatedData.fertilizer_catalogue_enabling) {
                await enableFertilizerCatalogue(
                    tx,
                    principal_id,
                    newFarmId,
                    fe.p_source,
                )
            }
            for (const cs of validatedData.cultivation_catalogue_selecting) {
                await enableCultivationCatalogue(
                    tx,
                    principal_id,
                    newFarmId,
                    cs.b_lu_source,
                )
            }

            return { b_id_farm: newFarmId }
        })
    } catch (err) {
        throw handleError(err, "Exception for importFarm")
    }
}
