import type { fdmSchema } from "@svenvw/fdm-core"
import type {
    NitrogenSupplyMineralization,
    CultivationDetail,
    FieldInput,
} from "../types"
import Decimal from "decimal.js"

export function calculateNitrogenSupplyBySoilMineralization(
    cultivations: FieldInput["cultivations"],
    soilAnalyses: FieldInput["soilAnalyses"],
    cultivationDetailsMap: Map<string, CultivationDetail>,
): NitrogenSupplyMineralization {
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

        const b_lu_croprotation = cultivationDetail.b_lu_croprotation
        const isGrassland = b_lu_croprotation === "grassland"
        const b_soiltype_agr = soilAnalyses.filter(
            (x: {
                b_soiltype_agr: fdmSchema.soilAnalysisTypeSelect["b_soiltype_agr"]
            }) => x.b_soiltype_agr,
        )[0].b_soiltype_agr
        const a_n_rt = soilAnalyses.filter(
            (x: { a_n_rt: fdmSchema.soilAnalysisTypeSelect["a_n_rt"] }) =>
                x.a_n_rt,
        )[0].a_n_rt

        let mineralization = Decimal(0)
        if (isGrassland) {
            mineralization =
                calculateNitrogenSupplyBySoilMineralizationForGrassland(
                    b_soiltype_agr,
                    a_n_rt,
                )
        } else {
            mineralization =
                calculateNitrogenSupplyBySoilMineralizationForArable(
                    a_c_of,
                    a_cn_fr,
                    a_density_sa,
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
        return acc.add(mineralization.value)
    }, Decimal(0))

    return {
        total: totalValue,
        cultivations: mineralizations,
    }
}

function calculateNitrogenSupplyBySoilMineralizationForGrassland(
    b_soiltype_agr: fdmSchema.soilAnalysisTypeSelect["b_soiltype_agr"],
    a_n_rt: fdmSchema.soilAnalysisTypeSelect["a_n_rt"],
): Decimal {
    // Return amount of Nitrogen mineralizd by soil at Grasslan for veen
    if (b_soiltype_agr === "veen") {
        return Decimal(250)
    }

    if (!a_n_rt) {
        throw new Error("No a_n_rt value found in soil analysis for grassland")
    }

    // Return amount of Nitrogen mineralizd by soil at Grasslan for zand
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

    if (!a_c_of) {
        throw new Error("No a_c_of value found in soil analysis for arable")
    }
    if (!a_cn_fr) {
        throw new Error("No a_cn_fr value found in soil analysis for arable")
    }
    if (!a_density_sa) {
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
