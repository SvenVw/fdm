import { and, asc, desc, eq, gte, inArray, lte } from "drizzle-orm"
import { createId } from "./id"

import { hashFertilizer } from "@svenvw/fdm-data"
import { checkPermission } from "./authorization"
import type { PrincipalId } from "./authorization.d"
import * as schema from "./db/schema"
import { handleError } from "./error"
import type { FdmType } from "./fdm"
import type {
    FertilizefrParameterDescription,
    Fertilizer,
    FertilizerApplication,
    FertilizerParameterDescription,
} from "./fertilizer.d"
import type { Timeframe } from "./timeframe"

/**
 * Retrieves all fertilizers from the enabled catalogues for a farm.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param principal_id The ID of the principal making the request.
 * @param b_id_farm The ID of the farm.
 * @returns A Promise that resolves with an array of fertilizer catalogue entries.
 * @alpha
 */
export async function getFertilizersFromCatalogue(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id_farm: schema.farmsTypeSelect["b_id_farm"],
): Promise<schema.fertilizersCatalogueTypeSelect[]> {
    try {
        await checkPermission(
            fdm,
            "farm",
            "read",
            b_id_farm,
            principal_id,
            "getFertilizersFromCatalogue",
        )

        // Get enabled catalogues for the farm
        const enabledCatalogues = await fdm
            .select({
                p_source: schema.fertilizerCatalogueEnabling.p_source,
            })
            .from(schema.fertilizerCatalogueEnabling)
            .where(eq(schema.fertilizerCatalogueEnabling.b_id_farm, b_id_farm))

        // If no catalogues are enabled, return empty array
        if (enabledCatalogues.length === 0) {
            return []
        }

        // Get fertilizers from enabled catalogues
        const fertilizersCatalogue = await fdm
            .select()
            .from(schema.fertilizersCatalogue)
            .where(
                inArray(
                    schema.fertilizersCatalogue.p_source,
                    enabledCatalogues.map(
                        (c: { p_source: string }) => c.p_source,
                    ),
                ),
            )
            .orderBy(asc(schema.fertilizersCatalogue.p_name_nl))

        return fertilizersCatalogue
    } catch (err) {
        throw handleError(err, "Exception for getFertilizersFromCatalogue", {
            principal_id,
            b_id_farm,
        })
    }
}

/**
 * Adds a new custom fertilizer to the catalogue of a farm.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param principal_id The ID of the principal making the request.
 * @param b_id_farm The ID of the farm.
 * @param properties The properties of the fertilizer to add.
 * @returns A Promise that resolves when the fertilizer has been added.
 * @throws If adding the fertilizer fails.
 * @alpha
 */
export async function addFertilizerToCatalogue(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id_farm: schema.farmsTypeInsert["b_id_farm"],
    properties: {
        p_name_nl: schema.fertilizersCatalogueTypeInsert["p_name_nl"]
        p_name_en: schema.fertilizersCatalogueTypeInsert["p_name_en"]
        p_description: schema.fertilizersCatalogueTypeInsert["p_description"]
        p_dm: schema.fertilizersCatalogueTypeInsert["p_dm"]
        p_density: schema.fertilizersCatalogueTypeInsert["p_density"]
        p_om: schema.fertilizersCatalogueTypeInsert["p_om"]
        p_a: schema.fertilizersCatalogueTypeInsert["p_a"]
        p_hc: schema.fertilizersCatalogueTypeInsert["p_hc"]
        p_eom: schema.fertilizersCatalogueTypeInsert["p_eom"]
        p_eoc: schema.fertilizersCatalogueTypeInsert["p_eoc"]
        p_c_rt: schema.fertilizersCatalogueTypeInsert["p_c_rt"]
        p_c_of: schema.fertilizersCatalogueTypeInsert["p_c_of"]
        p_c_if: schema.fertilizersCatalogueTypeInsert["p_c_if"]
        p_c_fr: schema.fertilizersCatalogueTypeInsert["p_c_fr"]
        p_cn_of: schema.fertilizersCatalogueTypeInsert["p_cn_of"]
        p_n_rt: schema.fertilizersCatalogueTypeInsert["p_n_rt"]
        p_n_if: schema.fertilizersCatalogueTypeInsert["p_n_if"]
        p_n_of: schema.fertilizersCatalogueTypeInsert["p_n_of"]
        p_n_wc: schema.fertilizersCatalogueTypeInsert["p_n_wc"]
        p_p_rt: schema.fertilizersCatalogueTypeInsert["p_p_rt"]
        p_k_rt: schema.fertilizersCatalogueTypeInsert["p_k_rt"]
        p_mg_rt: schema.fertilizersCatalogueTypeInsert["p_mg_rt"]
        p_ca_rt: schema.fertilizersCatalogueTypeInsert["p_ca_rt"]
        p_ne: schema.fertilizersCatalogueTypeInsert["p_ne"]
        p_s_rt: schema.fertilizersCatalogueTypeInsert["p_s_rt"]
        p_s_wc: schema.fertilizersCatalogueTypeInsert["p_s_wc"]
        p_cu_rt: schema.fertilizersCatalogueTypeInsert["p_cu_rt"]
        p_zn_rt: schema.fertilizersCatalogueTypeInsert["p_zn_rt"]
        p_na_rt: schema.fertilizersCatalogueTypeInsert["p_na_rt"]
        p_si_rt: schema.fertilizersCatalogueTypeInsert["p_si_rt"]
        p_b_rt: schema.fertilizersCatalogueTypeInsert["p_b_rt"]
        p_mn_rt: schema.fertilizersCatalogueTypeInsert["p_mn_rt"]
        p_ni_rt: schema.fertilizersCatalogueTypeInsert["p_ni_rt"]
        p_fe_rt: schema.fertilizersCatalogueTypeInsert["p_fe_rt"]
        p_mo_rt: schema.fertilizersCatalogueTypeInsert["p_mo_rt"]
        p_co_rt: schema.fertilizersCatalogueTypeInsert["p_co_rt"]
        p_as_rt: schema.fertilizersCatalogueTypeInsert["p_as_rt"]
        p_cd_rt: schema.fertilizersCatalogueTypeInsert["p_cd_rt"]
        pr_cr_rt: schema.fertilizersCatalogueTypeInsert["p_cr_rt"]
        p_cr_vi: schema.fertilizersCatalogueTypeInsert["p_cr_vi"]
        p_pb_rt: schema.fertilizersCatalogueTypeInsert["p_pb_rt"]
        p_hg_rt: schema.fertilizersCatalogueTypeInsert["p_hg_rt"]
        p_cl_rt: schema.fertilizersCatalogueTypeInsert["p_cl_rt"]
        p_type_manure: schema.fertilizersCatalogueTypeInsert["p_type_manure"]
        p_type_mineral: schema.fertilizersCatalogueTypeInsert["p_type_mineral"]
        p_type_compost: schema.fertilizersCatalogueTypeInsert["p_type_compost"]
    },
): Promise<schema.fertilizersCatalogueTypeSelect["p_id_catalogue"]> {
    try {
        await checkPermission(
            fdm,
            "farm",
            "write",
            b_id_farm,
            principal_id,
            "addFertilizerToCatalogue",
        )

        const p_id_catalogue = createId()
        const input: schema.fertilizersCatalogueTypeInsert = {
            ...properties,
            p_id_catalogue: p_id_catalogue,
            p_source: b_id_farm,
            hash: null,
        }
        input.hash = await hashFertilizer(input)

        // Insert the farm in the db
        await fdm.insert(schema.fertilizersCatalogue).values(input)

        return p_id_catalogue
    } catch (err) {
        throw handleError(err, "Exception for addFertilizerToCatalogue", {
            properties,
        })
    }
}

