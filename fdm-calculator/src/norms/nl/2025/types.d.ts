import type {
    Cultivation,
    CultivationCatalogue,
    FdmType,
    Field,
    SoilAnalysis,
} from "@svenvw/fdm-core"

/**
 * Represents the collected input for a single cultivation, required for NL 2025 norm calculations.
 */
export type NL2025NormsInputForCultivation = {
    /** The cultivation record from fdm-core. */
    cultivation: Pick<
        Cultivation,
        "b_lu" | "b_lu_catalogue" | "b_lu_start" | "b_lu_end" | "b_lu_variety"
    >
    /** The most recent soil analysis data available before the start of the cultivation. */
    soilAnalysis?: Pick<SoilAnalysis, "a_p_cc" | "a_p_al">
}

/**
 * Represents all the norm-related inputs for a single field.
 */
export type NL2025NormsInputForField = {
    /** The field record from fdm-core, including its ID and centroid for location-based checks. */
    field: Pick<Field, "b_id" | "b_centroid">
    /** An array of all cultivations on the field with their required norm inputs. */
    cultivations: NL2025NormsInputForCultivation[]
}

/**
 * Represents the complete set of inputs required to calculate all NL 2025 norms for a given farm.
 */
export type NL2025NormsInput = {
    /** Farm-level properties, such as derogation status. */
    farm: {
        is_derogatie_bedrijf: boolean
    }
    /** An array of all fields belonging to the farm, each with their detailed norm inputs. */
    fields: NL2025NormsInputForField[]
}

/**
 * Defines the input parameters required for the `getNL2025DierlijkeMestGebruiksNorm` function.
 */
export interface DierlijkeMestGebruiksnormInput {
    /**
     * A boolean indicating whether the farm has a derogation permit for 2025.
     * Farms with derogation may have higher animal manure nitrogen norms.
     */
    is_derogatie_bedrijf: boolean
    /**
     * The field for which the norm is being calculated. The centroid is used to determine if it's in an NV-area.
     */
    field: Pick<Field, "b_id" | "b_centroid">
}

/**
 * The result object returned by the `getNL2025DierlijkeMestGebruiksNorm` function,
 * containing the determined animal manure nitrogen usage norm and its source.
 */
export interface DierlijkeMestGebruiksnormResult {
    /**
     * The determined usage standard for nitrogen from animal manure in kg N per hectare.
     */
    normValue: number
    /**
     * A descriptive string indicating which rule or category was applied to determine the norm.
     * Examples: "Standaard", "Derogatie - NV Gebied", "Derogatie - Buiten NV Gebied".
     */
    normSource: string
}

/**
 * Represents the phosphate usage norm values for a specific phosphate class,
 * differentiated by grassland and arable land.
 */
export interface FosfaatNorm {
    grasland: number
    bouwland: number
}

/**
 * Defines the possible phosphate classes based on RVO's "Tabel Fosfaatgebruiksnormen 2025".
 * These classes are determined by P-CaCl2 and P-Al soil analysis values.
 */
export type FosfaatKlasse = "Arm" | "Laag" | "Neutraal" | "Ruim" | "Hoog"

/**
 * Defines the input parameters required for the `getNL2025FosfaatGebruiksNorm` function.
 */
export interface FosfaatGebruiksnormInput {
    /** An initialized FdmType instance for data access. */
    fdm: FdmType
    /** The ID of the farm to which the cultivation belongs. */
    b_id_farm: string
    /** The cultivation catalogue code, used to determine if it's grassland. */
    b_lu_catalogue: string
    /**
     * The P-CaCl2 (also known as P-PAE) value from a recent soil analysis report (in mg P2O5 per kg soil).
     * This value, along with `a_p_al`, is used to determine the soil's phosphate class.
     */
    a_p_cc: number
    /**
     * The P-Al value from a recent soil analysis report (in mg P2O5 per kg soil).
     * This value, along with `a_p_cc`, is used to determine the soil's phosphate class.
     */
    a_p_al: number
}

/**
 * The result object returned by the `getNL2025FosfaatGebruiksNorm` function,
 * containing the determined phosphate usage norm and the corresponding phosphate class.
 */
export interface FosfaatGebruiksnormResult {
    /**
     * The determined phosphate usage standard in kg P2O5 per hectare.
     */
    normValue: number
    /**
     * The cultivation and phosphate class ('Arm', 'Laag', 'Neutraal', 'Ruim', 'Hoog')
     * that was determined from the soil analysis values and used to derive the norm.
     */
    normSource: string
}

/**
 * Defines the structure for a single nitrogen standard entry,
 * based on the RVO's "Tabel 2 Stikstof landbouwgrond 2025" and related documents.
 * This interface supports various complexities like different norms for regions,
 * specific varieties, derogation status, and sub-types for temporary grasslands.
 */
