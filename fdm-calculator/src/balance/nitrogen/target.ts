import Decimal from "decimal.js"
import type {
    CultivationDetail,
    FieldInput,
    NitrogenBalanceInput,
    SoilAnalysisPicked,
} from "./types"

export function calculateTargetForNitrogenBalance(
    cultivations: FieldInput["cultivations"],
    soilAnalysis: SoilAnalysisPicked,
    cultivationDetailsMap: Map<string, CultivationDetail>,
    timeFrame: NitrogenBalanceInput["timeFrame"],
): Decimal {
    // Determine whether field is grassland or arable
    let cultivationType = "arable"
    cultivations.map((cultivation) => {
        const cultivationDetail = cultivationDetailsMap.get(
            cultivation.b_lu_catalogue,
        )

        if (cultivationDetail?.b_lu_croprotation === "grass") {
            cultivationType = "grassland"
        }
    })

    // Determine whether field is zand/loess or klei/veen
    let soilType = undefined
    if (
        ["moerige_klei", "rivierklei", "zeeklei", "maasklei", "veen"].includes(
            soilAnalysis.b_soiltype_agr,
        )
    ) {
        soilType = "clay"
    } else if (
        ["dekzand", "dalgrond", "duinzand", "loess"].includes(
            soilAnalysis.b_soiltype_agr,
        )
    ) {
        soilType = "sand"
    } else {
        throw new Error("Unknown soil type")
    }

    // Determine groundwaterclass
    let groundwaterClass = undefined
    if (["bVII", "sVII", "VIII", "VII"].includes(soilAnalysis.b_gwl_class)) {
        groundwaterClass = "dry"
    } else if (
        ["V", "VI", "Vb", "sVI", "IVu", "sV", "sVb", "bVI"].includes(
            soilAnalysis.b_gwl_class,
        )
    ) {
        groundwaterClass = "average"
    } else if (
        ["II", "IV", "IIIb", "-", "Va", "III", "I", "IIb", "IIIa"].includes(
            soilAnalysis.b_gwl_class,
        )
    ) {
        groundwaterClass = "wet"
    } else {
        throw new Error("Unknown groundwater class")
    }

    // Determine target based on Ros et al. 2023
    let target = undefined
    if (
        cultivationType === "grassland" &&
        soilType === "sand" &&
        groundwaterClass === "dry"
    ) {
        target = new Decimal(80)
    } else if (cultivationType === "grassland") {
        target = new Decimal(125)
    } else if (
        cultivationType === "arable" &&
        soilType === "sand" &&
        groundwaterClass === "dry"
    ) {
        target = new Decimal(50)
    } else if (
        cultivationType === "arable" &&
        soilType === "sand" &&
        groundwaterClass === "average"
    ) {
        target = new Decimal(70)
    } else if (
        cultivationType === "arable" &&
        soilType === "sand" &&
        groundwaterClass === "wet"
    ) {
        target = new Decimal(125)
    } else if (
        cultivationType === "arable" &&
        soilType === "clay" &&
        groundwaterClass === "dry"
    ) {
        target = new Decimal(115)
        target = new Decimal(125)
    } else if (cultivationType === "arable" && soilType === "clay") {
        target = new Decimal(125)
    } else {
        throw new Error("Unknown combination of classes")
    }

    return target
}
