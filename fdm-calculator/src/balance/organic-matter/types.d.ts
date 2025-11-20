import type {
    Cultivation,
    CultivationCatalogue,
    Fertilizer,
    FertilizerApplication,
    Field,
    Harvest,
    SoilAnalysis,
} from "@svenvw/fdm-core"
import type { Decimal } from "decimal.js"

/**
 * Represents the organic matter supply derived from various fertilizer applications.
 * All values are in kilograms of organic matter per hectare (kg OM / ha).
 */
export type OrganicMatterSupplyFertilizers = {
    /**
     * The total amount of organic matter supplied by all types of fertilizers combined.
     */
    total: Decimal
    /**
     * The organic matter supply specifically from manure.
     */
    manure: {
        /**
         * The total amount of organic matter supplied by manure.
         */
        total: Decimal
        /**
         * A detailed list of individual manure applications.
         * Each entry includes the application's unique identifier (`id`) and the amount of organic matter supplied (`value`).
         */
        applications: { id: string; value: Decimal }[]
    }
    /**
     * The organic matter supply specifically from compost.
     */
    compost: {
        /**
         * The total amount of organic matter supplied by all compost applications.
         */
        total: Decimal
        /**
         * A detailed list of individual compost applications.
         * Each entry includes the application's unique identifier (`id`) and the amount of organic matter supplied (`value`).
         */
        applications: { id: string; value: Decimal }[]
    }
    /**
     * The organic matter supply specifically from other fertilizers than manure or compost.
     */
    other: {
        /**
         * The total amount of organic matter supplied by all other fertilizer applications.
         */
        total: Decimal
        /**
         * A detailed list of individual other fertilizer applications.
         * Each entry includes the application's unique identifier (`id`) and the amount of organic matter supplied (`value`).
         */
        applications: { id: string; value: Decimal }[]
    }
}

/**
 * Represents the organic matter supply derived from cultivations.
 * All values are in kilograms of organic matter per hectare (kg OM / ha).
 */
export type OrganicMatterSupplyCultivations = {
    /**
     * The total amount of organic matter supplied by all cultivations on the field.
     */
    total: Decimal
    /**
     * A detailed list of cultivations that supply organic matter.
     * Each entry includes the cultivation's unique identifier (`id`) and the amount of organic matter supplied (`value`).
     */
    cultivations: { id: string; value: Decimal }[]
}

/**
 * Represents the organic matter supply derived from crop residues.
 * All values are in kilograms of organic matter per hectare (kg OM / ha).
 */
export type OrganicMatterSupplyResidues = {
    /**
     * The total amount of organic matter supplied by all crop residues.
     */
    total: Decimal
    /**
     * A detailed list of cultivations whose residues supply organic matter.
     * Each entry includes the cultivation's unique identifier (`id`) and the amount of organic matter supplied (`value`).
     */
    cultivations: { id: string; value: Decimal }[]
}

/**
 * Represents the total organic matter supply for a field, considering all sources.
 * All values are in kilograms of organic matter per hectare (kg OM / ha).
 */
export type OrganicMatterSupply = {
    /**
     * The total amount of organic matter supplied to the field, encompassing all sources (fertilizers, cultivations, residues).
     */
    total: Decimal
    /**
     * The organic matter supplied specifically from fertilizer applications.
     */
    fertilizers: OrganicMatterSupplyFertilizers
    /**
     * The organic matter supplied through cultivations.
     */
    cultivations: OrganicMatterSupplyCultivations
    /**
     * The organic matter supplied through crop residues.
     */
    residues: OrganicMatterSupplyResidues
}

/**
 * Represents the organic matter degradation for a field.
 * All values are in kilograms of organic matter per hectare (kg OM / ha).
 */
export type OrganicMatterDegradation = {
    /**
     * The total amount of organic matter degraded on the field.
     */
    total: Decimal
}

/**
 * Represents the organic matter balance for a single field, including supply and degradation.
 * All values are in kilograms of organic matter per hectare (kg OM / ha).
 */
export type OrganicMatterBalanceField = {
    /**
     * The unique identifier for the field.
     */
    b_id: string
    /**
     * The overall organic matter balance for the field.
     */
    balance: Decimal
    /**
     * The total organic matter supply for the field.
     */
    supply: OrganicMatterSupply
    /**
     * The total organic matter degradation from the field.
     */
    degradation: OrganicMatterDegradation
}

/**
 * Represents the result of an organic matter balance calculation for a single field, which may include an error message.
 */
export type OrganicMatterBalanceFieldResult = {
    b_id: string
    b_area: number
    balance?: OrganicMatterBalanceField
    errorMessage?: string
}

