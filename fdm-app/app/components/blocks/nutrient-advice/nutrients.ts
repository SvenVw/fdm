import type { NutrientDescription } from "./types"

export function getNutrientsDescription(): NutrientDescription[] {
    const nutrientDescription: NutrientDescription[] = [
        {
            name: "Stikstof, werkzaam",
            symbol: "N",
            type: "primary",
            adviceParameter: "d_n_req",
            adviceUnit: "kg N/ha",
        },
        {
            name: "Fosfaat",
            symbol: "P",
            type: "primary",
            adviceParameter: "d_p_req",
            adviceUnit: "kg P2O5/ha",
        },
        {
            name: "Kalium",
            symbol: "K",
            type: "primary",
            adviceParameter: "d_k_req",
            adviceUnit: "kg K2O/ha",
        },
    ]
    return nutrientDescription
}