/**
 * Adds a fertilizer aqcuiring record to a farm.
 *
 * This function creates a new fertilizer acquiring record by performing a transactional insertion into the
 * fertilizers, fertilizerAcquiring, and fertilizerPicking tables. It verifies that the user has write permission
 * on the specified farm before proceeding.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param principal_id The identifier of the user making the request.
 * @param p_id_catalogue The catalogue ID of the fertilizer.
 * @param b_id_farm The ID of the farm where the fertilizer is applied.
 * @param p_acquiring_amount The amount of fertilizer acquired.
 * @param p_acquiring_date The date when the fertilizer was acquired.
 * @returns A Promise resolving to the ID of the newly created fertilizer acquiring record.
 * @throws If adding the fertilizer acquiring record fails.
 * @alpha
 */
export async function addFertilizer(
    fdm: FdmType,
    principal_id: PrincipalId,
    p_id_catalogue: schema.fertilizersCatalogueTypeInsert["p_id_catalogue"],
    b_id_farm: schema.fertilizerAcquiringTypeInsert["b_id_farm"],
    p_acquiring_amount: schema.fertilizerAcquiringTypeInsert["p_acquiring_amount"],
    p_acquiring_date: schema.fertilizerAcquiringTypeInsert["p_acquiring_date"],
): Promise<schema.fertilizerAcquiringTypeInsert["p_id"]> {
    try {
        await checkPermission(
            fdm,
            "farm",
            "write",
            b_id_farm,
            principal_id,
            "addFertilizer",
        )

        return await fdm.transaction(async (tx: FdmType) => {
            // Generate an ID for the fertilizer
            const p_id = createId()

            // Insert the fertilizer in the db
            const fertilizerAcquiringData = {
                b_id_farm: b_id_farm,
                p_id: p_id,
                p_acquiring_amount: p_acquiring_amount,
                p_acquiring_date: p_acquiring_date,
            }

            const fertilizerPickingData = {
                p_id: p_id,
                p_id_catalogue: p_id_catalogue,
                p_picking_date: new Date(),
            }

            await tx.insert(schema.fertilizers).values({
                p_id: p_id,
            })

            await tx
                .insert(schema.fertilizerAcquiring)
                .values(fertilizerAcquiringData)

            await tx
                .insert(schema.fertilizerPicking)
                .values(fertilizerPickingData)

            return p_id
        })
    } catch (err) {
        throw handleError(err, "Exception for addFertilizer", {
            p_id_catalogue,
            b_id_farm,
            p_acquiring_amount,
            p_acquiring_date,
        })
    }
}

/**
 * Retrieves the details of a specific fertilizer.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param p_id The ID of the fertilizer.
 * @returns A Promise that resolves with the fertilizer details.
 * @throws If retrieving the fertilizer details fails or the fertilizer is not found.
 * @alpha
 */
