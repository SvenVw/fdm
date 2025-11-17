import {
    getCultivationsFromCatalogue,
    type HarvestParameters,
} from "@svenvw/fdm-core"

export function getHarvestParameterLabel(param: HarvestParameters[number]) {
    switch (param) {
        case "b_lu_yield":
            return "Opbrengst (kg DS / ha)"
        case "b_lu_yield_fresh":
            return " Opbrengst (kg versproduct / ha)"
        case "b_lu_yield_bruto":
            return "Opbrengst incl. tarra (kg versproduct / ha)"
        case "b_lu_tarra":
            return "Tarra (%)"
        case "b_lu_dm":
            return " Droge stofgehalte (g DS / kg versproduct))"
        case "b_lu_moist":
            return "Vochtgehalte (%)"
        case "b_lu_uww":
            return "Onderwatergewicht (g / 5 kg)"
        case "b_lu_cp":
            return "Ruw eiwit (g RE / kg DS)"
        case "b_lu_n_harvestable":
            return "Stiktstofgehalte (g N / kg DS)"
        default:
            return param
    }
}

export function getHarvestParameterDefaults(
    cultivationsCatalogue: any,
    b_lu_catalogue: string,
) {
    const cultivationsCatalogueItem = cultivationsCatalogue.find(
        (item: { b_lu_catalogue: string }) =>
            item.b_lu_catalogue === b_lu_catalogue,
    )
    return {
        b_lu_yield: cultivationsCatalogueItem.b_lu_yield,
        b_lu_n_harvestable: cultivationsCatalogueItem.b_lu_n_harvestable,
        b_lu_yield_fresh: Math.round(
            cultivationsCatalogueItem.b_lu_yield /
                (cultivationsCatalogueItem.b_lu_dm / 1000),
        ),
        b_lu_dm: cultivationsCatalogueItem.b_lu_dm,
        b_lu_cp: 170,
        b_lu_moist: 15,
        b_lu_tarra: 5,
        b_lu_uww: 350,
        b_lu_yield_bruto: Math.round(
            (cultivationsCatalogueItem.b_lu_yield /
                (cultivationsCatalogueItem.b_lu_dm / 1000)) *
                1.05,
        ),
    }
}
