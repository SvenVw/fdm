/**
 * @file This module provides a set of functions for converting between different soil
 * properties. These conversions are based on standard pedological formulas and are
 * essential for estimating soil parameters when direct measurements are unavailable.
 *
 * The functions handle conversions related to organic matter, organic carbon, C/N ratio,
 * and bulk density.
 *
 * @packageDocumentation
 */
import type { fdmSchema } from "@svenvw/fdm-core"
import { Decimal } from "decimal.js"

/**
 * Estimates the soil organic carbon (SOC) content from the soil organic matter (SOM) content.
 *
 * This function uses a standard conversion factor (the van Bemmelen factor) to estimate
 * the amount of organic carbon based on the percentage of organic matter determined by
 * loss on ignition (LOI). The result is clamped to a realistic range [0.1, 600].
 *
 * @param a_som_loi - The soil organic matter content (as a percentage) from LOI analysis.
 * @returns The estimated organic carbon content (in g C / kg soil), or `null` if the input is null.
 */
export function calculateOrganicCarbon(
    a_som_loi: fdmSchema.soilAnalysisTypeSelect["a_som_loi"],
): fdmSchema.soilAnalysisTypeSelect["a_c_of"] {
    if (!a_som_loi) {
        return null
    }

    let a_c_of = new Decimal(a_som_loi).times(0.5).times(10)

    if (a_c_of.gt(new Decimal(600))) {
        a_c_of = new Decimal(600)
    }
    if (a_c_of.lt(new Decimal(0.1))) {
        a_c_of = new Decimal(0.1)
    }

    return a_c_of.toNumber()
}

/**
 * Estimates the soil organic matter (SOM) content from the soil organic carbon (SOC) content.
 *
 * This is the inverse of the `calculateOrganicCarbon` function. It uses the same standard
 * conversion factor to estimate the percentage of organic matter. The result is clamped
 * to a realistic range [0.5, 75].
 *
 * @param a_c_of - The organic carbon content of the soil (in g C / kg soil).
 * @returns The estimated soil organic matter content (as a percentage), or `null` if the input is null.
 */
export function calculateOrganicMatter(
    a_c_of: fdmSchema.soilAnalysisTypeSelect["a_c_of"],
): fdmSchema.soilAnalysisTypeSelect["a_som_loi"] {
    if (!a_c_of) {
        return null
    }

    let a_som_loi = new Decimal(a_c_of).dividedBy(10).dividedBy(0.5)

    if (a_som_loi.gt(new Decimal(75))) {
        a_som_loi = new Decimal(75)
    }
    if (a_som_loi.lt(new Decimal(0.5))) {
        a_som_loi = new Decimal(0.5)
    }

    return a_som_loi.toNumber()
}

/**
 * Calculates the Carbon-to-Nitrogen (C/N) ratio of the soil.
 *
 * The C/N ratio is a critical indicator of nutrient cycling and soil fertility. This function
 * computes it by dividing the organic carbon content by the total nitrogen content.
 * The result is clamped to a typical range for agricultural soils [5, 40].
 *
 * @param a_c_of - The organic carbon content of the soil (in g C / kg soil).
 * @param a_n_rt - The total nitrogen content of the soil (in mg N / kg soil).
 * @returns The calculated C/N ratio, or `null` if either input is null.
 */
export function calculateCarbonNitrogenRatio(
    a_c_of: fdmSchema.soilAnalysisTypeSelect["a_c_of"],
    a_n_rt: fdmSchema.soilAnalysisTypeSelect["a_n_rt"],
): fdmSchema.soilAnalysisTypeSelect["a_cn_fr"] {
    if (!a_c_of || !a_n_rt) {
        return null
    }

    let a_cn_fr = new Decimal(a_c_of).dividedBy(
        new Decimal(a_n_rt).dividedBy(1000),
    )

    if (a_cn_fr.gt(new Decimal(40))) {
        a_cn_fr = new Decimal(40)
    }
    if (a_cn_fr.lt(new Decimal(5))) {
        a_cn_fr = new Decimal(5)
    }

    return a_cn_fr.toNumber()
}

/**
 * Estimates the bulk density of the soil.
 *
 * Bulk density is estimated based on the soil organic matter content and the broad soil type.
 * The function applies different empirical formulas for sandy/loess soils versus other soil
 * types (e.g., clay, peat). The result is clamped to a realistic range [0.5, 3.0] kg/m³.
 *
 * @param a_som_loi - The soil organic matter content (as a percentage).
 * @param b_soiltype_agr - The agricultural soil type.
 * @returns The estimated bulk density (in kg/m³), or `null` if either input is null.
 */
export function calculateBulkDensity(
    a_som_loi: fdmSchema.soilAnalysisTypeSelect["a_som_loi"],
    b_soiltype_agr: fdmSchema.soilAnalysisTypeSelect["b_soiltype_agr"],
): fdmSchema.soilAnalysisTypeSelect["a_density_sa"] {
    if (!a_som_loi || !b_soiltype_agr) {
        return null
    }

    let a_density_sa = new Decimal(0)
    if (["dekzand", "dalgrond", "duinzand", "loess"].includes(b_soiltype_agr)) {
        a_density_sa = new Decimal(1).dividedBy(
            new Decimal(a_som_loi).times(0.02525).plus(0.6541),
        )
    } else {
        const a = new Decimal(a_som_loi).pow(4).times(0.00000067)
        const b = new Decimal(a_som_loi).pow(3).times(0.00007792)
        const c = new Decimal(a_som_loi).pow(2).times(0.00314712)
        const d = new Decimal(a_som_loi).times(0.06039523)
        a_density_sa = a.minus(b).add(c).minus(d).add(1.33932206)
    }

    if (a_density_sa.gt(new Decimal(3))) {
        a_density_sa = new Decimal(3)
    }
    if (a_density_sa.lt(new Decimal(0.5))) {
        a_density_sa = new Decimal(0.5)
    }

    return a_density_sa.toNumber()
}
