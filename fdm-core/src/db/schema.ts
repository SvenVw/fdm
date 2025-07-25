import type { ApplicationMethods } from "@svenvw/fdm-data"
import {
    boolean,
    index,
    integer,
    pgSchema,
    primaryKey,
    text,
    timestamp,
    uniqueIndex,
} from "drizzle-orm/pg-core"
import { geometry, numericCasted } from "./schema-custom-types"

// Define postgres schema
export const fdmSchema = pgSchema("fdm")
export type fdmSchemaTypeSelect = typeof fdmSchema

// Define farms table
export const farms = fdmSchema.table(
    "farms",
    {
        b_id_farm: text().primaryKey(),
        b_name_farm: text(),
        b_businessid_farm: text(),
        b_address_farm: text(),
        b_postalcode_farm: text(),
        created: timestamp({ withTimezone: true }).notNull().defaultNow(),
        updated: timestamp({ withTimezone: true }),
    },
    (table) => [uniqueIndex("b_id_farm_idx").on(table.b_id_farm)],
)

export type farmsTypeSelect = typeof farms.$inferSelect
export type farmsTypeInsert = typeof farms.$inferInsert

// Define farm_managing table
export const acquiringMethodOptions = [
    { value: "nl_01", label: "Eigendom" },
    { value: "nl_02", label: "Reguliere pacht" },
    { value: "nl_07", label: "Overige exploitatievormen" },
    { value: "nl_09", label: "Erfpacht" },
    { value: "nl_12", label: "Geliberaliseerde pacht, langer dan 6 jaar" },
    { value: "nl_13", label: "Geliberaliseerde pacht, 6 jaar of korter" },
    { value: "nl_61", label: "Reguliere pacht kortlopend" },
    { value: "nl_63", label: "Teeltpacht" },
    // { value: "nl_xx", label: "Pacht van geringe oppervlakten" },
    // { value: "nl_xx", label: "Natuurpacht" },
    // { value: "nl_xx", label: "In gebuik van een terreinbeherende organisatie" },
    // {
    //     value: "nl_xx",
    //     label: "Tijdelijk gebuik in het kader van landinrichting",
    // },
    { value: "unknown", label: "Onbekend" },
]
const acquiringMethodEnum = fdmSchema.enum(
    "b_acquiring_method",
    acquiringMethodOptions.map((x) => x.value) as [string, ...string[]],
)

export const fieldAcquiring = fdmSchema.table(
    "field_acquiring",
    {
        b_id: text()
            .notNull()
            .references(() => fields.b_id),
        b_id_farm: text()
            .notNull()
            .references(() => farms.b_id_farm),
        b_start: timestamp({ withTimezone: true }),
        b_acquiring_method: acquiringMethodEnum().notNull().default("unknown"),
        created: timestamp({ withTimezone: true }).notNull().defaultNow(),
        updated: timestamp({ withTimezone: true }),
    },
    (table) => {
        return [
            {
                pk: primaryKey({ columns: [table.b_id, table.b_id_farm] }),
            },
        ]
    },
)

export type fieldAcquiringTypeSelect = typeof fieldAcquiring.$inferSelect
export type fieldAcquiringTypeInsert = typeof fieldAcquiring.$inferInsert

// Define fields table
export const fields = fdmSchema.table(
    "fields",
    {
        b_id: text().primaryKey(),
        b_name: text().notNull(),
        b_geometry: geometry("b_geometry", {
            type: "Polygon",
        }), // PGLite does not support PostGIS yet; I expect to be supported in Q4 2024: https://github.com/electric-sql/pglite/issues/11
        b_id_source: text(),
        created: timestamp({ withTimezone: true }).notNull().defaultNow(),
        updated: timestamp({ withTimezone: true }),
    },
    (table) => [
        uniqueIndex("b_id_idx").on(table.b_id),
        index("b_geom_idx").using("gist", table.b_geometry),
    ],
)

export type fieldsTypeSelect = typeof fields.$inferSelect
export type fieldsTypeInsert = typeof fields.$inferInsert

export const fieldDiscarding = fdmSchema.table(
    "field_discarding",
    {
        b_id: text()
            .notNull()
            .references(() => fields.b_id),
        b_end: timestamp({ withTimezone: true }),
        created: timestamp({ withTimezone: true }).notNull().defaultNow(),
        updated: timestamp({ withTimezone: true }),
    },
    (table) => {
        return [
            {
                pk: primaryKey({ columns: [table.b_id] }),
            },
        ]
    },
)

