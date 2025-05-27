import type {
    fdmSchema,
    Cultivation,
    Harvest,
    SoilAnalysis,
    FertilizerApplication,
    Fertilizer,
    CultivationCatalogue,
    Field,
} from "@svenvw/fdm-core"
import type { Decimal } from "decimal.js"

/**
 * Represents the nitrogen supply derived from various fertilizer applications.
 * All values are in kilograms of nitrogen per hectare (kg N / ha).
 */
export type NitrogenSupplyFertilizers = {
    /**
     * The total amount of nitrogen supplied by all types of fertilizers combined.
     */
    total: Decimal
    /**
     * The nitrogen supply specifically from mineral fertilizers.
     */
    mineral: {
        /**
         * The total amount of nitrogen supplied by all mineral fertilizers.
         */
        total: Decimal
        /**
         * A detailed list of individual mineral fertilizer applications.
         * Each entry includes the application's unique identifier (`id`) and the amount of nitrogen supplied (`value`).
         */
        applications: { id: string; value: Decimal }[]
    }
    /**
     * The nitrogen supply specifically from manure.
     */
    manure: {
        /**
         * The total amount of nitrogen supplied by manure.
         */
        total: Decimal
        /**
         * A detailed list of individual manure applications.
         * Each entry includes the application's unique identifier (`id`) and the amount of nitrogen supplied (`value`).
         */
        applications: { id: string; value: Decimal }[]
    }
    /**
     * The nitrogen supply specifically from compost.
     */
    compost: {
        /**
         * The total amount of nitrogen supplied by all compost applications.
         */
        total: Decimal
        /**
         * A detailed list of individual compost applications.
         * Each entry includes the application's unique identifier (`id`) and the amount of nitrogen supplied (`value`).
         */
        applications: { id: string; value: Decimal }[]
    }
    /**
     * The nitrogen supply specifically from other fertilizers than mineral, manure or compost.
     */
    other: {
        /**
         * The total amount of nitrogen supplied by all other fertilizer applications.
         */
        total: Decimal
        /**
         * A detailed list of individual other fertilzer applications.
         * Each entry includes the application's unique identifier (`id`) and the amount of nitrogen supplied (`value`).
         */
        applications: { id: string; value: Decimal }[]
    }
}

/**
 * Represents the nitrogen supply derived from fixation by cultivations.
 * All values are in kilograms of nitrogen per hectare (kg N / ha).
 */
export type NitrogenSupplyFixation = {
    /**
     * The total amount of nitrogen fixed by all crops on the field.
     */
    total: Decimal
    /**
     * A detailed list of cultivations that fix nitrogen.
     * Each entry includes the cultivation's unique identifier (`id`) and the amount of nitrogen fixed (`value`).
     */
    cultivations: { id: string; value: Decimal }[]
}

/**
 * Represents the amount of nitrogen supply derived from soil mineralization.
 * All values are in kilograms of nitrogen per hectare (kg N / ha).
 */
export type NitrogenSupplyMineralization = {
    /**
     * The total amount of nitrogen supply derived from soil mineralization on the field.
     */
    total: Decimal
}

/**
 * Represents the total nitrogen supply for a field, considering all sources.
 * All values are in kilograms of nitrogen per hectare (kg N / ha).
 */
export type NitrogenSupply = {
    /**
     * The total amount of nitrogen supplied to the field, encompassing all sources (fertilizers, fixation, deposition, and mineralization).
     */
    total: Decimal
    /**
     * The nitrogen supplied specifically from fertilizer applications.
     */
    fertilizers: NitrogenSupplyFertilizers
    /**
     * The nitrogen supplied through biological fixation by crops.
     */
    fixation: NitrogenSupplyFixation
    /**
     * The amount of nitrogen supplied through atmospheric deposition.
     */
    deposition: { total: Decimal }
    /**
     * The amount of nitrogen supplied through mineralization of organic matter in the soil during a cultivation
     */
    mineralisation: NitrogenSupplyMineralization
}

/**
 * The nitrogen removed specifically through harvested crops.
 */
export type NitrogenRemovalHarvests = {
    /**
     * The total amount of nitrogen removed by all harvested crops.
     */
    total: Decimal
    /**
     * A detailed list of individual harvested crops.
     * Each entry includes the crop's unique identifier (`id`) and the amount of nitrogen removed (`value`).
     */
    harvests: { id: string; value: Decimal }[]
}

/**
 * The nitrogen removed specifically through crop residues.
 */
export type NitrogenRemovalResidues = {
    /**
     * The total amount of nitrogen removed by all crop residues.
     */
    total: Decimal
    /**
     * A detailed list of crop residues.
     * Each entry includes the residue's unique identifier (`id`) and the amount of nitrogen removed (`value`).
     */
    cultivations: { id: string; value: Decimal }[]
}

/**
 * Represents the total nitrogen removal from a field.
 * All units are in kg N / ha.
 */
