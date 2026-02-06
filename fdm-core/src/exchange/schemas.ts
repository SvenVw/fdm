import { getTableColumns, type Table } from "drizzle-orm"
import { createSelectSchema } from "drizzle-zod"
import { z } from "zod"
import * as schema from "../db/schema"

// --- GeoJSON Helpers ---

const positionSchema = z.array(z.number()).min(2)

const polygonSchema = z.object({
    type: z.literal("Polygon"),
    coordinates: z.array(z.array(positionSchema)),
})

const multiPointSchema = z.object({
    type: z.literal("MultiPoint"),
    coordinates: z.array(positionSchema),
})

// --- Other Helpers ---

// Helper to coerce dates (string -> Date) for Zod parsing,
// while hinting 'date-time' string for JSON Schema generation.
// Using .nullish() makes it both optional and nullable.
const nullableDateSchema = z.coerce.date().nullish()

// Numeric fields from customType numericCasted need explicit Zod types
// because drizzle-zod doesn't know how to map custom types by default.
const nullableNumberSchema = z.number().nullish()

const commonOmit = {
    created: true,
    updated: true,
} as const

/**
 * Converts a potentially "drizzle-wrapped" zod type into a standard zod type.
 * This is necessary because drizzle-zod types may lack typeName or correct prototype chains.
 */
// biome-ignore lint/suspicious/noExplicitAny: drizzle-zod types are not standard Zod types
function toStandardZod(value: any): z.ZodTypeAny {
    const constructorName = value?.constructor?.name
    const def = value?._def

    switch (constructorName) {
        case "ZodString":
            return z.string()
        case "ZodNumber":
            return z.number()
        case "ZodBoolean":
            return z.boolean()
        case "ZodDate":
            return z.date()
        case "ZodEnum": {
            const values = Array.isArray(def.values)
                ? def.values
                : Object.values(def.entries || {})
            return z.enum(values as [string, ...string[]])
        }
        case "ZodArray":
            return z.array(toStandardZod(def.type || def.innerType))
        case "ZodNullable":
            return toStandardZod(def.innerType).nullable().optional()
        case "ZodOptional":
            return toStandardZod(def.innerType).optional()
        default:
            return value
    }
}

/**
 * Automatically creates an exchange schema for a Drizzle table.
 * 1. Omits common audit fields.
 * 2. Maps custom 'numeric' (numericCasted) columns to z.number().
 * 3. Makes nullable fields optional for JSON compatibility.
 * 4. Ensures standard Zod types are used for JSON Schema generation.
 */
function createExchangeSchema<T extends Table>(
    table: T,
    extensions: z.ZodRawShape = {},
) {
    const columns = getTableColumns(table)
    // biome-ignore lint/suspicious/noExplicitAny: drizzle-zod types are not standard Zod types
    const overrides: any = { ...extensions }

    // Automatically detect numericCasted columns (which have sqlName: 'numeric')
    for (const [name, col] of Object.entries(columns)) {
        // biome-ignore lint/suspicious/noExplicitAny: drizzle-zod types are not standard Zod types
        if ((col as any).sqlName === "numeric" && !overrides[name]) {
            overrides[name] = nullableNumberSchema
        }
    }

    // createSelectSchema returns a ZodObject.
    // We omit audit fields and then transform the shape to make nullables optional.
    // biome-ignore lint/suspicious/noExplicitAny: drizzle-zod types are not standard Zod types
    const baseSchema = (createSelectSchema as any)(table, overrides).omit(
        commonOmit,
    )
    const standardShape: z.ZodRawShape = {}

    for (const [key, value] of Object.entries(baseSchema.shape)) {
        standardShape[key] = toStandardZod(value)
    }

    return z.object(standardShape)
}

// --- Tables ---

export const farmSchema = createExchangeSchema(schema.farms)

export const fieldSchema = createExchangeSchema(schema.fields, {
    b_geometry: polygonSchema.nullish(),
})

export const fieldAcquiringSchema = createExchangeSchema(
    schema.fieldAcquiring,
    {
        b_start: nullableDateSchema,
    },
)

export const fieldDiscardingSchema = createExchangeSchema(
    schema.fieldDiscarding,
    {
        b_end: nullableDateSchema,
    },
)

export const fertilizerSchema = createExchangeSchema(schema.fertilizers)

export const fertilizerAcquiringSchema = createExchangeSchema(
    schema.fertilizerAcquiring,
    {
        p_acquiring_date: nullableDateSchema,
    },
)

