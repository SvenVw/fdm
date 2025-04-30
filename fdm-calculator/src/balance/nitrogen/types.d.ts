import type {
    fdmSchema,
    Cultivation,
    Harvest,
    SoilAnalysis,
    FertilizerApplication,
    Fertilizer,
    CultivationCatalogue,
    Field,
    SoilAnalysis
} from "@svenvw/fdm-core"

/**
 * Represents the nitrogen supply derived from various fertilizer applications.
 * All values are in kilograms of nitrogen per hectare (kg N / ha).
 */
export interface NitrogenSupplyFertilizers {
    /**
     * The total amount of nitrogen supplied by all types of fertilizers combined.
     */
    total: number
    /**
     * The nitrogen supply specifically from mineral fertilizers.
     */
    mineral: {
        /**
         * The total amount of nitrogen supplied by all mineral fertilizers.
         */
        total: number
        /**
         * A detailed list of individual mineral fertilizer applications.
         * Each entry includes the application's unique identifier (`id`) and the amount of nitrogen supplied (`value`).
         */
        applications: { id: string; value: number }[]
    }
    /**
     * The nitrogen supply specifically from organic fertilizers.
     */
    organic: {
        /**
         * The total amount of nitrogen supplied by all organic fertilizers.
         */
        total: number
        /**
         * A detailed list of individual organic fertilizer applications.
         * Each entry includes the application's unique identifier (`id`) and the amount of nitrogen supplied (`value`).
         */
        applications: { id: string; value: number }[]
    }
    /**
     * The nitrogen supply specifically from manure (excluding compost).
     */
    manure: {
        /**
         * The total amount of nitrogen supplied by all manure applications.
         */
        total: number
        /**
         * A detailed list of individual manure applications.
         * Each entry includes the application's unique identifier (`id`) and the amount of nitrogen supplied (`value`).
         */
        applications: { id: string; value: number }[]
    }
    /**
     * The nitrogen supply specifically from compost.
     */
    compost: {
        /**
         * The total amount of nitrogen supplied by all compost applications.
         */
        total: number
        /**
         * A detailed list of individual compost applications.
         * Each entry includes the application's unique identifier (`id`) and the amount of nitrogen supplied (`value`).
         */
        applications: { id: string; value: number }[]
    }
}

/**
 * Represents the total nitrogen supply for a field, considering all sources.
 * All values are in kilograms of nitrogen per hectare (kg N / ha).
 */
export interface NitrogenSupply {
    /**
     * The total amount of nitrogen supplied to the field, encompassing all sources (fertilizers, fixation, deposition, and mineralization).
     */
    total: number
    /**
     * The nitrogen supplied specifically from fertilizer applications.
     */
    fertilizers: NitrogenSupplyFertilizers
    /**
     * The nitrogen supplied through biological fixation by crops.
     */
    fixation: {
        /**
         * The total amount of nitrogen fixed by all crops on the field.
         */
        total: number
        /**
         * A detailed list of cultivations that fix nitrogen.
         * Each entry includes the cultivation's unique identifier (`id`) and the amount of nitrogen fixed (`value`).
         */
        cultivations: { id: string; value: number }[]
    }
    /**
     * The amount of nitrogen supplied through atmospheric deposition.
     */
    deposition: number
    /**
     * The amount of nitrogen supplied through mineralization of organic matter in the soil.
     */
    mineralisation: number
}

/**
 * Represents the total nitrogen removal from a field.
 * All units are in kg N / ha.
 */
export interface NitrogenRemoval {
    /**
     * The total amount of nitrogen removed from the field through all means (harvested crops and residues).
     */
    total: number
    /**
     * The nitrogen removed specifically through harvested crops.
     */
    harvestables: {
        /**
         * The total amount of nitrogen removed by all harvested crops.
         */
        total: number
        /**
         * A detailed list of individual harvested crops.
         * Each entry includes the crop's unique identifier (`id`) and the amount of nitrogen removed (`value`).
         */
        harvestables: { id: string; value: number }[]
    }
    /**
     * The nitrogen removed specifically through crop residues.
     */
    residues: {
        /**
         * The total amount of nitrogen removed by all crop residues.
         */
        total: number
        /**
         * A detailed list of crop residues.
         * Each entry includes the residue's unique identifier (`id`) and the amount of nitrogen removed (`value`).
         */
        harvestables: { id: string; value: number }[]
    }
}