export type fieldDiscardingTypeSelect = typeof fieldDiscarding.$inferSelect
export type fieldDiscardingTypeInsert = typeof fieldDiscarding.$inferInsert

// Define fertilizers table
export const fertilizers = fdmSchema.table(
    "fertilizers",
    {
        p_id: text().primaryKey(),
        created: timestamp({ withTimezone: true }).notNull().defaultNow(),
        updated: timestamp({ withTimezone: true }),
    },
    (table) => [uniqueIndex("p_id_idx").on(table.p_id)],
)

export type fertilizersTypeSelect = typeof fertilizers.$inferSelect
export type fertilizersTypeInsert = typeof fertilizers.$inferInsert

// Define fertilizers acquiring table
export const fertilizerAcquiring = fdmSchema.table("fertilizer_acquiring", {
    b_id_farm: text()
        .notNull()
        .references(() => farms.b_id_farm),
    p_id: text()
        .notNull()
        .references(() => fertilizers.p_id),
    p_acquiring_amount: numericCasted(), //kg
    p_acquiring_date: timestamp({ withTimezone: true }),
    created: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updated: timestamp({ withTimezone: true }),
})

export type fertilizerAcquiringTypeSelect =
    typeof fertilizerAcquiring.$inferSelect
export type fertilizerAcquiringTypeInsert =
    typeof fertilizerAcquiring.$inferInsert

// Define fertilizers application table
export const applicationMethodOptions = [
    { value: "slotted coulter", label: "Zodenbemester / Sleepvoet" },
    { value: "incorporation", label: "Onderwerken in 1 werkgang" },
    { value: "incorporation 2 tracks", label: "Onderwerken in 2 werkgangen" },
    { value: "injection", label: "Mestinjectie" },
    { value: "shallow injection", label: "In sleufjes in de grond" },
    { value: "spraying", label: "Spuiten" },
    { value: "broadcasting", label: "Breedwerpig uitstrooien" },
    { value: "spoke wheel", label: "Spaakwiel" },
    { value: "pocket placement", label: "Plantgat" },
    { value: "narrowband", label: "In strookjes op de grond" },
] satisfies { value: ApplicationMethods; label: string }[]
export const applicationMethodEnum = fdmSchema.enum(
    "p_app_method",
    applicationMethodOptions.map((x) => x.value) as [string, ...string[]],
)
export const fertilizerApplication = fdmSchema.table(
    "fertilizer_applying",
    {
        p_app_id: text().primaryKey(),
        b_id: text()
            .notNull()
            .references(() => fields.b_id),
        p_id: text()
            .notNull()
            .references(() => fertilizers.p_id),
        p_app_amount: numericCasted(), // kg / ha
        p_app_method: applicationMethodEnum(),
        p_app_date: timestamp({ withTimezone: true }),
        created: timestamp({ withTimezone: true }).notNull().defaultNow(),
        updated: timestamp({ withTimezone: true }),
    },
    (table) => [uniqueIndex("p_app_idx").on(table.p_app_id)],
)

export type fertilizerApplicationTypeSelect =
    typeof fertilizerApplication.$inferSelect
export type fertilizerApplicationTypeInsert =
    typeof fertilizerApplication.$inferInsert

