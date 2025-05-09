import type { fdmSchema } from "@svenvw/fdm-core"
import type {
    NitrogenSupplyMineralization,
    CultivationDetail,
    FieldInput,
    SoilAnalysisPicked,
} from "../types"
import Decimal from "decimal.js"

/**
 * Calculates the amount of nitrogen supplied through soil mineralization, considering both grassland and arable land.
 *
 * This function determines the mineralization based on the cultivations performed and soil analyses conducted.
 * It uses cultivation details to differentiate between grassland and arable land, then applies specific calculations for each.
 * @param cultivations - A list of cultivations on the field.
 * @param soilAnalysis - Combined soil analysis data for the field.
 * @param cultivationDetailsMap - A map containing details for each cultivation.
 * @returns The NitrogenSupplyMineralization object containing the total amount of Nitrogen mineralized and the individual cultivation values.
 */
export function calculateNitrogenSupplyBySoilMineralization(
    cultivations: FieldInput["cultivations"],
    soilAnalysis: SoilAnalysisPicked,
    cultivationDetailsMap: Map<string, CultivationDetail>,
): NitrogenSupplyMineralization {
    if (cultivations.length === 0) {
        return {
            total: new Decimal(0),
            cultivations: [],
        }
    }
    const mineralizations = cultivations.map((cultivation) => {
        // Get details of cultivation using the Map
        const cultivationDetail = cultivationDetailsMap.get(
            cultivation.b_lu_catalogue,
        )

        if (!cultivationDetail) {
            throw new Error(
                `Cultivation ${cultivation.b_lu} has no corresponding cultivation in cultivationDetails`,
            )
        }

        // if (soilAnalyses.length === 0) {
        //     return {
        //         id: cultivation.b_lu,
        //         value: new Decimal(0),
        //     }
        // }

        const b_lu_croprotation = cultivationDetail.b_lu_croprotation
        const isGrassland = b_lu_croprotation === "grassland"

        // Calculate the amount of Nitrogen mineralized by the soil
        let mineralization = Decimal(0)
        if (isGrassland) {
            mineralization =
                calculateNitrogenSupplyBySoilMineralizationForGrassland(
                    soilAnalysis.b_soiltype_agr,
                    soilAnalysis.a_n_rt,
                )
        } else {
            mineralization =
                calculateNitrogenSupplyBySoilMineralizationForArable(
                    soilAnalysis.a_c_of,
                    soilAnalysis.a_cn_fr,
                    soilAnalysis.a_density_sa,
                )
        }

        // Limit the min and max value of mineralization
        if (mineralization.greaterThan(new Decimal(250))) {
            mineralization = new Decimal(250)
        }
        if (mineralization.lessThan(new Decimal(5))) {
            mineralization = new Decimal(5)
        }

        return {
            id: cultivation.b_lu,
            value: new Decimal(mineralization),
        }
    })

    // Calculate the total amount of Nitrogen mineralized
    const totalValue = mineralizations.reduce((acc, mineralization) => {
        if (!mineralization.value) return acc
        return acc.add(mineralization.value)
    }, Decimal(0))

    return {
        total: totalValue,
        cultivations: mineralizations,
    }
}

/**
 * Calculates the amount of nitrogen supplied through soil mineralization for grassland.
 *
 * This function applies a specific formula to calculate nitrogen mineralization based on soil type and total nitrogen content.
 * @param b_soiltype_agr - The agricultural soil type.
 * @param a_n_rt - The total nitrogen content of the soil (g N / kg soil).
 * @returns The amount of nitrogen mineralized in kg N / ha.
 * @throws Throws an error if the soil type is unknown or required data is missing.
 */
function calculateNitrogenSupplyBySoilMineralizationForGrassland(
    b_soiltype_agr: fdmSchema.soilAnalysisTypeSelect["b_soiltype_agr"],
    a_n_rt: fdmSchema.soilAnalysisTypeSelect["a_n_rt"],
): Decimal {
    // Return amount of Nitrogen mineralizd by soil at Grassland for veen
    if (b_soiltype_agr === "veen") {
        return Decimal(250)
    }

    if (a_n_rt === null || a_n_rt === undefined) {
        throw new Error("No a_n_rt value found in soil analysis for grassland")
    }
    if (b_soiltype_agr === null || b_soiltype_agr === undefined) {
        throw new Error(
            "No b_soiltype_agr value found in soil analysis for grassland",
        )
    }

    // Return amount of Nitrogen mineralizd by soil at Grasslans for zand
    if (["dekzand", "dalgrond", "duinzand"].includes(b_soiltype_agr)) {
        return new Decimal(a_n_rt)
            .dividedBy(1000)
            .pow(1.0046)
            .times(28.4)
            .add(78)
    }

    // Return amount of Nitrogen mineralizd by soil at Grasslan for klei
    if (
        ["moerige_klei", "rivierklei", "zeeklei", "loess", "maasklei"].includes(
            b_soiltype_agr,
        )
    ) {
        return new Decimal(a_n_rt)
            .dividedBy(1000)
            .pow(1.0046)
            .times(31.6)
            .add(31.7)
    }

    throw new Error(`Unknown soil type: ${b_soiltype_agr}`)
}

/**
 * Calculates the amount of nitrogen supplied through soil mineralization for arable land.
 *
 * This function applies a specific formula to calculate nitrogen mineralization based on organic carbon content,
 * C/N ratio, and soil bulk density.
 * @param a_c_of - The organic carbon content of the soil (g C / kg soil).
 * @param a_cn_fr - The C/N ratio of the soil organic matter.
 * @param a_density_sa - The soil bulk density (kg / m³).
 * @returns The amount of nitrogen mineralized in kg N / ha.
 * @throws Throws an error if required soil analysis data is missing or average yearly temperature is too high.
 */
function calculateNitrogenSupplyBySoilMineralizationForArable(
    a_c_of: fdmSchema.soilAnalysisTypeSelect["a_c_of"],
    a_cn_fr: fdmSchema.soilAnalysisTypeSelect["a_cn_fr"],
    a_density_sa: fdmSchema.soilAnalysisTypeSelect["a_density_sa"],
): Decimal {
    // Average yearly temperature
    const w_temp_mean = new Decimal(10.6)

    // Depth of bouwvoor (cm)
    const bouwvoor = 20

    // Calculate temperature correction
    let temperatureCorrection = new Decimal(0)
    if (w_temp_mean.gt(-1) && w_temp_mean.lte(9)) {
        temperatureCorrection = w_temp_mean.times(0.1)
    } else if (w_temp_mean.gt(9) && w_temp_mean.lte(27)) {
        const a = w_temp_mean.minus(-9).dividedBy(9)
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
    const b = temperatureCorrection.times(10).pow(-0.6)
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
        .times(a_density_sa)
        .times(bouwvoor)

    return mineralization
}