/**
 * Represents the ammonia nitrogen emissions from various fertilizer sources.
 * All values are in kilograms of nitrogen per hectare (kg N / ha).
 */
export interface NitrogenEmissionAmmoniaFertilizers {
    /**
     * The total amount of ammonia nitrogen emitted from all fertilizer sources.
     */
    total: number
    /**
     * Ammonia nitrogen emissions specifically from mineral fertilizers.
     */
    mineral: {
        /**
         * The total amount of ammonia nitrogen emitted from mineral fertilizers.
         */
        total: number
        /**
         * A detailed list of individual mineral fertilizer applications.
         * Each entry includes the application's unique identifier (`id`) and the amount of ammonia nitrogen emitted (`value`).
         */
        applications: { id: string; value: number }[]
    }
    /**
     * Ammonia nitrogen emissions specifically from organic fertilizers.
     */
    organic: {
        /**
         * The total amount of ammonia nitrogen emitted from organic fertilizers.
         */
        total: number
        /**
         * A detailed list of individual organic fertilizer applications.
         * Each entry includes the application's unique identifier (`id`) and the amount of ammonia nitrogen emitted (`value`).
         */
        applications: { id: string; value: number }[]
    }
}

/**
 * Represents the ammonia nitrogen emissions specifically from crop residues.
 * All values are in kilograms of nitrogen per hectare (kg N / ha).
 */
export interface NitrogenEmissionAmmoniaResidues {
    /**
     * The total amount of ammonia nitrogen emitted from all crop residues.
     */
    total: number
    /**
     * A detailed list of crop residues.
     * Each entry includes the residue's unique identifier (`id`) and the amount of ammonia nitrogen emitted (`value`).
     */
    harvestables: { id: string; value: number }[]
}

/**
 * Represents the total ammonia nitrogen emissions for a field, considering all sources.
 * All values are in kilograms of nitrogen per hectare (kg N / ha).
 */
export interface NitrogenEmissionAmmonia {
    /**
     * The total amount of ammonia nitrogen emitted from the field, encompassing all sources (fertilizers and residues).
     */
    total: number
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
export interface NitrogenVolatilization {
    /**
     * The total amount of nitrogen volatilized as ammonia.
     */
    ammonia: NitrogenEmissionAmmonia
}

/**
 * Represents the nitrogen balance for a single field, including supply, removal, and volatilization.
 * All values are in kilograms of nitrogen per hectare (kg N / ha).
 */
export interface NitrogenBalanceField {
    /**
     * The unique identifier for the field.
     */
    b_id: string
    /**
     * The overall nitrogen balance for the field, calculated as supply minus removal minus volatilization.
     */
    balance: number
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
export interface NitrogenBalance {
    /**
     * The overall nitrogen balance across all fields, likely a sum or average of individual field balances.
     */
    balance: number
    /**
     * The total nitrogen supply across all fields.
     */
    supply: number
    /**
     * The total nitrogen removal across all fields.
     */
    removal: number
    /**
     * The total nitrogen volatilization across all fields.
     */
    volatilization: number
    /**
     * A detailed breakdown of the nitrogen balance for each individual field.
     */
    fields: NitrogenBalanceField[]
}

/**
 * Represents the structure of fields with related entities for nitrogen balance calculation
 */
export interface Fields {
    field: Pick<Field, "b_id" | "b_area">
    cultivations: Cultivation[]
    harvests: Harvest[]
    soilAnalyses: SoilAnalysis[]
    fertilizerApplications: FertilizerApplication[]
}
;[]

/**
 * Represents cultivation details, specifically the cultivation catalogue identifier.
 */
export type cultivationDetails = Pick<CultivationCatalogue, "b_lu_catalogue">

/**
 * Represents fertilizer details needed for nitrogen balance calculation.
 */
export type FertilizerDetails = Pick<
    Fertilizer,
    | "p_id_catalogue"
    | "p_n_rt"
    | "p_type_manure"
    | "p_type_mineral"
    | "p_type_compost"
>

/**
 * Represents the overall input structure required for nitrogen balance calculation.
 */
export interface NitrogenBalanceInput {
    fields: {
        field: Fields
        cultivations: Cultivation[]
        harvests: Harvest[]
        soilAnalyses: soilAnalysis[]
        fertilizerApplications: fertilizerApplication[]
    }[]
    fertilizerDetails: FertilizerDetails[]
    cultivationDetails: CultivationCatalogue[]
}