export async function getFertilizer(
    fdm: FdmType,
    p_id: schema.fertilizersTypeSelect["p_id"],
): Promise<Fertilizer> {
    try {
        // Get properties of the requested fertilizer
        const fertilizer = await fdm
            .select({
                p_id: schema.fertilizers.p_id,
                p_id_catalogue: schema.fertilizersCatalogue.p_id_catalogue,
                p_source: schema.fertilizersCatalogue.p_source,
                p_name_nl: schema.fertilizersCatalogue.p_name_nl,
                p_name_en: schema.fertilizersCatalogue.p_name_en,
                p_description: schema.fertilizersCatalogue.p_description,
                p_acquiring_amount:
                    schema.fertilizerAcquiring.p_acquiring_amount,
                p_acquiring_date: schema.fertilizerAcquiring.p_acquiring_date,
                p_picking_date: schema.fertilizerPicking.p_picking_date,
                p_dm: schema.fertilizersCatalogue.p_dm,
                p_density: schema.fertilizersCatalogue.p_density,
                p_om: schema.fertilizersCatalogue.p_om,
                p_a: schema.fertilizersCatalogue.p_a,
                p_hc: schema.fertilizersCatalogue.p_hc,
                p_eom: schema.fertilizersCatalogue.p_eom,
                p_eoc: schema.fertilizersCatalogue.p_eoc,
                p_c_rt: schema.fertilizersCatalogue.p_c_rt,
                p_c_of: schema.fertilizersCatalogue.p_c_of,
                p_c_if: schema.fertilizersCatalogue.p_c_if,
                p_c_fr: schema.fertilizersCatalogue.p_c_fr,
                p_cn_of: schema.fertilizersCatalogue.p_cn_of,
                p_n_rt: schema.fertilizersCatalogue.p_n_rt,
                p_n_if: schema.fertilizersCatalogue.p_n_if,
                p_n_of: schema.fertilizersCatalogue.p_n_of,
                p_n_wc: schema.fertilizersCatalogue.p_n_wc,
                p_p_rt: schema.fertilizersCatalogue.p_p_rt,
                p_k_rt: schema.fertilizersCatalogue.p_k_rt,
                p_mg_rt: schema.fertilizersCatalogue.p_mg_rt,
                p_ca_rt: schema.fertilizersCatalogue.p_ca_rt,
                p_ne: schema.fertilizersCatalogue.p_ne,
                p_s_rt: schema.fertilizersCatalogue.p_s_rt,
                p_s_wc: schema.fertilizersCatalogue.p_s_wc,
                p_cu_rt: schema.fertilizersCatalogue.p_cu_rt,
                p_zn_rt: schema.fertilizersCatalogue.p_zn_rt,
                p_na_rt: schema.fertilizersCatalogue.p_na_rt,
                p_si_rt: schema.fertilizersCatalogue.p_si_rt,
                p_b_rt: schema.fertilizersCatalogue.p_b_rt,
                p_mn_rt: schema.fertilizersCatalogue.p_mn_rt,
                p_ni_rt: schema.fertilizersCatalogue.p_ni_rt,
                p_fe_rt: schema.fertilizersCatalogue.p_fe_rt,
                p_mo_rt: schema.fertilizersCatalogue.p_mo_rt,
                p_co_rt: schema.fertilizersCatalogue.p_co_rt,
                p_as_rt: schema.fertilizersCatalogue.p_as_rt,
                p_cd_rt: schema.fertilizersCatalogue.p_cd_rt,
                p_cr_rt: schema.fertilizersCatalogue.p_cr_rt,
                p_cr_vi: schema.fertilizersCatalogue.p_cr_vi,
                p_pb_rt: schema.fertilizersCatalogue.p_pb_rt,
                p_hg_rt: schema.fertilizersCatalogue.p_hg_rt,
                p_cl_rt: schema.fertilizersCatalogue.p_cl_rt,
                p_type_manure: schema.fertilizersCatalogue.p_type_manure,
                p_type_mineral: schema.fertilizersCatalogue.p_type_mineral,
                p_type_compost: schema.fertilizersCatalogue.p_type_compost,
            })
            .from(schema.fertilizers)
            .leftJoin(
                schema.fertilizerAcquiring,
                eq(schema.fertilizers.p_id, schema.fertilizerAcquiring.p_id),
            )
            .leftJoin(
                schema.fertilizerPicking,
                eq(schema.fertilizers.p_id, schema.fertilizerPicking.p_id),
            )
            .leftJoin(
                schema.fertilizersCatalogue,
                eq(
                    schema.fertilizerPicking.p_id_catalogue,
                    schema.fertilizersCatalogue.p_id_catalogue,
                ),
            )
            .where(eq(schema.fertilizers.p_id, p_id))
            .limit(1)

        return fertilizer[0]
    } catch (err) {
        throw handleError(err, "Exception for getFertilizer", {
            p_id,
        })
    }
}

/**
 * Updates an existing fertilizer in the catalogue of a farm.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param principal_id The ID of the principal making the request.
 * @param b_id_farm The ID of the farm.
 * @param p_id_catalogue The ID of the fertilizer in the catalogue to update
 * @param properties The properties of the fertilizer to update.
 * @returns A Promise that resolves when the fertilizer has been updated.
 * @throws If updating the fertilizer fails.
 * @alpha
 */