export type NitrogenRemoval = {
    /**
     * The total amount of nitrogen removed from the field through all means (harvested crops and residues).
     */
    total: Decimal
    /**
     * The nitrogen removed specifically through harvested crops.
     */
    harvests: NitrogenRemovalHarvests
    /**
     * The nitrogen removed specifically through crop residues.
     */
    residues: NitrogenRemovalResidues
}

/**
 * Represents the ammonia nitrogen emissions from various fertilizer sources.
 * All values are in kilograms of nitrogen per hectare (kg N / ha).
 */
export type NitrogenEmissionAmmoniaFertilizers = {
    /**
     * The total amount of ammonia nitrogen emitted from all fertilizer sources.
     */
    total: Decimal
    /**
     * Ammonia nitrogen emissions specifically from mineral fertilizers.
     */
    mineral: {
        /**
         * The total amount of ammonia nitrogen emitted from mineral fertilizers.
         */
        total: Decimal
        /**
         * A detailed list of individual mineral fertilizer applications.
         * Each entry includes the application's unique identifier (`id`) and the amount of ammonia nitrogen emitted (`value`).
         */
        applications: { id: string; value: Decimal }[]
    }
    /**
     * Ammonia nitrogen emissions specifically from manure.
     */
    manure: {
        /**
         * The total amount of ammonia nitrogen emitted from manure.
         */
        total: Decimal
        /**
         * A detailed list of individual manure applications.
         * Each entry includes the application's unique identifier (`id`) and the amount of ammonia nitrogen emitted (`value`).
         */
        applications: { id: string; value: Decimal }[]
    }
}

/**
 * Represents the ammonia nitrogen emissions specifically from crop residues.
 * All values are in kilograms of nitrogen per hectare (kg N / ha).
 */
export type NitrogenEmissionAmmoniaResidues = {
    /**
     * The total amount of ammonia nitrogen emitted from all crop residues.
     */
    total: Decimal
    /**
     * A detailed list of crop residues.
     * Each entry includes the residue's unique identifier (`id`) and the amount of ammonia nitrogen emitted (`value`).
     */
    cultivations: { id: string; value: Decimal }[]
}

/**
 * Represents the total ammonia nitrogen emissions for a field, considering all sources.
 * All values are in kilograms of nitrogen per hectare (kg N / ha).
 */
export type NitrogenEmissionAmmonia = {
    /**
     * The total amount of ammonia nitrogen emitted from the field, encompassing all sources (fertilizers and residues).
     */
    total: Decimal
    /**
     * Ammonia nitrogen emissions specifically from fertilizer applications.
     */
    fertilizers: NitrogenEmissionAmmoniaFertilizers
    /**
     * Ammonia nitrogen emissions specifically from crop residues.
     */
    residues: NitrogenEmissionAmmoniaResidues
    /**
     * Ammonia nitrogen emissions specifically from grazing. (Currently not calculated so set to undefined)
     */
    grazing: undefined
}

/**
 * Represents the total nitrogen volatilization for a field, specifically through ammonia emissions.
 * All values are in kilograms of nitrogen per hectare (kg N / ha).
 */
export type NitrogenVolatilization = {
    total: Decimal
    /**
     * The total amount of nitrogen volatilized as ammonia.
     */
    ammonia: NitrogenEmissionAmmonia
}

/**
 * Represents the nitrogen balance for a single field, including supply, removal, and volatilization.
 * All values are in kilograms of nitrogen per hectare (kg N / ha).
 */
export type NitrogenBalanceField = {
    /**
     * The unique identifier for the field.
     */
    b_id: string
    /**
     * The overall nitrogen balance for the field, calculated as supply minus removal minus volatilization.
     */
    balance: Decimal
    /**
     * The total nitrogen supply for the field.
     */
    supply: NitrogenSupply
    /**
     * The total nitrogen removal from the field.
     */
    removal: NitrogenRemoval
    /**
     * The total nitrogen volatilization from the field.
     */
    volatilization: NitrogenVolatilization
}

/**
 * Represents the total nitrogen balance across all fields.
 * All values are in kilograms of nitrogen per hectare (kg N / ha).
 */
export type NitrogenBalance = {
    /**
     * The overall nitrogen balance across all fields, likely a sum or average of individual field balances.
     */
    balance: Decimal
    /**
     * The total nitrogen supply across all fields.
     */
    supply: Decimal
    /**
     * The total nitrogen removal across all fields.
     */
    removal: Decimal
    /**
     * The total nitrogen volatilization across all fields.
     */
    volatilization: Decimal
    /**
     * A detailed breakdown of the nitrogen balance for each individual field.
     */
    fields: NitrogenBalanceField[]
}

export type SoilAnalysisPicked = Pick<
    SoilAnalysis,
    | "a_c_of" // g C / kg
    | "a_cn_fr" // -
    | "a_density_sa" // g / cm^3
    | "a_n_rt" // mg N / kg
    | "a_som_loi" // %
    | "b_soiltype_agr"
>