export const fertilizerApplicationSchema = createExchangeSchema(
    schema.fertilizerApplication,
    {
        p_app_date: nullableDateSchema,
    },
)

export const fertilizersCatalogueSchema = createExchangeSchema(
    schema.fertilizersCatalogue,
)

export const fertilizerPickingSchema = createExchangeSchema(
    schema.fertilizerPicking,
    {
        p_picking_date: nullableDateSchema,
    },
)

export const cultivationSchema = createExchangeSchema(schema.cultivations)

export const cultivationStartingSchema = createExchangeSchema(
    schema.cultivationStarting,
    {
        b_lu_start: nullableDateSchema,
    },
)

export const cultivationsCatalogueSchema = createExchangeSchema(
    schema.cultivationsCatalogue,
)

export const harvestableSchema = createExchangeSchema(schema.harvestables)

export const harvestableSamplingSchema = createExchangeSchema(
    schema.harvestableSampling,
    {
        b_sampling_date: nullableDateSchema,
    },
)

export const harvestableAnalysesSchema = createExchangeSchema(
    schema.harvestableAnalyses,
)

export const cultivationHarvestingSchema = createExchangeSchema(
    schema.cultivationHarvesting,
    {
        b_lu_harvest_date: nullableDateSchema,
    },
)

export const cultivationEndingSchema = createExchangeSchema(
    schema.cultivationEnding,
    {
        b_lu_end: nullableDateSchema,
    },
)

export const soilAnalysisSchema = createExchangeSchema(schema.soilAnalysis, {
    a_date: nullableDateSchema,
})

export const soilSamplingSchema = createExchangeSchema(schema.soilSampling, {
    b_sampling_date: nullableDateSchema,
    b_sampling_geometry: multiPointSchema.nullish(),
})

export const derogationSchema = createExchangeSchema(schema.derogations)

export const derogationApplyingSchema = createExchangeSchema(
    schema.derogationApplying,
)

export const organicCertificationSchema = createExchangeSchema(
    schema.organicCertifications,
    {
        b_organic_issued: nullableDateSchema,
        b_organic_expires: nullableDateSchema,
    },
)

export const organicCertificationsHoldingSchema = createExchangeSchema(
    schema.organicCertificationsHolding,
)

export const intendingGrazingSchema = createExchangeSchema(
    schema.intendingGrazing,
)

export const fertilizerCatalogueEnablingSchema = createExchangeSchema(
    schema.fertilizerCatalogueEnabling,
)

export const cultivationCatalogueSelectingSchema = createExchangeSchema(
    schema.cultivationCatalogueSelecting,
)

// --- Root Schema ---

export const metaSchema = z.object({
    version: z.string(),
    exportedAt: z.string().datetime(), // Strict ISO string
    source: z.string(),
})

export const exchangeSchema = z.object({
    meta: metaSchema,
    farm: farmSchema,
    fields: z.array(fieldSchema),
    field_acquiring: z.array(fieldAcquiringSchema),
    field_discarding: z.array(fieldDiscardingSchema),
    fertilizers: z.array(fertilizerSchema),
    fertilizer_acquiring: z.array(fertilizerAcquiringSchema),
    fertilizer_applying: z.array(fertilizerApplicationSchema),
    fertilizers_catalogue: z.array(fertilizersCatalogueSchema),
    fertilizer_picking: z.array(fertilizerPickingSchema),
    cultivations: z.array(cultivationSchema),
    cultivation_starting: z.array(cultivationStartingSchema),
    cultivations_catalogue: z.array(cultivationsCatalogueSchema),
    harvestables: z.array(harvestableSchema),
    harvestable_sampling: z.array(harvestableSamplingSchema),
    harvestable_analyses: z.array(harvestableAnalysesSchema),
    cultivation_harvesting: z.array(cultivationHarvestingSchema),
    cultivation_ending: z.array(cultivationEndingSchema),
    soil_analysis: z.array(soilAnalysisSchema),
    soil_sampling: z.array(soilSamplingSchema),
    derogations: z.array(derogationSchema),
    derogation_applying: z.array(derogationApplyingSchema),
    organic_certifications: z.array(organicCertificationSchema),
    organic_certifications_holding: z.array(organicCertificationsHoldingSchema),
    intending_grazing: z.array(intendingGrazingSchema),
    fertilizer_catalogue_enabling: z.array(fertilizerCatalogueEnablingSchema),
    cultivation_catalogue_selecting: z.array(
        cultivationCatalogueSelectingSchema,
    ),
})

export type ExchangeData = z.infer<typeof exchangeSchema>