export async function updateFertilizerFromCatalogue(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id_farm: schema.farmsTypeInsert["b_id_farm"],
    p_id_catalogue: schema.fertilizersCatalogueTypeInsert["p_id_catalogue"],
    properties: Partial<{
        p_name_nl: schema.fertilizersCatalogueTypeInsert["p_name_nl"]
        p_name_en: schema.fertilizersCatalogueTypeInsert["p_name_en"]
        p_description: schema.fertilizersCatalogueTypeInsert["p_description"]
        p_dm: schema.fertilizersCatalogueTypeInsert["p_dm"]
        p_density: schema.fertilizersCatalogueTypeInsert["p_density"]
        p_om: schema.fertilizersCatalogueTypeInsert["p_om"]
        p_a: schema.fertilizersCatalogueTypeInsert["p_a"]
        p_hc: schema.fertilizersCatalogueTypeInsert["p_hc"]
        p_eom: schema.fertilizersCatalogueTypeInsert["p_eom"]
        p_eoc: schema.fertilizersCatalogueTypeInsert["p_eoc"]
        p_c_rt: schema.fertilizersCatalogueTypeInsert["p_c_rt"]
        p_c_of: schema.fertilizersCatalogueTypeInsert["p_c_of"]
        p_c_if: schema.fertilizersCatalogueTypeInsert["p_c_if"]
        p_c_fr: schema.fertilizersCatalogueTypeInsert["p_c_fr"]
        p_cn_of: schema.fertilizersCatalogueTypeInsert["p_cn_of"]
        p_n_rt: schema.fertilizersCatalogueTypeInsert["p_n_rt"]
        p_n_if: schema.fertilizersCatalogueTypeInsert["p_n_if"]
        p_n_of: schema.fertilizersCatalogueTypeInsert["p_n_of"]
        p_n_wc: schema.fertilizersCatalogueTypeInsert["p_n_wc"]
        p_p_rt: schema.fertilizersCatalogueTypeInsert["p_p_rt"]
        p_k_rt: schema.fertilizersCatalogueTypeInsert["p_k_rt"]
        p_mg_rt: schema.fertilizersCatalogueTypeInsert["p_mg_rt"]
        p_ca_rt: schema.fertilizersCatalogueTypeInsert["p_ca_rt"]
        p_ne: schema.fertilizersCatalogueTypeInsert["p_ne"]
        p_s_rt: schema.fertilizersCatalogueTypeInsert["p_s_rt"]
        p_s_wc: schema.fertilizersCatalogueTypeInsert["p_s_wc"]
        p_cu_rt: schema.fertilizersCatalogueTypeInsert["p_cu_rt"]
        p_zn_rt: schema.fertilizersCatalogueTypeInsert["p_zn_rt"]
        p_na_rt: schema.fertilizersCatalogueTypeInsert["p_na_rt"]
        p_si_rt: schema.fertilizersCatalogueTypeInsert["p_si_rt"]
        p_b_rt: schema.fertilizersCatalogueTypeInsert["p_b_rt"]
        p_mn_rt: schema.fertilizersCatalogueTypeInsert["p_mn_rt"]
        p_ni_rt: schema.fertilizersCatalogueTypeInsert["p_ni_rt"]
        p_fe_rt: schema.fertilizersCatalogueTypeInsert["p_fe_rt"]
        p_mo_rt: schema.fertilizersCatalogueTypeInsert["p_mo_rt"]
        p_co_rt: schema.fertilizersCatalogueTypeInsert["p_co_rt"]
        p_as_rt: schema.fertilizersCatalogueTypeInsert["p_as_rt"]
        p_cd_rt: schema.fertilizersCatalogueTypeInsert["p_cd_rt"]
        p_cr_rt: schema.fertilizersCatalogueTypeInsert["p_cr_rt"]
        p_cr_vi: schema.fertilizersCatalogueTypeInsert["p_cr_vi"]
        p_pb_rt: schema.fertilizersCatalogueTypeInsert["p_pb_rt"]
        p_hg_rt: schema.fertilizersCatalogueTypeInsert["p_hg_rt"]
        p_cl_rt: schema.fertilizersCatalogueTypeInsert["p_cl_rt"]
        p_type_manure: schema.fertilizersCatalogueTypeInsert["p_type_manure"]
        p_type_mineral: schema.fertilizersCatalogueTypeInsert["p_type_mineral"]
        p_type_compost: schema.fertilizersCatalogueTypeInsert["p_type_compost"]
    }>,
): Promise<void> {
    try {
        await checkPermission(
            fdm,
            "farm",
            "write",
            b_id_farm,
            principal_id,
            "updateFertilizerFromCatalogue",
        )

        const existingFertilizer = await fdm
            .select()
            .from(schema.fertilizersCatalogue)
            .where(
                and(
                    eq(
                        schema.fertilizersCatalogue.p_id_catalogue,
                        p_id_catalogue,
                    ),
                    eq(schema.fertilizersCatalogue.p_source, b_id_farm),
                ),
            )
        if (existingFertilizer.length === 0) {
            throw new Error("Fertilizer does not exist in catalogue")
        }
        const updatedProperties = {
            ...existingFertilizer[0],
            ...properties,
            hash: null,
        }
        updatedProperties.hash = await hashFertilizer(updatedProperties)

        await fdm
            .update(schema.fertilizersCatalogue)
            .set(updatedProperties)
            .where(
                and(
                    eq(
                        schema.fertilizersCatalogue.p_id_catalogue,
                        p_id_catalogue,
                    ),
                    eq(schema.fertilizersCatalogue.p_source, b_id_farm),
                ),
            )
    } catch (err) {
        throw handleError(err, "Exception for updateFertilizerFromCatalogue", {
            p_id_catalogue,
            properties,
        })
    }
}

