/**
 * @file This module provides a function to determine the primary cultivation (`hoofdteelt`)
 * for a field according to the specific definition used in the Dutch 2025 fertilizer regulations.
 *
 * @packageDocumentation
 */
import type { NL2025NormsInputForCultivation } from "./types"

/**
 * Determines the primary cultivation (`hoofdteelt`) for the 2025 norm calculations.
 *
 * According to the regulations, the primary cultivation is defined as the crop that is
 * present on the field for the longest duration within the specific time window of
 * May 15th to July 15th, 2025.
 *
 * This function calculates the duration of each cultivation within this window and identifies
 * the one with the maximum duration. If there's a tie, the cultivation with the
 * alphabetically first catalogue code is chosen. If no cultivation is present, a default
 * code for fallow land is returned.
 *
 * @param cultivations - An array of all cultivations for the field.
 * @returns The catalogue code (`b_lu_catalogue`) of the determined primary cultivation.
 */
export function determineNL2025Hoofdteelt(
    cultivations: NL2025NormsInputForCultivation[],
): string {
    const HOOFDTEELT_START = new Date("2025-05-15")
    const HOOFDTEELT_END = new Date("2025-07-15")

    let maxDuration = -1
    let hoofdteeltCatalogue: string | null = null

    // In case of no cultivation return "Groene braak, spontane opkomst"
    if (cultivations.length === 0) {
        return "nl_6794"
    }

    for (const cultivation of cultivations) {
        const cultivationStart = new Date(cultivation.b_lu_start)
        const cultivationEnd = cultivation.b_lu_end
            ? new Date(cultivation.b_lu_end)
            : HOOFDTEELT_END

        const effectiveStart =
            cultivationStart > HOOFDTEELT_START
                ? cultivationStart
                : HOOFDTEELT_START
        const effectiveEnd =
            cultivationEnd < HOOFDTEELT_END ? cultivationEnd : HOOFDTEELT_END

        if (effectiveEnd > effectiveStart) {
            const currentDuration =
                (effectiveEnd.getTime() - effectiveStart.getTime()) /
                (1000 * 3600 * 24)

            if (currentDuration > maxDuration) {
                maxDuration = currentDuration
                hoofdteeltCatalogue = cultivation.b_lu_catalogue
            } else if (currentDuration === maxDuration) {
                if (
                    hoofdteeltCatalogue === null ||
                    cultivation.b_lu_catalogue.localeCompare(
                        hoofdteeltCatalogue,
                    ) < 0
                ) {
                    hoofdteeltCatalogue = cultivation.b_lu_catalogue
                }
            }
        }
    }

    // If no cultivation is present between May 15th and July 15th, return "Groene braak, spontane opkomst"
    if (!hoofdteeltCatalogue) {
        return "nl_6794"
    }

    return hoofdteeltCatalogue
}