// Define fertilizers_catalogue table
export const fertilizersCatalogue = fdmSchema.table(
    "fertilizers_catalogue",
    {
        p_id_catalogue: text().primaryKey(),
        p_source: text().notNull(),
        p_name_nl: text().notNull(),
        p_name_en: text(),
        p_description: text(),
        p_app_method_options: applicationMethodEnum().array(),
        p_dm: numericCasted(),
        p_density: numericCasted(),
        p_om: numericCasted(),
        p_a: numericCasted(),
        p_hc: numericCasted(),
        p_eom: numericCasted(),
        p_eoc: numericCasted(),
        p_c_rt: numericCasted(),
        p_c_of: numericCasted(),
        p_c_if: numericCasted(),
        p_c_fr: numericCasted(),
        p_cn_of: numericCasted(),
        p_n_rt: numericCasted(),
        p_n_if: numericCasted(),
        p_n_of: numericCasted(),
        p_n_wc: numericCasted(),
        p_no3_rt: numericCasted(),
        p_nh4_rt: numericCasted(),
        p_p_rt: numericCasted(),
        p_k_rt: numericCasted(),
        p_mg_rt: numericCasted(),
        p_ca_rt: numericCasted(),
        p_ne: numericCasted(),
        p_s_rt: numericCasted(),
        p_s_wc: numericCasted(),
        p_cu_rt: numericCasted(),
        p_zn_rt: numericCasted(),
        p_na_rt: numericCasted(),
        p_si_rt: numericCasted(),
        p_b_rt: numericCasted(),
        p_mn_rt: numericCasted(),
        p_ni_rt: numericCasted(),
        p_fe_rt: numericCasted(),
        p_mo_rt: numericCasted(),
        p_co_rt: numericCasted(),
        p_as_rt: numericCasted(),
        p_cd_rt: numericCasted(),
        p_cr_rt: numericCasted(),
        p_cr_vi: numericCasted(),
        p_pb_rt: numericCasted(),
        p_hg_rt: numericCasted(),
        p_cl_rt: numericCasted(),
        p_ef_nh3: numericCasted(),
        p_type_manure: boolean(),
        p_type_mineral: boolean(),
        p_type_compost: boolean(),
        hash: text(),
        created: timestamp({ withTimezone: true }).notNull().defaultNow(),
        updated: timestamp({ withTimezone: true }),
    },
    (table) => [uniqueIndex("p_id_catalogue_idx").on(table.p_id_catalogue)],
)

export type fertilizersCatalogueTypeSelect =
    typeof fertilizersCatalogue.$inferSelect
export type fertilizersCatalogueTypeInsert =
    typeof fertilizersCatalogue.$inferInsert

// Define fertilizer_picking table
export const fertilizerPicking = fdmSchema.table("fertilizer_picking", {
    p_id: text()
        .notNull()
        .references(() => fertilizers.p_id),
    p_id_catalogue: text()
        .notNull()
        .references(() => fertilizersCatalogue.p_id_catalogue),
    p_picking_date: timestamp({ withTimezone: true }),
    created: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updated: timestamp({ withTimezone: true }),
})

export type fertilizerPickingTypeSelect = typeof fertilizerPicking.$inferSelect
export type fertilizerPickingTypeInsert = typeof fertilizerPicking.$inferInsert

// Define cultivations table
export const cultivations = fdmSchema.table(
    "cultivations",
    {
        b_lu: text().primaryKey(),
        b_lu_catalogue: text()
            .notNull()
            .references(() => cultivationsCatalogue.b_lu_catalogue),
        created: timestamp({ withTimezone: true }).notNull().defaultNow(),
        updated: timestamp({ withTimezone: true }),
    },
    (table) => [uniqueIndex("b_lu_idx").on(table.b_lu)],
)

export type cultivationsTypeSelect = typeof cultivations.$inferSelect
export type cultivationsTypeInsert = typeof cultivations.$inferInsert

// Define cultivation_starting table
export const cultivationStarting = fdmSchema.table(
    "cultivation_starting",
    {
        b_id: text()
            .notNull()
            .references(() => fields.b_id),
        b_lu: text()
            .notNull()
            .references(() => cultivations.b_lu),
        b_lu_start: timestamp({ withTimezone: true }),
        b_sowing_amount: numericCasted(),
        b_sowing_method: text(),
        created: timestamp({ withTimezone: true }).notNull().defaultNow(),
        updated: timestamp({ withTimezone: true }),
    },
    (table) => {
        return [
            {
                pk: primaryKey({ columns: [table.b_id, table.b_lu] }),
            },
        ]
    },
)

export type cultivationStartingTypeSelect =
    typeof cultivationStarting.$inferSelect
export type cultivationStartingTypeInsert =
    typeof cultivationStarting.$inferInsert

// Define cultivations_catalogue table
export const harvestableEnum = fdmSchema.enum("b_lu_harvestable", [
    "none",
    "once",
    "multiple",
])
export const rotationEnum = fdmSchema.enum("b_lu_croprotation", [
    "other",
    "clover",
    "nature",
    "potato",
    "grass",
    "rapeseed",
    "starch",
    "maize",
    "cereal",
    "sugarbeet",
    "alfalfa",
    "catchcrop",
])
export const cultivationsCatalogue = fdmSchema.table(
    "cultivations_catalogue",
    {
        b_lu_catalogue: text().primaryKey(),
        b_lu_source: text().notNull(),
        b_lu_name: text().notNull(),
        b_lu_name_en: text(),
        b_lu_harvestable: harvestableEnum().notNull(),
        b_lu_hcat3: text(),
        b_lu_hcat3_name: text(),
        b_lu_croprotation: rotationEnum(),
        b_lu_yield: numericCasted(),
        b_lu_hi: numericCasted(),
        b_lu_n_harvestable: numericCasted(),
        b_lu_n_residue: numericCasted(),
        b_n_fixation: numericCasted(),
        hash: text(),
        created: timestamp({ withTimezone: true }).notNull().defaultNow(),
        updated: timestamp({ withTimezone: true }),
    },
    (table) => [uniqueIndex("b_lu_catalogue_idx").on(table.b_lu_catalogue)],
)

