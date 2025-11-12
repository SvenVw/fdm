/**
 * @file This module defines a standardized color palette for different crop rotation types.
 *
 * It provides a mapping of crop rotation names to specific hex color codes, which helps
 * in creating consistent and visually distinguishable representations of cultivations
 * across the application (e.g., in charts, maps, or legends).
 *
 * @packageDocumentation
 */

/**
 * A record mapping crop rotation types to their corresponding hex color codes.
 */
export const CROP_ROTATION_COLORS: Record<string, string> = {
    grass: "#558B2F",
    maize: "#FBC02D",
    cereal: "#C2B280",
    potato: "#8D6E63",
    sugarbeet: "#9B2D30",
    rapeseed: "#D4AC0D",
    clover: "#8BC34A",
    alfalfa: "#7E57C2",
    catchcrop: "#4DD0E1",
    nature: "#00796B",
    starch: "#F57C00",
    other: "#9E9E9E",
}

/**
 * Retrieves a list of all cultivation types that have a defined color.
 *
 * @returns An array of strings, where each string is a cultivation type.
 */
export function getCultivationTypesHavingColors() {
    return Object.keys(CROP_ROTATION_COLORS)
}

/**
 * Gets the hex color code for a given cultivation type.
 *
 * If the specified type is not found in the `CROP_ROTATION_COLORS` map,
 * it returns the color for the "other" category as a fallback.
 *
 * @param cultivationType - The name of the cultivation type (case-insensitive).
 * @returns The corresponding hex color code as a string.
 */
export function getCultivationColor(cultivationType: string | undefined) {
    if (cultivationType) {
        return (
            CROP_ROTATION_COLORS[cultivationType?.toLowerCase()] ??
            CROP_ROTATION_COLORS.other
        )
    }
    return CROP_ROTATION_COLORS.other
}
