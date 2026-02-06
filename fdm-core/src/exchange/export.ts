import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { eq, inArray } from "drizzle-orm"
import * as schema from "../db/schema"
import { handleError } from "../error"
import type { FdmType } from "../fdm"
import { checkPermission } from "../authorization"
import { stripAuditFields } from "./schemas"
import type { ExchangeData } from "./schemas"
import { getLatestMigrationVersion } from "./utils"

/**
 * Exports all data for a specific farm into a versioned JSON format.
 *
 * @param fdm The FDM instance providing the connection to the database.
 * @param principal_id The identifier of the principal making the request.
 * @param b_id_farm The unique identifier of the farm to export.
 * @returns A promise that resolves to the exported data in the exchange format.
 *
 * @throws {Error} If permission checks fail or if the farm is not found.
 */
export async function exportFarm(
    fdm: FdmType,
    principal_id: string,
    b_id_farm: string,
): Promise<ExchangeData> {
    try {
        return await fdm.transaction(async (tx: FdmType) => {
            // 1. Permission Check
            await checkPermission(
                tx,
                "farm",
                "read",
                b_id_farm,
                principal_id,
                "exportFarm",
            )

            // 2. Collect Farm Data
            const farms = await tx
                .select()
                .from(schema.farms)
                .where(eq(schema.farms.b_id_farm, b_id_farm))
                .limit(1)

            if (farms.length === 0) {
                throw new Error(`Farm with ID ${b_id_farm} not found.`)
            }
            const farm = farms[0]

            // 3. Collect Related Data

            // Fields
            const fieldAcquiring = await tx
                .select()
                .from(schema.fieldAcquiring)
                .where(eq(schema.fieldAcquiring.b_id_farm, b_id_farm))

            const fieldIds = fieldAcquiring.map(
                (fa: schema.fieldAcquiringTypeSelect) => fa.b_id,
            )

            let fields: schema.fieldsTypeSelect[] = []
            let fieldDiscarding: schema.fieldDiscardingTypeSelect[] = []
            let cultivations: schema.cultivationsTypeSelect[] = []
            let cultivationStarting: schema.cultivationStartingTypeSelect[] = []
            let cultivationEnding: schema.cultivationEndingTypeSelect[] = []
            let cultivationHarvesting: schema.cultivationHarvestingTypeSelect[] =
                []
            let soilSampling: schema.soilSamplingTypeSelect[] = []
            let soilAnalysis: schema.soilAnalysisTypeSelect[] = []
            let fertilizerApplication: schema.fertilizerApplicationTypeSelect[] =
                []
            let harvestableSampling: schema.harvestableSamplingTypeSelect[] = []
            let harvestables: schema.harvestablesTypeSelect[] = []
            let harvestableAnalyses: schema.harvestableAnalysesTypeSelect[] = []

            if (fieldIds.length > 0) {
                fields = await tx
                    .select()
                    .from(schema.fields)
                    .where(inArray(schema.fields.b_id, fieldIds))

                fieldDiscarding = await tx
                    .select()
                    .from(schema.fieldDiscarding)
                    .where(inArray(schema.fieldDiscarding.b_id, fieldIds))

                soilSampling = await tx
                    .select()
                    .from(schema.soilSampling)
                    .where(inArray(schema.soilSampling.b_id, fieldIds))

                const soilAnalysisIds = soilSampling.map(
                    (ss: schema.soilSamplingTypeSelect) => ss.a_id,
                )
                if (soilAnalysisIds.length > 0) {
                    soilAnalysis = await tx
                        .select()
                        .from(schema.soilAnalysis)
                        .where(
                            inArray(schema.soilAnalysis.a_id, soilAnalysisIds),
                        )
                }

                fertilizerApplication = await tx
                    .select()
                    .from(schema.fertilizerApplication)
                    .where(inArray(schema.fertilizerApplication.b_id, fieldIds))

                cultivationStarting = await tx
                    .select()
                    .from(schema.cultivationStarting)
                    .where(inArray(schema.cultivationStarting.b_id, fieldIds))

                const cultivationIds = cultivationStarting.map(
                    (cs: schema.cultivationStartingTypeSelect) => cs.b_lu,
                )
                if (cultivationIds.length > 0) {
                    cultivations = await tx
                        .select()
                        .from(schema.cultivations)
                        .where(
                            inArray(schema.cultivations.b_lu, cultivationIds),
                        )

                    cultivationEnding = await tx
                        .select()
                        .from(schema.cultivationEnding)
                        .where(
                            inArray(
                                schema.cultivationEnding.b_lu,
                                cultivationIds,
                            ),
                        )

                    cultivationHarvesting = await tx
                        .select()
                        .from(schema.cultivationHarvesting)
                        .where(
                            inArray(
                                schema.cultivationHarvesting.b_lu,
                                cultivationIds,
                            ),
                        )

                    const harvestableIds = cultivationHarvesting.map(
                        (ch: schema.cultivationHarvestingTypeSelect) =>
                            ch.b_id_harvestable,
                    )
                    if (harvestableIds.length > 0) {
                        harvestables = await tx
                            .select()
                            .from(schema.harvestables)
                            .where(
                                inArray(
                                    schema.harvestables.b_id_harvestable,
                                    harvestableIds,
                                ),
                            )

                        harvestableSampling = await tx
                            .select()
                            .from(schema.harvestableSampling)
                            .where(
                                inArray(
                                    schema.harvestableSampling.b_id_harvestable,
                                    harvestableIds,
                                ),
                            )

                        const haIds = harvestableSampling.map(
                            (hs: schema.harvestableSamplingTypeSelect) =>
                                hs.b_id_harvestable_analysis,
                        )
                        if (haIds.length > 0) {
                            harvestableAnalyses = await tx
                                .select()
                                .from(schema.harvestableAnalyses)
                                .where(
                                    inArray(
                                        schema.harvestableAnalyses
                                            .b_id_harvestable_analysis,
                                        haIds,
                                    ),
                                )
                        }
                    }
                }
            }

            // Fertilizers
            const fertilizerAcquiring = await tx
                .select()
                .from(schema.fertilizerAcquiring)
                .where(eq(schema.fertilizerAcquiring.b_id_farm, b_id_farm))

            const acquiringPIds = fertilizerAcquiring.map(
                (fa: schema.fertilizerAcquiringTypeSelect) => fa.p_id,
            )
            const appPIds = fertilizerApplication.map(
                (fa: schema.fertilizerApplicationTypeSelect) => fa.p_id,
            )
            const allPIds = Array.from(new Set([...acquiringPIds, ...appPIds]))

            let fertilizers: schema.fertilizersTypeSelect[] = []
            let fertilizerPicking: schema.fertilizerPickingTypeSelect[] = []
            const usedFertilizerCatalogueIds = new Set<string>()

            if (allPIds.length > 0) {
                fertilizers = await tx
                    .select()
                    .from(schema.fertilizers)
                    .where(inArray(schema.fertilizers.p_id, allPIds))

                fertilizerPicking = await tx
                    .select()
                    .from(schema.fertilizerPicking)
                    .where(inArray(schema.fertilizerPicking.p_id, allPIds))

                fertilizerPicking.forEach(
                    (fp: schema.fertilizerPickingTypeSelect) => {
                        usedFertilizerCatalogueIds.add(fp.p_id_catalogue)
                    },
                )
            }

            const customFertilizersCatalogue = await tx
                .select()
                .from(schema.fertilizersCatalogue)
                .where(eq(schema.fertilizersCatalogue.p_source, b_id_farm))

            const customFertilizerCatalogueIds = customFertilizersCatalogue.map(
                (c: schema.fertilizersCatalogueTypeSelect) => c.p_id_catalogue,
            )
            const allFertilizerCatalogueIds = Array.from(
                new Set([
                    ...usedFertilizerCatalogueIds,
                    ...customFertilizerCatalogueIds,
                ]),
            )

            let fertilizersCatalogue: schema.fertilizersCatalogueTypeSelect[] =
                []
            if (allFertilizerCatalogueIds.length > 0) {
                fertilizersCatalogue = await tx
                    .select()
                    .from(schema.fertilizersCatalogue)
                    .where(
                        inArray(
                            schema.fertilizersCatalogue.p_id_catalogue,
                            allFertilizerCatalogueIds,
                        ),
                    )
            }

            // Cultivations Catalogue
            const usedCultivationCatalogueIds = new Set<string>()
            cultivations.forEach((c: schema.cultivationsTypeSelect) => {
                usedCultivationCatalogueIds.add(c.b_lu_catalogue)
            })

            const customCultivationsCatalogue = await tx
                .select()
                .from(schema.cultivationsCatalogue)
                .where(eq(schema.cultivationsCatalogue.b_lu_source, b_id_farm))

            const customCultivationCatalogueIds =
                customCultivationsCatalogue.map(
                    (c: schema.cultivationsCatalogueTypeSelect) =>
                        c.b_lu_catalogue,
                )
            const allCultivationCatalogueIds = Array.from(
                new Set([
                    ...usedCultivationCatalogueIds,
                    ...customCultivationCatalogueIds,
                ]),
            )

            let cultivationsCatalogue: schema.cultivationsCatalogueTypeSelect[] =
                []
            if (allCultivationCatalogueIds.length > 0) {
                cultivationsCatalogue = await tx
                    .select()
                    .from(schema.cultivationsCatalogue)
                    .where(
                        inArray(
                            schema.cultivationsCatalogue.b_lu_catalogue,
                            allCultivationCatalogueIds,
                        ),
                    )
            }

            // Derogations
            const derogationApplying = await tx
                .select()
                .from(schema.derogationApplying)
                .where(eq(schema.derogationApplying.b_id_farm, b_id_farm))

            const derogationIds = derogationApplying.map(
                (da: schema.derogationApplyingTypeSelect) => da.b_id_derogation,
            )
            let derogations: schema.derogationsTypeSelect[] = []
            if (derogationIds.length > 0) {
                derogations = await tx
                    .select()
                    .from(schema.derogations)
                    .where(
                        inArray(
                            schema.derogations.b_id_derogation,
                            derogationIds,
                        ),
                    )
            }

            // Organic Certifications
            const organicCertificationsHolding = await tx
                .select()
                .from(schema.organicCertificationsHolding)
                .where(
                    eq(
                        schema.organicCertificationsHolding.b_id_farm,
                        b_id_farm,
                    ),
                )

            const organicCertificationIds = organicCertificationsHolding.map(
                (och: schema.organicCertificationsHoldingTypeSelect) =>
                    och.b_id_organic,
            )
            let organicCertifications: schema.organicCertificationsTypeSelect[] =
                []
            if (organicCertificationIds.length > 0) {
                organicCertifications = await tx
                    .select()
                    .from(schema.organicCertifications)
                    .where(
                        inArray(
                            schema.organicCertifications.b_id_organic,
                            organicCertificationIds,
                        ),
                    )
            }

            // Other Farm Data
            const intendingGrazing = await tx
                .select()
                .from(schema.intendingGrazing)
                .where(eq(schema.intendingGrazing.b_id_farm, b_id_farm))

            const fertilizerCatalogueEnabling = await tx
                .select()
                .from(schema.fertilizerCatalogueEnabling)
                .where(
                    eq(schema.fertilizerCatalogueEnabling.b_id_farm, b_id_farm),
                )

            const cultivationCatalogueSelecting = await tx
                .select()
                .from(schema.cultivationCatalogueSelecting)
                .where(
                    eq(
                        schema.cultivationCatalogueSelecting.b_id_farm,
                        b_id_farm,
                    ),
                )

            // Meta info
            const schemaVersion = await getLatestMigrationVersion()
            const packageJsonRaw = await readFile(
                resolve(process.cwd(), "package.json"),
                "utf-8",
            )
            const packageJson = JSON.parse(packageJsonRaw)

            const exportData = {
                meta: {
                    version: schemaVersion,
                    exportedAt: new Date().toISOString(),
                    source: `${packageJson.name} v${packageJson.version}`,
                },
                farm,
                fields,
                field_acquiring: fieldAcquiring,
                field_discarding: fieldDiscarding,
                fertilizers,
                fertilizer_acquiring: fertilizerAcquiring,
                fertilizer_applying: fertilizerApplication,
                fertilizers_catalogue: fertilizersCatalogue,
                fertilizer_picking: fertilizerPicking,
                cultivations,
                cultivation_starting: cultivationStarting,
                cultivations_catalogue: cultivationsCatalogue,
                harvestables,
                harvestable_sampling: harvestableSampling,
                harvestable_analyses: harvestableAnalyses,
                cultivation_harvesting: cultivationHarvesting,
                cultivation_ending: cultivationEnding,
                soil_analysis: soilAnalysis,
                soil_sampling: soilSampling,
                derogations,
                derogation_applying: derogationApplying,
                organic_certifications: organicCertifications,
                organic_certifications_holding: organicCertificationsHolding,
                intending_grazing: intendingGrazing,
                fertilizer_catalogue_enabling: fertilizerCatalogueEnabling,
                cultivation_catalogue_selecting: cultivationCatalogueSelecting,
            }

            // Strip extra fields and convert Dates to ISO strings
            const cleanData = stripAuditFields(exportData)
            const serializedData = serializeDates(cleanData)

            // Convert to plain JSON object
            return JSON.parse(JSON.stringify(serializedData))
        })
    } catch (err) {
        throw handleError(err, "Exception for exportFarm", { b_id_farm })
    }
}

/**
 * Robustly converts any Date objects found in the data to ISO strings.
 * Also handles nested objects and arrays.
 */
// biome-ignore lint/suspicious/noExplicitAny: recursively handles arbitrary JSON data
function serializeDates(data: any): any {
    if (data instanceof Date) {
        return data.toISOString()
    }
    if (Array.isArray(data)) {
        return data.map(serializeDates)
    }
    if (data !== null && typeof data === "object") {
        const result: any = {}
        for (const [key, value] of Object.entries(data)) {
            result[key] = serializeDates(value)
        }
        return result
    }
    return data
}
