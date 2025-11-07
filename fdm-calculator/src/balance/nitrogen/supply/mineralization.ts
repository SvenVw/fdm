/**
 * @file This module calculates nitrogen supply from soil organic matter mineralization.
 * It provides different models for estimating mineralization, including a primary
 * calculation function that uses default values based on soil type and land use,
 * and a more detailed model based on the MINIP formula.
 *
 * @packageDocumentation
 */
import type { fdmSchema } from "@svenvw/fdm-core"
import { differenceInCalendarDays } from "date-fns"
import Decimal from "decimal.js"
import type {
    CultivationDetail,
    FieldInput,
    NitrogenBalanceInput,
    NitrogenSupplyMineralization,
    SoilAnalysisPicked,
} from "../types"

/**
 * Calculates the nitrogen supply from soil mineralization over a given time frame.
 *
 * This function estimates nitrogen mineralization on an annual basis and adjusts the value
 * for the specified time frame. It determines the land use (grassland or other) for each
 * year within the period and applies a default mineralization rate based on the soil type.
 * The final value is an aggregation of the pro-rated mineralization for each year.
 *
 * @param cultivations - An array of cultivations to determine land use over time.
 * @param soilAnalysis - The consolidated soil analysis data, including soil type.
 * @param cultivationDetails - A map providing detailed data for each cultivation type.
 * @param timeFrame - The start and end dates for the calculation period.
 * @returns An object detailing the total nitrogen supply from mineralization and a
 *   breakdown of the value contributed by each year.
 */
export function calculateNitrogenSupplyBySoilMineralization(
    cultivations: FieldInput["cultivations"],
    soilAnalysis: SoilAnalysisPicked,
    cultivationDetails: Map<string, CultivationDetail>,
    timeFrame: NitrogenBalanceInput["timeFrame"],
): NitrogenSupplyMineralization {
    let totalMineralization = new Decimal(0)
    const minerlizationPerYear = []

    const startYear = timeFrame.start.getFullYear()
    const endYear = timeFrame.end.getFullYear()

    for (let year = startYear; year <= endYear; year++) {
        const may15 = new Date(year, 4, 15)
        const july15 = new Date(year, 6, 15)

        const isGrassland = cultivations.some((cultivation) => {
            const cultivationDetail = cultivationDetails.get(
                cultivation.b_lu_catalogue,
            )
            if (!cultivationDetail) return false

            const cultivationStart = new Date(cultivation.b_lu_start)
            const cultivationEnd = cultivation.b_lu_end
                ? new Date(cultivation.b_lu_end)
                : new Date("9999-12-31")

            // Check if the cultivation is grassland and overlaps with the May 15th to July 15th window
            return (
                cultivationDetail.b_lu_croprotation === "grass" &&
                cultivationStart <= july15 &&
                cultivationEnd >= may15
            )
        })

        const yearlyMineralization =
            calculateNitrogenSupplyBySoilMineralizationUsingDefaults(
                soilAnalysis.b_soiltype_agr,
                isGrassland,
            )

        const yearStartTime = new Date(year, 0, 1).getTime()
        const yearEndTime = new Date(year + 1, 0, 1).getTime()
        const timeframeStartTime = timeFrame.start.getTime()
        const timeframeEndTime = timeFrame.end.getTime()

        const overlapStart = Math.max(yearStartTime, timeframeStartTime)
        const overlapEnd = Math.min(yearEndTime, timeframeEndTime)

        if (overlapStart < overlapEnd) {
            const daysInYear =
                new Date(year, 1, 29).getMonth() === 1 ? 366 : 365
            const overlapDays = differenceInCalendarDays(
                new Date(overlapEnd),
                new Date(overlapStart),
            )
            const adjustedMineralization = yearlyMineralization
                .times(overlapDays)
                .dividedBy(daysInYear)
            totalMineralization = totalMineralization.add(
                adjustedMineralization,
            )
            minerlizationPerYear.push({
                year,
                value: adjustedMineralization,
            })
        }
    }

    return {
        total: totalMineralization,
        years: minerlizationPerYear,
    }
}