/**
 * Retrieves fertilizer details for a specified farm.
 *
 * This function verifies that the requesting principal has read access to the farm,
 * then queries the database to return a list of fertilizers along with their catalogue
 * and application details.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param principal_id - The ID of the principal making the request.
 * @param b_id_farm - The ID of the farm for which the fertilizers are retrieved.
 * @returns A promise that resolves with an array of fertilizer detail objects.
 *
 * @alpha
 */
export async function getFertilizers(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id_farm: schema.fertilizerAcquiringTypeSelect["b_id_farm"],
): Promise<Fertilizer[]> {
    try {
        await checkPermission(
            fdm,
            "farm",
            "read",
            b_id_farm,
            principal_id,
            "getFertilizers",
        )

        const fertilizers = await fdm
            .select({
                p_id: schema.fertilizers.p_id,
                p_id_catalogue: schema.fertilizersCatalogue.p_id_catalogue,
                p_source: schema.fertilizersCatalogue.p_source,
                p_name_nl: schema.fertilizersCatalogue.p_name_nl,
                p_name_en: schema.fertilizersCatalogue.p_name_en,
                p_description: schema.fertilizersCatalogue.p_description,
                p_acquiring_amount:
                    schema.fertilizerAcquiring.p_acquiring_amount,
                p_acquiring_date: schema.fertilizerAcquiring.p_acquiring_date,
                p_picking_date: schema.fertilizerPicking.p_picking_date,
                p_dm: schema.fertilizersCatalogue.p_dm,
                p_density: schema.fertilizersCatalogue.p_density,
                p_om: schema.fertilizersCatalogue.p_om,
                p_a: schema.fertilizersCatalogue.p_a,
                p_hc: schema.fertilizersCatalogue.p_hc,
                p_eom: schema.fertilizersCatalogue.p_eom,
                p_eoc: schema.fertilizersCatalogue.p_eoc,
                p_c_rt: schema.fertilizersCatalogue.p_c_rt,
                p_c_of: schema.fertilizersCatalogue.p_c_of,
                p_c_if: schema.fertilizersCatalogue.p_c_if,
                p_c_fr: schema.fertilizersCatalogue.p_c_fr,
                p_cn_of: schema.fertilizersCatalogue.p_cn_of,
                p_n_rt: schema.fertilizersCatalogue.p_n_rt,
                p_n_if: schema.fertilizersCatalogue.p_n_if,
                p_n_of: schema.fertilizersCatalogue.p_n_of,
                p_n_wc: schema.fertilizersCatalogue.p_n_wc,
                p_p_rt: schema.fertilizersCatalogue.p_p_rt,
                p_k_rt: schema.fertilizersCatalogue.p_k_rt,
                p_mg_rt: schema.fertilizersCatalogue.p_mg_rt,
                p_ca_rt: schema.fertilizersCatalogue.p_ca_rt,
                p_ne: schema.fertilizersCatalogue.p_ne,
                p_s_rt: schema.fertilizersCatalogue.p_s_rt,
                p_s_wc: schema.fertilizersCatalogue.p_s_wc,
                p_cu_rt: schema.fertilizersCatalogue.p_cu_rt,
                p_zn_rt: schema.fertilizersCatalogue.p_zn_rt,
                p_na_rt: schema.fertilizersCatalogue.p_na_rt,
                p_si_rt: schema.fertilizersCatalogue.p_si_rt,
                p_b_rt: schema.fertilizersCatalogue.p_b_rt,
                p_mn_rt: schema.fertilizersCatalogue.p_mn_rt,
                p_ni_rt: schema.fertilizersCatalogue.p_ni_rt,
                p_fe_rt: schema.fertilizersCatalogue.p_fe_rt,
                p_mo_rt: schema.fertilizersCatalogue.p_mo_rt,
                p_co_rt: schema.fertilizersCatalogue.p_co_rt,
                p_as_rt: schema.fertilizersCatalogue.p_as_rt,
                p_cd_rt: schema.fertilizersCatalogue.p_cd_rt,
                p_cr_rt: schema.fertilizersCatalogue.p_cr_rt,
                p_cr_vi: schema.fertilizersCatalogue.p_cr_vi,
                p_pb_rt: schema.fertilizersCatalogue.p_pb_rt,
                p_hg_rt: schema.fertilizersCatalogue.p_hg_rt,
                p_cl_rt: schema.fertilizersCatalogue.p_cl_rt,
                p_type_manure: schema.fertilizersCatalogue.p_type_manure,
                p_type_mineral: schema.fertilizersCatalogue.p_type_mineral,
                p_type_compost: schema.fertilizersCatalogue.p_type_compost,
            })
            .from(schema.fertilizers)
            .leftJoin(
                schema.fertilizerAcquiring,
                eq(schema.fertilizers.p_id, schema.fertilizerAcquiring.p_id),
            )
            .leftJoin(
                schema.fertilizerPicking,
                eq(schema.fertilizers.p_id, schema.fertilizerPicking.p_id),
            )
            .leftJoin(
                schema.fertilizersCatalogue,
                eq(
                    schema.fertilizerPicking.p_id_catalogue,
                    schema.fertilizersCatalogue.p_id_catalogue,
                ),
            )
            .where(eq(schema.fertilizerAcquiring.b_id_farm, b_id_farm))
            .orderBy(asc(schema.fertilizersCatalogue.p_name_nl))

        return fertilizers
    } catch (err) {
        throw handleError(err, "Exception for getFertilizers", {
            b_id_farm,
        })
    }
}

/**
 * Removes a fertilizer from a farm.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param p_id The ID of the fertilizer to remove.
 * @returns A Promise that resolves when the fertilizer has been removed.
 * @throws If removing the fertilizer fails.
 * @alpha
 */
