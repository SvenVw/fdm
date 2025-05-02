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
export interface NitrogenSupplyFertilizers {
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
}

/**
 * Represents the nitrogen supply derived from fixation by cultivations.
 * All values are in kilograms of nitrogen per hectare (kg N / ha).
 */
export interface NitrogenSupplyFixation {
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
 * Represents the total nitrogen supply for a field, considering all sources.
 * All values are in kilograms of nitrogen per hectare (kg N / ha).
 */
export interface NitrogenSupply {
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
    deposition: Decimal
    /**
     * The amount of nitrogen supplied through mineralization of organic matter in the soil.
     */
    mineralisation: Decimal
}

/**
 * The nitrogen removed specifically through harvested crops.
 */
export interface NitrogenRemovalHarvests {
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
export interface NitrogenRemovalResidues {
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
export interface NitrogenRemoval {
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
export interface NitrogenEmissionAmmoniaFertilizers {
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
export interface NitrogenEmissionAmmoniaResidues {
    /**
     * The total amount of ammonia nitrogen emitted from all crop residues.
     */
    total: Decimal
    /**
     * A detailed list of crop residues.
     * Each entry includes the residue's unique identifier (`id`) and the amount of ammonia nitrogen emitted (`value`).
     */
    harvestables: { id: string; value: Decimal }[]
}

/**
 * Represents the total ammonia nitrogen emissions for a field, considering all sources.
 * All values are in kilograms of nitrogen per hectare (kg N / ha).
 */
export interface NitrogenEmissionAmmonia {
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
export interface NitrogenVolatilization {
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
export interface NitrogenBalanceField {
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
export interface NitrogenBalance {
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

/**
 * Represents the structure of fields with related entities for nitrogen balance calculation
 */
export interface FieldInput {
    field: Pick<Field, "b_id" | "b_area">
    cultivations: Pick<
        Cultivation,
        "b_lu" | "b_lu_catalogue" | "m_cropresidue"
    >[]
    harvests: Harvest[]
    soilAnalyses: SoilAnalysis[]
    fertilizerApplications: FertilizerApplication[]
}

/**
 * Represents cultivation details, specifically the cultivation catalogue identifier.
 */
export type CultivationDetail = Pick<
    CultivationCatalogue,
    | "b_lu_catalogue"
    | "b_lu_yield"
    | "b_lu_hi"
    | "b_lu_n_harvestable"
    | "b_lu_n_residue"
    | "b_n_fixation"
>

/**
 * Represents fertilizer details needed for nitrogen balance calculation.
 */
export type FertilizerDetail = Pick<
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
export type NitrogenBalanceInput = {
    fields: FieldInput[]
    fertilizerDetails: FertilizerDetail[]
    cultivationDetails: CultivationDetail[]
    timeFrame: {
        start: Date
        end: Date
    }
    fdmPublicDataUrl: string
}

declare module "geoblaze" {
    export interface Geoblaze {
        identify(
            url: string,
            coords: [number, number],
        ): Promise<number[] | null>
    }

    const geoblaze: Geoblaze
    export default geoblaze
}
