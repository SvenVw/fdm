import type { NutrientDescription } from "./types"

export function getNutrientsDescription(): NutrientDescription[] {
    const nutrientDescription: NutrientDescription[] = [
        {
            name: "Stikstof, werkzaam",
            symbol: "N",
            type: "primary",
            unit: "kg N/ha",
            adviceParameter: "d_n_req",
            doseParameter: "p_dose_nw"
        },
        {
            name: "Fosfaat",
            symbol: "P",
            type: "primary",
            unit: "kg P2O5/ha",
            adviceParameter: "d_p_req",
            doseParameter: "p_dose_p",
        },
        {
            name: "Kalium",
            symbol: "K",
            type: "primary",
            unit: "kg K2O/ha",
            adviceParameter: "d_k_req",
            doseParameter: "p_dose_k",
        },
    ]
    return nutrientDescription
}