/**
 * Determines the default annual nitrogen mineralization rate based on soil type and land use.
 *
 * This function provides a simplified estimation of nitrogen mineralization using standard,
 * tabulated values. It currently implements specific rates for "dalgrond" and "veen"
 * (peat) soils, with different values for grassland versus other land uses on peat soils.
 *
 * @param b_soiltype_agr - The agricultural soil type.
 * @param is_grassland - A boolean indicating if the land is used as grassland.
 * @returns The estimated annual nitrogen mineralization in kg N/ha/year as a `Decimal`.
 * @internal
 */
function calculateNitrogenSupplyBySoilMineralizationUsingDefaults(
    b_soiltype_agr: SoilAnalysisPicked["b_soiltype_agr"],
    is_grassland: boolean,
): Decimal {
    let mineralization = new Decimal(0)

    // At Dalgrond set mineralization to 20 kg N / ha / year
    if (b_soiltype_agr === "dalgrond") {
        mineralization = new Decimal(20)
    }

    // At Veen, set default mineralization based on land use
    if (b_soiltype_agr === "veen") {
        if (is_grassland) {
            mineralization = new Decimal(160)
        } else {
            // Arable or fallow
            mineralization = new Decimal(20)
        }
    }

    return mineralization
}

/**
 * Calculates nitrogen mineralization using the MINIP model.
 *
 * This function implements a more detailed model for mineralization based on specific
 * soil properties and temperature. It calculates the amount of decomposable carbon (`cDec`)
 * and then uses this to estimate the nitrogen released. The model incorporates:
 * - Soil organic carbon content (`a_c_of`).
 * - Carbon-to-nitrogen ratio (`a_cn_fr`).
 * - Soil bulk density (`a_density_sa`).
 * - A temperature correction factor based on mean annual temperature.
 *
 * @param a_c_of - The organic carbon content of the soil (in g C / kg soil).
 * @param a_cn_fr - The carbon-to-nitrogen ratio of the soil.
 * @param a_density_sa - The bulk density of the soil (in kg / m³).
 * @returns The calculated annual nitrogen mineralization in kg N/ha as a `Decimal`.
 * @throws {Error} If required soil parameters are null or if the average yearly temperature
 *   is outside the model's valid range.
 */
export function calculateNitrogenSupplyBySoilMineralizationUsingMinip(
    a_c_of: fdmSchema.soilAnalysisTypeSelect["a_c_of"],
    a_cn_fr: fdmSchema.soilAnalysisTypeSelect["a_cn_fr"],
    a_density_sa: fdmSchema.soilAnalysisTypeSelect["a_density_sa"],
): Decimal {
    // Average yearly temperature
    const w_temp_mean = new Decimal(10.6)

    // Depth of bouwvoor (cm)
    const bouwvoor = new Decimal(20)

    // Calculate temperature correction
    let temperatureCorrection = new Decimal(0)
    if (w_temp_mean.gt(-1) && w_temp_mean.lte(9)) {
        temperatureCorrection = w_temp_mean.times(0.1)
    } else if (w_temp_mean.gt(9) && w_temp_mean.lte(27)) {
        const a = w_temp_mean.minus(9).dividedBy(9)
        temperatureCorrection = new Decimal(2).pow(a)
    } else if (w_temp_mean.gt(27)) {
        throw new Error("Average yearly temperature is too high")
    }

    if (a_c_of === null || a_c_of === undefined) {
        throw new Error("No a_c_of value found in soil analysis for arable")
    }
    if (a_cn_fr === null || a_cn_fr === undefined) {
        throw new Error("No a_cn_fr value found in soil analysis for arable")
    }
    if (a_density_sa === null || a_density_sa === undefined) {
        throw new Error(
            "No a_density_sa value found in soil analysis for arable",
        )
    }

    // Calculate Cdec
    const b = temperatureCorrection.times(10).add(17).pow(-0.6)
    const c = new Decimal(17).pow(-0.6)
    const d = b.minus(c).times(4.7).exp()
    const e = new Decimal(1).minus(d)
    const cDec = new Decimal(a_c_of).times(e).dividedBy(10)

    // Calculate the mineralization
    const f = new Decimal(1.5).times(cDec).dividedBy(a_cn_fr)
    const g = cDec.dividedBy(bouwvoor)
    const mineralization = f
        .minus(g)
        .times(10000)
        .times(bouwvoor.dividedBy(100))
        .times(a_density_sa)

    return mineralization
}