export type cultivationsCatalogueTypeSelect =
    typeof cultivationsCatalogue.$inferSelect
export type cultivationsCatalogueTypeInsert =
    typeof cultivationsCatalogue.$inferInsert

// Define harvestables able
export const harvestables = fdmSchema.table(
    "harvestables",
    {
        b_id_harvestable: text().primaryKey(),
        created: timestamp({ withTimezone: true }).notNull().defaultNow(),
        updated: timestamp({ withTimezone: true }),
    },
    (table) => [uniqueIndex("b_id_harvestable_idx").on(table.b_id_harvestable)],
)

export type harvestablesTypeSelect = typeof harvestables.$inferSelect
export type harvestablesTypeInsert = typeof harvestables.$inferInsert

// Define harvestable sampling table
export const harvestableSampling = fdmSchema.table(
    "harvestable_sampling",
    {
        b_id_harvestable: text()
            .notNull()
            .references(() => harvestables.b_id_harvestable),
        b_id_harvestable_analysis: text()
            .notNull()
            .references(() => harvestableAnalyses.b_id_harvestable_analysis),
        b_sampling_date: timestamp({ withTimezone: true }),
        created: timestamp({ withTimezone: true }).notNull().defaultNow(),
        updated: timestamp({ withTimezone: true }),
    },
    (table) => {
        return [
            {
                pk: primaryKey({
                    columns: [
                        table.b_id_harvestable,
                        table.b_id_harvestable_analysis,
                    ],
                }),
            },
        ]
    },
)

export type harvestableSamplingTypeSelect =
    typeof harvestableSampling.$inferSelect
export type harvestableSamplingTypeInsert =
    typeof harvestableSampling.$inferInsert

// Define harvestable analysis table
export const harvestableAnalyses = fdmSchema.table(
    "harvestable_analyses",
    {
        b_id_harvestable_analysis: text().primaryKey(),
        b_lu_yield: numericCasted(),
        b_lu_n_harvestable: numericCasted(),
        b_lu_n_residue: numericCasted(),
        b_lu_p_harvestable: numericCasted(),
        b_lu_p_residue: numericCasted(),
        b_lu_k_harvestable: numericCasted(),
        b_lu_k_residue: numericCasted(),
        created: timestamp({ withTimezone: true }).notNull().defaultNow(),
        updated: timestamp({ withTimezone: true }),
    },
    (table) => [
        uniqueIndex("b_id_harvestable_analyses_idx").on(
            table.b_id_harvestable_analysis,
        ),
    ],
)

export type harvestableAnalysesTypeSelect =
    typeof harvestableAnalyses.$inferSelect
export type harvestableAnalysesTypeInsert =
    typeof harvestableAnalyses.$inferInsert

// Define cultivation harvesting able
export const cultivationHarvesting = fdmSchema.table("cultivation_harvesting", {
    b_id_harvesting: text().primaryKey(),
    b_id_harvestable: text()
        .notNull()
        .references(() => harvestables.b_id_harvestable),
    b_lu: text()
        .notNull()
        .references(() => cultivations.b_lu),
    b_lu_harvest_date: timestamp({ withTimezone: true }),
    created: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updated: timestamp({ withTimezone: true }),
})

export type cultivationHarvestingTypeSelect =
    typeof cultivationHarvesting.$inferSelect
export type cultivationHarvestingTypeInsert =
    typeof cultivationHarvesting.$inferInsert

// Define cultivation ending table
export const cultivationEnding = fdmSchema.table(
    "cultivation_ending",
    {
        b_lu: text()
            .notNull()
            .references(() => cultivations.b_lu),
        b_lu_end: timestamp({ withTimezone: true }),
        m_cropresidue: boolean(),
        created: timestamp({ withTimezone: true }).notNull().defaultNow(),
        updated: timestamp({ withTimezone: true }),
    },
    (table) => {
        return [
            {
                pk: primaryKey({ columns: [table.b_lu] }),
            },
        ]
    },
)

