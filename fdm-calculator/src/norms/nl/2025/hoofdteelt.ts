import type { NL2025NormsInputForCultivation } from "./types"

/**
 * Determines the main cultivation ('hoofdteelt') for the NL 2025 norms based on the legal definition.
 * The main cultivation is the one that is present for the longest duration within the period
 * from May 15th to July 15th.
 *
 * @param cultivations An array of cultivation inputs, each containing start and end dates.
 * @returns The `b_lu_catalogue` of the main cultivation, or `null` if no cultivation is present in the period.
 * In case of a tie in duration, the cultivation with the alphabetically first `b_lu_catalogue` is chosen.
 * @example
 * const cultivations = [
 *   { cultivation: { b_lu_start: '2025-05-01', b_lu_end: '2025-06-10', b_lu_catalogue: 'cat_A' } },
 *   { cultivation: { b_lu_start: '2025-06-01', b_lu_end: '2025-07-20', b_lu_catalogue: 'cat_B' } }
 * ];
 * const hoofdteelt = await determineNL2025Hoofdteelt(cultivations);
 * // returns 'cat_B'
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

    for (const  cultivation of cultivations) {
        const cultivationStart = new Date(cultivation.b_lu_start)
        const cultivationEnd = new Date(cultivation.b_lu_end)

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

    if (!hoofdteeltCatalogue) {
        throw new Error("Unable to determine hoofdteelt")
    }

    return hoofdteeltCatalogue
}