/**
 * Represents the structure of fields with related entities for nitrogen balance calculation
 */
export type FieldInput = {
    field: Pick<Field, "b_id" | "b_centroid" | "b_area" | "b_start" | "b_end">
    cultivations: Pick<
        Cultivation,
        "b_lu" | "b_lu_catalogue" | "m_cropresidue"
    >[]
    harvests: Harvest[]
    soilAnalyses: Pick<
        SoilAnalysis,
        | "a_id"
        | "b_sampling_date"
        | "a_c_of" // g C / kg
        | "a_cn_fr" // -
        | "a_density_sa" // g / cm^3
        | "a_n_rt" // mg N / kg
        | "a_som_loi" // %
        | "b_soiltype_agr"
    >[]
    fertilizerApplications: FertilizerApplication[]
}

/**
 * Represents cultivation details, specifically the cultivation catalogue identifier.
 */
export type CultivationDetail = Pick<
    CultivationCatalogue,
    | "b_lu_catalogue"
    | "b_lu_croprotation"
    | "b_lu_yield" // kg / ha
    | "b_lu_hi"
    | "b_lu_n_harvestable" // g N /kg
    | "b_lu_n_residue" // g N /kg
    | "b_n_fixation" // kg N / ha
>

/**
 * Represents fertilizer details needed for nitrogen balance calculation.
 */
export type FertilizerDetail = Pick<
    Fertilizer,
    | "p_id_catalogue"
    | "p_n_rt" // Total nitrogen content (g N / kg fertilizer)
    | "p_type_manure"
    | "p_type_mineral"
    | "p_type_compost"
>

/**
 * Represents the overall input structure required for nitrogen balance calculation.
 */
export type NitrogenBalanceInput = {
    fields: FieldInput[]
    fertilizerDetails: FertilizerDetail[]
    cultivationDetails: CultivationDetail[]
    timeFrame: {
        start: Date
        end: Date
    }
}

// Numeric version of NitrogenSupplyFertilizers
export type NitrogenSupplyFertilizersNumeric = {
    total: number
    mineral: {
        total: number
        applications: { id: string; value: number }[]
    }
    manure: {
        total: number
        applications: { id: string; value: number }[]
    }
    compost: {
        total: number
        applications: { id: string; value: number }[]
    }
}

// Numeric version of NitrogenSupplyFixation
export type NitrogenSupplyFixationNumeric = {
    total: number
    cultivations: { id: string; value: number }[]
}

// Numeric version of NitrogenSupplyMineralization
// Numeric version of NitrogenSupplyMineralization
export type NitrogenSupplyMineralizationNumeric = {
    total: number
}

// Numeric version of NitrogenSupply
export type NitrogenSupplyNumeric = {
    total: number
    fertilizers: NitrogenSupplyFertilizersNumeric
    fixation: NitrogenSupplyFixationNumeric
    deposition: { total: number }
    mineralisation: NitrogenSupplyMineralizationNumeric
}

// Numeric version of NitrogenRemovalHarvests
export type NitrogenRemovalHarvestsNumeric = {
    total: number
    harvests: { id: string; value: number }[]
}

// Numeric version of NitrogenRemovalResidues
export type NitrogenRemovalResiduesNumeric = {
    total: number
    cultivations: { id: string; value: number }[]
}

// Numeric version of NitrogenRemoval
export type NitrogenRemovalNumeric = {
    total: number
    harvests: NitrogenRemovalHarvestsNumeric
    residues: NitrogenRemovalResiduesNumeric
}

// Numeric version of NitrogenEmissionAmmoniaFertilizers
export type NitrogenEmissionAmmoniaFertilizersNumeric = {
    total: number
    mineral: {
        total: number
        applications: { id: string; value: number }[]
    }
    manure: {
        total: number
        applications: { id: string; value: number }[]
    }
}

// Numeric version of NitrogenEmissionAmmoniaResidues
export type NitrogenEmissionAmmoniaResiduesNumeric = {
    total: number
    cultivations: { id: string; value: number }[]
}

// Numeric version of NitrogenEmissionAmmonia
export type NitrogenEmissionAmmoniaNumeric = {
    total: number
    fertilizers: NitrogenEmissionAmmoniaFertilizersNumeric
    residues: NitrogenEmissionAmmoniaResiduesNumeric
    grazing: undefined
}

// Numeric version of NitrogenVolatilization
export type NitrogenVolatilizationNumeric = {
    total: number
    ammonia: NitrogenEmissionAmmoniaNumeric
}

// Numeric version of NitrogenBalanceField
export type NitrogenBalanceFieldNumeric = {
    b_id: string
    balance: number
    supply: NitrogenSupplyNumeric
    removal: NitrogenRemovalNumeric
    volatilization: NitrogenVolatilizationNumeric
}

// Numeric version of NitrogenBalance
export type NitrogenBalanceNumeric = {
    balance: number
    supply: number
    removal: number
    volatilization: number
    fields: NitrogenBalanceFieldNumeric[]
}