export type cultivationEndingTypeSelect = typeof cultivationEnding.$inferSelect
export type cultivationEndingTypeInsert = typeof cultivationEnding.$inferInsert

// Define soil_analyis table
export const soilTypesOptions = [
    { value: "moerige_klei", label: "Moerige klei" },
    { value: "rivierklei", label: "Rivierklei" },
    { value: "dekzand", label: "Dekzand" },
    { value: "zeeklei", label: "Zeeklei" },
    { value: "dalgrond", label: "Dalgrond" },
    { value: "veen", label: "Veen" },
    { value: "loess", label: "Löss" },
    { value: "duinzand", label: "Duinzand" },
    { value: "maasklei", label: "Maasklei" },
]
export const soiltypeEnum = fdmSchema.enum(
    "b_soiltype_agr",
    soilTypesOptions.map((x) => x.value) as [string, ...string[]],
)

export const gwlClassesOptions = [
    { value: "II", label: "II" },
    { value: "IV", label: "IV" },
    { value: "IIIb", label: "IIIb" },
    { value: "V", label: "V" },
    { value: "VI", label: "VI" },
    { value: "VII", label: "VII" },
    { value: "Vb", label: "Vb" },
    { value: "-", label: "-" },
    { value: "Va", label: "Va" },
    { value: "III", label: "III" },
    { value: "VIII", label: "VIII" },
    { value: "sVI", label: "sVI" },
    { value: "I", label: "I" },
    { value: "IIb", label: "IIb" },
    { value: "sVII", label: "sVII" },
    { value: "IVu", label: "IVu" },
    { value: "bVII", label: "bVII" },
    { value: "sV", label: "sV" },
    { value: "sVb", label: "sVb" },
    { value: "bVI", label: "bVI" },
    { value: "IIIa", label: "IIIa" },
]
export const gwlClassEnum = fdmSchema.enum(
    "b_gwl_class",
    gwlClassesOptions.map((x) => x.value) as [string, ...string[]],
)

export const soilAnalysisSourceOptions = [
    {
        value: "nl-rva-l122",
        label: "Eurofins Agro Testing Wageningen B.V.",
    },
    {
        value: "nl-rva-l136",
        label: "Nutrilab B.V.",
    },
    {
        value: "nl-rva-l264",
        label: "Normec Robalab B.V.",
    },
    {
        value: "nl-rva-l320",
        label: "Agrarisch Laboratorium Noord-Nederland/Alnn B.V.",
    },
    {
        value: "nl-rva-l335",
        label: "Normec Groen Agro Control",
    },
    {
        value: "nl-rva-l610",
        label: "Normec Dumea B.V.",
    },
    {
        value: "nl-rva-l648",
        label: "Fertilab B.V.",
    },
    {
        value: "nl-rva-l697",
        label: "Care4Agro B.V.",
    },
    {
        value: "nl-other-nmi",
        label: "NMI BodemSchat",
    },
    {
        value: "other",
        label: "Ander laboratorium",
    },
]
export const soilAnalysisSourceEnum = fdmSchema.enum(
    "a_source",
    soilAnalysisSourceOptions.map((x) => x.value) as [string, ...string[]],
)

export const soilAnalysis = fdmSchema.table("soil_analysis", {
    a_id: text().primaryKey(),
    a_date: timestamp({ withTimezone: true }),
    a_source: soilAnalysisSourceEnum().default("other"),
    a_al_ox: numericCasted(),
    a_c_of: numericCasted(),
    a_ca_co: numericCasted(),
    a_ca_co_po: numericCasted(),
    a_caco3_if: numericCasted(),
    a_cec_co: numericCasted(),
    a_clay_mi: numericCasted(),
    a_cn_fr: numericCasted(),
    a_com_fr: numericCasted(),
    a_cu_cc: numericCasted(),
    a_density_sa: numericCasted(),
    a_fe_ox: numericCasted(),
    a_k_cc: numericCasted(),
    a_k_co: numericCasted(),
    a_k_co_po: numericCasted(),
    a_mg_cc: numericCasted(),
    a_mg_co: numericCasted(),
    a_mg_co_po: numericCasted(),
    a_n_pmn: numericCasted(),
    a_n_rt: numericCasted(),
    a_nh4_cc: numericCasted(),
    a_nmin_cc: numericCasted(),
    a_no3_cc: numericCasted(),
    a_p_al: numericCasted(),
    a_p_cc: numericCasted(),
    a_p_ox: numericCasted(),
    a_p_rt: numericCasted(),
    a_p_sg: numericCasted(),
    a_p_wa: numericCasted(),
    a_ph_cc: numericCasted(),
    a_s_rt: numericCasted(),
    a_sand_mi: numericCasted(),
    a_silt_mi: numericCasted(),
    a_som_loi: numericCasted(),
    a_zn_cc: numericCasted(),
    b_gwl_class: gwlClassEnum(),
    b_soiltype_agr: soiltypeEnum(),
    created: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updated: timestamp({ withTimezone: true }),
})