export interface NitrogenStandard {
    /**
     * The cultivation name as it appears in RVO's "Tabel 2 Stikstof landbouwgrond 2025".
     * This is used for descriptive purposes and as part of the function's return value.
     * @example "Grasland", "Akkerbouwgewassen, mais"
     */
    cultivation_rvo_table2: string
    /**
     * An array of BRP (Basisregistratie Percelen) cultivation codes that match this standard.
     * This allows a single standard entry to apply to multiple BRP codes.
     * @example ["nl_265", "nl_331"]
     */
    b_lu_catalogue_match: string[]
    /**
     * A general type classification for the cultivation (e.g., "grasland", "aardappel", "akkerbouw").
     * Used internally for conditional logic in norm determination.
     */
    type: string
    /**
     * Optional. A more specific classification for varieties, particularly for potatoes.
     * @example "consumptie_overig", "poot_overig"
     */
    variety_type?: string
    /**
     * Optional. A list of specific varieties that fall under this standard.
     * Used for filtering when a `b_lu_variety` is provided.
     */
    varieties?: string[]
    /**
     * Optional. The default nitrogen norms (standard and NV-area) per region.
     * This is the most common structure for norms.
     */
    norms?: {
        klei: { standard: number; nv_area: number }
        zand_nwc: { standard: number; nv_area: number }
        zand_zuid: { standard: number; nv_area: number }
        loss: { standard: number; nv_area: number }
        veen: { standard: number; nv_area: number }
    }
    /**
     * Optional. A list of varieties that qualify for a 'high norm' for certain crops (e.g., potatoes).
     */
    varieties_hoge_norm?: string[]
    /**
     * Optional. A list of varieties that qualify for a 'low norm' for certain crops (e.g., potatoes).
     */
    varieties_lage_norm?: string[]
    /**
     * Optional. Nitrogen norms specifically for 'high norm' varieties, per region.
     */
    norms_hoge_norm?: {
        klei: { standard: number; nv_area: number }
        zand_nwc: { standard: number; nv_area: number }
        zand_zuid: { standard: number; nv_area: number }
        loss: { standard: number; nv_area: number }
        veen: { standard: number; nv_area: number }
    }
    /**
     * Optional. Nitrogen norms specifically for 'low norm' varieties, per region.
     */
    norms_lage_norm?: {
        klei: { standard: number; nv_area: number }
        zand_nwc: { standard: number; nv_area: number }
        zand_zuid: { standard: number; nv_area: number }
        loss: { standard: number; nv_area: number }
        veen: { standard: number; nv_area: number }
    }
    /**
     * Optional. Nitrogen norms for 'other' varieties when specific high/low norms don't apply.
     */
    norms_overig?: {
        klei: { standard: number; nv_area: number }
        zand_nwc: { standard: number; nv_area: number }
        zand_zuid: { standard: number; nv_area: number }
        loss: { standard: number; nv_area: number }
        veen: { standard: number; nv_area: number }
    }
    /**
     * Optional. Nitrogen norms specifically for farms with derogation status, per region.
     * Applicable for certain crops like maize.
     */
    derogatie_norms?: {
        klei: { standard: number; nv_area: number }
        zand_nwc: { standard: number; nv_area: number }
        zand_zuid: { standard: number; nv_area: number }
        loss: { standard: number; nv_area: number }
        veen: { standard: number; nv_area: number }
    }
    /**
     * Optional. Nitrogen norms specifically for farms without derogation status, per region.
     * Applicable for certain crops like maize.
     */
    non_derogatie_norms?: {
        klei: { standard: number; nv_area: number }
        zand_nwc: { standard: number; nv_area: number }
        zand_zuid: { standard: number; nv_area: number }
        loss: { standard: number; nv_area: number }
        veen: { standard: number; nv_area: number }
    }
    /**
     * Optional. An array of sub-types for a cultivation, each with its own norms and period descriptions.
     * Used for crops like temporary grassland where norms vary based on the period of cultivation.
     */
    sub_types?: Array<{
        omschrijving?: string
        period_description?: string
        period_start_month?: number
        period_start_day?: number
        period_end_month?: number
        period_end_day?: number
        norms: {
            klei: { standard: number; nv_area: number }
            zand_nwc: { standard: number; nv_area: number }
            zand_zuid: { standard: number; nv_area: number }
            loss: { standard: number; nv_area: number }
            veen: { standard: number; nv_area: number }
        }
        // Note: winterteelt properties are removed from the top-level NitrogenStandard
        // but are kept here within sub_types if specific sub-periods have them.
        winterteelt_voor_31_12?: {
            klei: { standard: number; nv_area: number }
            zand_nwc: { standard: number; nv_area: number }
            zand_zuid: { standard: number; nv_area: number }
            loss: { standard: number; nv_area: number }
            veen: { standard: number; nv_area: number }
        }
        winterteelt_na_31_12?: {
            klei: { standard: number; nv_area: number }
            zand_nwc: { standard: number; nv_area: number }
            zand_zuid: { standard: number; nv_area: number }
            loss: { standard: number; nv_area: number }
            veen: { standard: number; nv_area: number }
        }
    }>
}

/**
 * Defines the valid keys for different soil regions in the Netherlands.
 */
export type RegionKey = "klei" | "zand_nwc" | "zand_zuid" | "loss" | "veen"

/**
 * A utility type to represent nitrogen norms structured by region.
 */
export type NormsByRegion = {
    [key in RegionKey]: { standard: number; nv_area: number }
}

/**
 * The result object returned by the `getNL2025StikstofGebruiksNorm` function,
 * containing the calculated norm value and the name of the cultivation used for the calculation.
 */
export interface GebruiksnormResult {
    /**
     * The determined nitrogen usage standard in kg N per hectare.
     */
    normValue: number
    /**
     * The cultivation name according to RVO's "Tabel 2 Stikstof landbouwgrond 2025"
     * that was used to determine the legal limit.
     */
    normSource: string
}

export interface StikstofGebruiksnormInput {
    b_lu_catalogue: string
    field: Pick<Field, "b_id" | "b_centroid">
    b_lu_end: Date
    b_lu_variety?: string
    is_derogatie_bedrijf?: boolean
}