export async function removeFertilizer(
    fdm: FdmType,
    p_id: schema.fertilizerAcquiringTypeInsert["p_id"],
): Promise<void> {
    try {
        return await fdm.transaction(async (tx: FdmType) => {
            await tx
                .delete(schema.fertilizerAcquiring)
                .where(eq(schema.fertilizerAcquiring.p_id, p_id))

            await tx
                .delete(schema.fertilizerPicking)
                .where(eq(schema.fertilizerPicking.p_id, p_id))

            await tx
                .delete(schema.fertilizers)
                .where(eq(schema.fertilizers.p_id, p_id))
        })
    } catch (err) {
        throw handleError(err, "Exception for removeFertilizer", {
            p_id,
        })
    }
}

/**
 * Adds a fertilizer application record.
 *
 * Validates that the specified field and fertilizer exist and that the principal has write permission on the field before inserting the application record.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param principal_id - The ID of the principal performing the operation.
 * @param b_id - The ID of the field where the fertilizer application is recorded.
 * @param p_id - The ID of the fertilizer to be applied.
 * @param p_app_amount - The amount of fertilizer applied.
 * @param p_app_method - The method used for applying the fertilizer.
 * @param p_app_date - The date of the fertilizer application.
 * @returns A Promise that resolves with the unique ID of the newly created fertilizer application record.
 *
 * @throws {Error} When the specified field or fertilizer does not exist or if the record insertion fails.
 */
export async function addFertilizerApplication(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id: schema.fertilizerApplicationTypeInsert["b_id"],
    p_id: schema.fertilizerApplicationTypeInsert["p_id"],
    p_app_amount: schema.fertilizerApplicationTypeInsert["p_app_amount"],
    p_app_method: schema.fertilizerApplicationTypeInsert["p_app_method"],
    p_app_date: schema.fertilizerApplicationTypeInsert["p_app_date"],
): Promise<schema.fertilizerApplicationTypeInsert["p_app_id"]> {
    try {
        await checkPermission(
            fdm,
            "field",
            "write",
            b_id,
            principal_id,
            "addFertilizerApplication",
        )
        // Validate that the field exists
        const fieldExists = await fdm
            .select()
            .from(schema.fields)
            .where(eq(schema.fields.b_id, b_id))
            .limit(1)
        if (fieldExists.length === 0) {
            throw new Error(`Field with b_id ${b_id} does not exist`)
        }

        // Validate that the fertilizer exists
        const fertilizerExists = await fdm
            .select()
            .from(schema.fertilizers)
            .where(eq(schema.fertilizers.p_id, p_id))
            .limit(1)
        if (fertilizerExists.length === 0) {
            throw new Error(`Fertilizer with p_id ${p_id} does not exist`)
        }

        const p_app_id = createId()

        await fdm.insert(schema.fertilizerApplication).values({
            p_app_id,
            b_id,
            p_id,
            p_app_amount,
            p_app_method,
            p_app_date,
        })

        return p_app_id
    } catch (err) {
        throw handleError(err, "Exception for addFertilizerApplication", {
            b_id,
            p_id,
            p_app_amount,
            p_app_method,
            p_app_date,
        })
    }
}

/**
 * Updates an existing fertilizer application record.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param principal_id - The ID of the principal performing the update.
 * @param p_app_id - The unique identifier of the fertilizer application record.
 * @param p_id - The unique identifier of the associated fertilizer.
 * @param p_app_amount - The amount of fertilizer applied.
 * @param p_app_method - The method used for applying the fertilizer.
 * @param p_app_date - The date when the fertilizer was applied.
 *
 * @throws {Error} Thrown if the update operation fails due to insufficient permissions or a database error.
 */
export async function updateFertilizerApplication(
    fdm: FdmType,
    principal_id: PrincipalId,
    p_app_id: schema.fertilizerApplicationTypeInsert["p_app_id"],
    p_id: schema.fertilizerApplicationTypeInsert["p_id"],
    p_app_amount: schema.fertilizerApplicationTypeInsert["p_app_amount"],
    p_app_method: schema.fertilizerApplicationTypeInsert["p_app_method"],
    p_app_date: schema.fertilizerApplicationTypeInsert["p_app_date"],
): Promise<void> {
    try {
        await checkPermission(
            fdm,
            "fertilizer_application",
            "write",
            p_app_id,
            principal_id,
            "updateFertilizerApplication",
        )
        await fdm
            .update(schema.fertilizerApplication)
            .set({ p_id, p_app_amount, p_app_method, p_app_date })
            .where(eq(schema.fertilizerApplication.p_app_id, p_app_id))
    } catch (err) {
        throw handleError(err, "Exception for updateFertilizerApplication", {
            p_app_id,
            p_id,
            p_app_amount,
            p_app_method,
            p_app_date,
        })
    }
}

/**
 * Removes a fertilizer application record.
 *
 * This function verifies that the principal has write permissions before deleting the fertilizer
 * application record identified by the given ID.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param principal_id - The ID of the principal performing the removal.
 * @param p_app_id - The fertilizer application record's ID to remove.
 *
 * @throws {Error} If the removal operation fails.
 */