export type soilAnalysisTypeSelect = typeof soilAnalysis.$inferSelect
export type soilAnalysisTypeInsert = typeof soilAnalysis.$inferInsert

// Define soil_sampling table
export const soilSampling = fdmSchema.table("soil_sampling", {
    b_id_sampling: text().primaryKey(),
    b_id: text()
        .notNull()
        .references(() => fields.b_id),
    a_id: text()
        .notNull()
        .references(() => soilAnalysis.a_id),
    a_depth_upper: numericCasted().notNull().default(0),
    a_depth_lower: numericCasted(),
    b_sampling_date: timestamp({ withTimezone: true }),
    b_sampling_geometry: geometry("b_sampling_geometry", {
        type: "MultiPoint",
    }),
    created: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updated: timestamp({ withTimezone: true }),
})

export type soilSamplingTypeSelect = typeof soilSampling.$inferSelect
export type soilSamplingTypeInsert = typeof soilSampling.$inferInsert

// Define derogations table
export const derogations = fdmSchema.table(
    "derogations",
    {
        b_id_derogation: text().primaryKey(),
        b_derogation_year: integer().notNull(),
        created: timestamp({ withTimezone: true }).notNull().defaultNow(),
        updated: timestamp({ withTimezone: true }),
    },
)

export type derogationsTypeSelect = typeof derogations.$inferSelect
export type derogationsTypeInsert = typeof derogations.$inferInsert

// Define derogation_applying table
export const derogationApplying = fdmSchema.table(
    "derogation_applying",
    {
        b_id_farm: text()
            .notNull()
            .references(() => farms.b_id_farm),
        b_id_derogation: text()
            .notNull()
            .references(() => derogations.b_id_derogation),
        created: timestamp({ withTimezone: true }).notNull().defaultNow(),
        updated: timestamp({ withTimezone: true }),
    },
    (table) => {
        return [
            {
                pk: primaryKey({ columns: [table.b_id_farm, table.b_id_derogation] }),
            },
        ]
    },
)

export type derogationApplyingTypeSelect = typeof derogationApplying.$inferSelect
export type derogationApplyingTypeInsert = typeof derogationApplying.$inferInsert

// Define fertilizer_catalogue_enabling table
export const fertilizerCatalogueEnabling = fdmSchema.table(
    "fertilizer_catalogue_enabling",
    {
        b_id_farm: text()
            .notNull()
            .references(() => farms.b_id_farm),
        p_source: text().notNull(),
        created: timestamp({ withTimezone: true }).notNull().defaultNow(),
        updated: timestamp({ withTimezone: true }),
    },
    (table) => {
        return [
            {
                pk: primaryKey({ columns: [table.b_id_farm, table.p_source] }),
            },
        ]
    },
)

export type fertilizerCatalogueEnablingTypeSelect =
    typeof fertilizerCatalogueEnabling.$inferSelect
export type fertilizerCatalogueEnablingTypeInsert =
    typeof fertilizerCatalogueEnabling.$inferInsert

// Define cultivation_catalogue_selecting table
export const cultivationCatalogueSelecting = fdmSchema.table(
    "cultivation_catalogue_selecting",
    {
        b_id_farm: text()
            .notNull()
            .references(() => farms.b_id_farm),
        b_lu_source: text().notNull(),
        created: timestamp({ withTimezone: true }).notNull().defaultNow(),
        updated: timestamp({ withTimezone: true }),
    },
    (table) => {
        return [
            {
                pk: primaryKey({
                    columns: [table.b_id_farm, table.b_lu_source],
                }),
            },
        ]
    },
)

export type cultivationCatalogueSelectingTypeSelect =
    typeof cultivationCatalogueSelecting.$inferSelect
export type cultivationCatalogueSelectingTypeInsert =
    typeof cultivationCatalogueSelecting.$inferInsert