/**
 * Represents the total organic matter balance across all fields.
 * All values are in kilograms of organic matter per hectare (kg OM / ha).
 */
export type OrganicMatterBalance = {
    /**
     * The overall organic matter balance across all fields, a sum or average of individual field balances.
     */
    balance: Decimal
    /**
     * The total organic matter supply across all fields.
     */
    supply: Decimal
    /**
     * The total organic matter degradation across all fields.
     */
    degradation: Decimal
    /**
     * A detailed breakdown of the organic matter balance for each individual field.
     */
    fields: OrganicMatterBalanceFieldResult[]
    /**
     * Indicates if any field calculations failed.
     */
    hasErrors: boolean
    /**
     * A list of error messages for fields that failed to calculate.
     */
    fieldErrorMessages: string[]
}

export type SoilAnalysisPicked = Pick<
    SoilAnalysis,
    | "a_som_loi" // %
    | "a_density_sa" // g / cm^3
>

/**
 * Represents the structure of fields with related entities for organic matter balance calculation
 */
export type FieldInput = {
    field: Pick<Field, "b_id" | "b_centroid" | "b_area" | "b_start" | "b_end">
    cultivations: Pick<
        Cultivation,
        "b_lu" | "b_lu_start" | "b_lu_end" | "b_lu_catalogue" | "m_cropresidue"
    >[]
    harvests: Harvest[]
    soilAnalyses: Pick<
        SoilAnalysis,
        | "a_id"
        | "b_sampling_date"
        | "a_som_loi" // %
        | "a_density_sa" // g / cm^3
    >[]
    fertilizerApplications: FertilizerApplication[]
}

/**
 * Represents cultivation details needed for organic matter balance calculation.
 */
export type CultivationDetail = Pick<
    CultivationCatalogue,
    | "b_lu_catalogue"
    | "b_lu_croprotation"
    | "b_lu_eom" // kg/ha/yr - OM from crops
    | "b_lu_eom_residues" // kg/ha/yr - OM from residues
>

/**
 * Represents fertilizer details needed for organic matter balance calculation.
 */
export type FertilizerDetail = Pick<
    Fertilizer,
    | "p_id_catalogue"
    | "p_eom" // OM content (g OM / kg fertilizer)
    | "p_type" // Added p_type here
>

/**
 * Represents the overall input structure required for organic matter balance calculation.
 */
export type OrganicMatterBalanceInput = {
    fields: FieldInput[]
    fertilizerDetails: FertilizerDetail[]
    cultivationDetails: CultivationDetail[]
    timeFrame: {
        start: Date
        end: Date
    }
}

// Numeric version of OrganicMatterSupplyFertilizers
export type OrganicMatterSupplyFertilizersNumeric = {
    total: number
    manure: {
        total: number
        applications: { id: string; value: number }[]
    }
    compost: {
        total: number
        applications: { id: string; value: number }[]
    }
    other: {
        total: number
        applications: { id: string; value: number }[]
    }
}

// Numeric version of OrganicMatterSupplyCultivations
export type OrganicMatterSupplyCultivationsNumeric = {
    total: number
    cultivations: { id: string; value: number }[]
}

// Numeric version of OrganicMatterSupplyResidues
export type OrganicMatterSupplyResiduesNumeric = {
    total: number
    cultivations: { id: string; value: number }[]
}

// Numeric version of OrganicMatterSupply
export type OrganicMatterSupplyNumeric = {
    total: number
    fertilizers: OrganicMatterSupplyFertilizersNumeric
    cultivations: OrganicMatterSupplyCultivationsNumeric
    residues: OrganicMatterSupplyResiduesNumeric
}

// Numeric version of OrganicMatterDegradation
export type OrganicMatterDegradationNumeric = {
    total: number
    years: { year: number; value: number }[]
}

// Numeric version of OrganicMatterBalanceField
export type OrganicMatterBalanceFieldNumeric = {
    b_id: string
    balance: number
    supply: OrganicMatterSupplyNumeric
    degradation: OrganicMatterDegradationNumeric
}

/**
 * Represents the numeric version of OrganicMatterBalanceFieldResult.
 */
export type OrganicMatterBalanceFieldResultNumeric = {
    b_id: string
    b_area: number
    balance?: OrganicMatterBalanceFieldNumeric
    errorMessage?: string
}

// Numeric version of OrganicMatterBalance
export type OrganicMatterBalanceNumeric = {
    balance: number
    supply: number
    degradation: number
    fields: OrganicMatterBalanceFieldResultNumeric[]
    hasErrors: boolean
    fieldErrorMessages: string[]
}