export async function removeFertilizerApplication(
    fdm: FdmType,
    principal_id: PrincipalId,
    p_app_id: schema.fertilizerApplicationTypeInsert["p_app_id"],
): Promise<void> {
    try {
        await checkPermission(
            fdm,
            "fertilizer_application",
            "write",
            p_app_id,
            principal_id,
            "removeFertilizerApplication",
        )

        return await fdm
            .delete(schema.fertilizerApplication)
            .where(eq(schema.fertilizerApplication.p_app_id, p_app_id))
    } catch (err) {
        throw handleError(err, "Exception for removeFertilizerApplication", {
            p_app_id,
        })
    }
}

/**
 * Retrieves a fertilizer application record by its unique identifier.
 *
 * Checks if the principal has read permission before querying the database for the fertilizer
 * application record, including associated catalogue details. Returns the record if found,
 * or null otherwise.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param principal_id - The ID of the principal retrieving the application.
 * @param p_app_id - The unique ID of the fertilizer application record.
 * @returns A Promise that resolves with the fertilizer application record, or null if not found.
 * @throws Error if the retrieval process fails.
 */
export async function getFertilizerApplication(
    fdm: FdmType,
    principal_id: PrincipalId,
    p_app_id: schema.fertilizerApplicationTypeSelect["p_app_id"],
): Promise<FertilizerApplication | null> {
    try {
        await checkPermission(
            fdm,
            "fertilizer_application",
            "read",
            p_app_id,
            principal_id,
            "getFertilizerApplication",
        )

        const result = await fdm
            .select({
                p_id: schema.fertilizerApplication.p_id,
                p_id_catalogue: schema.fertilizersCatalogue.p_id_catalogue,
                p_name_nl: schema.fertilizersCatalogue.p_name_nl,
                p_app_amount: schema.fertilizerApplication.p_app_amount,
                p_app_method: schema.fertilizerApplication.p_app_method,
                p_app_date: schema.fertilizerApplication.p_app_date,
                p_app_id: schema.fertilizerApplication.p_app_id,
            })
            .from(schema.fertilizerApplication)
            .leftJoin(
                schema.fertilizerPicking,
                eq(
                    schema.fertilizerPicking.p_id,
                    schema.fertilizerApplication.p_id,
                ),
            )
            .leftJoin(
                schema.fertilizersCatalogue,
                eq(
                    schema.fertilizersCatalogue.p_id_catalogue,
                    schema.fertilizerPicking.p_id_catalogue,
                ),
            )
            .where(eq(schema.fertilizerApplication.p_app_id, p_app_id))

        return result[0] || null
    } catch (err) {
        throw handleError(err, "Exception for getFertilizerApplication", {
            p_app_id,
        })
    }
}

/**
 * Retrieves fertilizer application records for a specific field.
 *
 * This function first ensures that the requesting principal has read permission for the specified field, then
 * queries the database for fertilizer application records associated with that field. The returned records are
 * ordered by application date in descending order.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param principal_id - The identifier of the principal making the request.
 * @param b_id - The identifier of the field.
 * @param timeframe - Optional timeframe to filter the fertilizer applications.
 * @returns A promise that resolves with an array of fertilizer application records.
 * @throws {Error} If permission is denied or if an error occurs during record retrieval.
 */
export async function getFertilizerApplications(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id: schema.fertilizerApplicationTypeSelect["b_id"],
    timeframe?: Timeframe,
): Promise<FertilizerApplication[]> {
    try {
        await checkPermission(
            fdm,
            "field",
            "read",
            b_id,
            principal_id,
            "getFertilizerApplications",
        )

        return await fdm
            .select({
                p_id: schema.fertilizerApplication.p_id,
                p_id_catalogue: schema.fertilizersCatalogue.p_id_catalogue,
                p_name_nl: schema.fertilizersCatalogue.p_name_nl,
                p_app_amount: schema.fertilizerApplication.p_app_amount,
                p_app_method: schema.fertilizerApplication.p_app_method,
                p_app_date: schema.fertilizerApplication.p_app_date,
                p_app_id: schema.fertilizerApplication.p_app_id,
            })
            .from(schema.fertilizerApplication)
            .leftJoin(
                schema.fertilizerPicking,
                eq(
                    schema.fertilizerPicking.p_id,
                    schema.fertilizerApplication.p_id,
                ),
            )
            .leftJoin(
                schema.fertilizersCatalogue,
                eq(
                    schema.fertilizersCatalogue.p_id_catalogue,
                    schema.fertilizerPicking.p_id_catalogue,
                ),
            )
            .where(
                timeframe
                    ? and(
                          eq(schema.fertilizerApplication.b_id, b_id),
                          timeframe.start
                              ? gte(
                                    schema.fertilizerApplication.p_app_date,
                                    timeframe.start,
                                )
                              : undefined,
                          timeframe.end
                              ? lte(
                                    schema.fertilizerApplication.p_app_date,
                                    timeframe.end,
                                )
                              : undefined,
                      )
                    : eq(schema.fertilizerApplication.b_id, b_id),
            )
            .orderBy(desc(schema.fertilizerApplication.p_app_date))
    } catch (err) {
        throw handleError(err, "Exception for getFertilizerApplications", {
            b_id,
        })
    }
}

/**
 * Retrieves a description of the available fertilizer parameters.
 *
 * This function returns an array of objects, each describing a fertilizer parameter.
 * Each description includes the parameter's name, unit, type (numeric or enum),
 * a human-readable name, a detailed description, and optional constraints like
 * minimum and maximum values or a list of valid options for enum types.
 *
 * @param locale - The locale for which to retrieve the descriptions. Currently only 'NL-nl' is supported.
 * @returns An array of fertilizerParameterDescriptionItem objects.
 * @throws {Error} If an unsupported locale is provided.
 */
