export type NutrientDescription = {
    name:  string,
    symbol: string
    type: "primary" | "secondary" | "trace",
    adviceParameter: string
    adviceUnit: string
}