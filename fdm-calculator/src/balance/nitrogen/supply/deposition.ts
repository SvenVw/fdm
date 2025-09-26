import { differenceInCalendarDays } from "date-fns/differenceInCalendarDays"
import Decimal from "decimal.js"
import type { FieldInput, NitrogenBalanceInput, NitrogenSupply } from "../types"
import { getGeoTiffValue } from "../../../shared/geotiff"

/**
 * Calculates the nitrogen deposition for a batch of fields from a GeoTIFF file.
 * This function is the core of the performance optimization. It fetches the GeoTIFF
 * object once (using a cache) and then concurrently calculates the deposition for each field.
 * This avoids re-downloading the main file for every field.
 *
 * @param fields - An array of FieldInput objects for which to calculate deposition.
 * @param timeFrame - The time frame for the calculation.
 * @param fdmPublicDataUrl - The base URL for FDM public data.
 * @returns A promise that resolves to a Map where keys are field IDs and values are
 *          the calculated nitrogen deposition supply for that field.
 */
export async function calculateAllFieldsNitrogenSupplyByDeposition(
    fields: FieldInput[],
    timeFrame: NitrogenBalanceInput["timeFrame"],
    fdmPublicDataUrl: string,
): Promise<Map<string, NitrogenSupply["deposition"]>> {
    if (fields.length === 0) {
        return new Map()
    }

    // Settings for the GeoTIFF file.
    // Currently, only the year 2022 is available.
    // TODO: Add support for multiple years when data becomes available.
    const year = "2022"
    const region = "nl"
    const url = `${fdmPublicDataUrl}deposition/${region}/ntot_${year}.tiff`

    // Step 1: Create an array of promises to calculate deposition for each field concurrently.
    const depositionPromises = fields.map(async (field) => {
        // Compute per-field effective timeframe (intersection with field existence)
        const fStart = field.field.b_start ?? timeFrame.start
        const fEnd = field.field.b_end ?? timeFrame.end
        const effectiveStart = new Date(
            Math.max(fStart.getTime(), timeFrame.start.getTime()),
        )
        const effectiveEnd = new Date(
            Math.min(fEnd.getTime(), timeFrame.end.getTime()),
        )
        const days = differenceInCalendarDays(effectiveEnd, effectiveStart)
        const fraction =
            days >= 0 ? new Decimal(days).add(1).dividedBy(365) : new Decimal(0)

        // Get the deposition value from the GeoTIFF using the new getTiffValue function.
        const [longitude, latitude] = field.field.b_centroid
        const value = await getGeoTiffValue(url, longitude, latitude)

        let depositionValue = new Decimal(0)
        if (value !== null) {
            depositionValue = new Decimal(value).times(fraction)
        }

        return {
            fieldId: field.field.b_id,
            deposition: { total: depositionValue },
        }
    })

    // Step 3: Execute all promises concurrently.
    const depositionResults = await Promise.all(depositionPromises)

    // Step 4: Convert the array of results into a Map for easy lookup.
    const depositionMap = new Map<string, NitrogenSupply["deposition"]>()
    for (const result of depositionResults) {
        depositionMap.set(result.fieldId, result.deposition)
    }

    return depositionMap
}