export function getFertilizerParametersDescription(
    locale = "NL-nl",
): FertilizerParameterDescription {
    if (locale !== "NL-nl") throw new Error("Unsupported locale")
    const fertilizerParameterDescription: FertilizerParameterDescription = [
        {
            parameter: "p_id_catalogue",
            unit: "",
            name: "ID",
            type: "text",
            category: "general",
            description: "Catalogu ID van meststof",
        },
        {
            parameter: "p_source",
            unit: "",
            name: "Bron",
            type: "text",
            category: "general",
            description: "Gegevensbron van meststof",
        },
        {
            parameter: "p_name_nl",
            unit: "",
            name: "Naam",
            type: "text",
            category: "general",
            description: "Nederlandse naam van meststof",
        },
        // {
        //     parameter: "p_name_en",
        //     unit: "",
        //     name: "Naam (Engels)",
        //     type: "text",
        //     category: "general",
        //     description: "Engelse naam van meststof",
        // },
        // {
        //     parameter: "p_description",
        //     unit: "",
        //     name: "Beschrijving",
        //     type: "text",
        //     category: "general",
        //     description: "Beschrijvingen en/of opmerkingen over de meststof",
        // },
        {
            parameter: "p_app_method_options",
            unit: "",
            name: "Toedieningsmethodes",
            type: "enum",
            category: "general",
            description: "Toedieningsmethodes beschikbaar voor deze methode",
            options: schema.applicationMethodOptions,
        },
        {
            parameter: "p_dm",
            unit: "g/kg",
            name: "Droge stofgehalte",
            type: "numeric",
            category: "physical",
            description: "",
            min: 0,
            max: 1000,
        },
        {
            parameter: "p_density",
            unit: "kg/l",
            name: "Dichtheid",
            type: "numeric",
            category: "physical",
            description: "",
            min: 0.00016,
            max: 17.31,
        },
        {
            parameter: "p_n_rt",
            unit: "g N/kg",
            name: "N",
            type: "numeric",
            category: "primary",
            description: "Stikstof, totaal",
            min: 0,
            max: 1000,
        },
        {
            parameter: "p_n_wc",
            unit: "-",
            name: "N-werking",
            type: "numeric",
            category: "primary",
            description: "Stikstof, werkingscoëfficient",
            min: 0,
            max: 1,
        },
        {
            parameter: "p_p_rt",
            unit: "g P2O5/kg",
            name: "P",
            type: "numeric",
            category: "primary",
            description: "Fosfaat",
            min: 0,
            max: 4583,
        },
        {
            parameter: "p_k_rt",
            unit: "g K2O/kg",
            name: "K",
            type: "numeric",
            category: "primary",
            description: "Kalium",
            min: 0,
            max: 2409.2,
        },
        {
            parameter: "p_eoc",
            unit: "g EOC/kg",
            name: "EOC",
            type: "numeric",
            category: "secondary",
            description: "Koolstof, effectief",
            min: 0,
            max: 1000,
        },
        {
            parameter: "p_s_rt",
            unit: "g SO3/kg",
            name: "S",
            type: "numeric",
            category: "secondary",
            description: "Zwavel",
            min: 0,
            max: 2497.2,
        },
        {
            parameter: "p_mg_rt",
            unit: "g MgO/kg",
            name: "Mg",
            type: "numeric",
            category: "secondary",
            description: "Magnesium",
            min: 0,
            max: 1659,
        },
        {
            parameter: "p_ca_rt",
            unit: "g CaO/kg",
            name: "Ca",
            type: "numeric",
            category: "secondary",
            description: "Calcium",
            min: 0,
            max: 1399.2,
        },
        {
            parameter: "p_na_rt",
            unit: "g Na2O/kg",
            name: "Na",
            type: "numeric",
            category: "secondary",
            description: "Calcium",
            min: 0,
            max: 2695900,
        },
        {
            parameter: "p_cu_rt",
            unit: "mg Cu/kg",
            name: "Cu",
            type: "numeric",
            category: "trace",
            description: "Koper",
            min: 0,
            max: 1000000,
        },
        {
            parameter: "p_zn_rt",
            unit: "mg Zn/kg",
            name: "Zn",
            type: "numeric",
            category: "trace",
            description: "Koper",
            min: 0,
            max: 1000000,
        },
        {
            parameter: "p_co_rt",
            unit: "mg Co/kg",
            name: "Co",
            type: "numeric",
            category: "trace",
            description: "Koper",
            min: 0,
            max: 1000000,
        },
        {
            parameter: "p_co_rt",
            unit: "mg Co/kg",
            name: "Co",
            type: "numeric",
            category: "trace",
            description: "Koper",
            min: 0,
            max: 1000000,
        },
        {
            parameter: "p_mn_rt",
            unit: "mg Mn/kg",
            name: "Mn",
            type: "numeric",
            category: "trace",
            description: "Mangaan",
            min: 0,
            max: 1000000,
        },
        {
            parameter: "p_mo_rt",
            unit: "mg Mn/kg",
            name: "Mo",
            type: "numeric",
            category: "trace",
            description: "Molybdeen",
            min: 0,
            max: 1000000,
        },
        {
            parameter: "p_b_rt",
            unit: "mg B/kg",
            name: "B",
            type: "numeric",
            category: "trace",
            description: "boor",
            min: 0,
            max: 1000000,
        },
    ]

    return fertilizerParameterDescription
}
