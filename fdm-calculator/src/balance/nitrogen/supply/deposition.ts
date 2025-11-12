/**
 * @file This module calculates the atmospheric nitrogen deposition on agricultural fields.
 * It uses geospatial data in the GeoTIFF format to determine the amount of nitrogen
 * deposited at specific field locations.
 *
 * The primary function, `calculateAllFieldsNitrogenSupplyByDeposition`, is optimized for
 * performance by fetching the GeoTIFF data once and processing multiple fields concurrently.
 *
 * @packageDocumentation
 */
import { differenceInCalendarDays } from "date-fns"
import Decimal from "decimal.js"
import { getGeoTiffValue } from "../../../shared/geotiff"
import type { FieldInput, NitrogenBalanceInput, NitrogenSupply } from "../types"

/**
 * Calculates the nitrogen supply from atmospheric deposition for a batch of fields.
 *
 * This function efficiently computes nitrogen deposition by:
 * 1.  Identifying the correct GeoTIFF file based on the year and region.
 * 2.  Concurrently fetching the deposition value for each field's centroid from the GeoTIFF data.
 * 3.  Adjusting the annual deposition value based on the number of days the field was active
 *     within the specified time frame.
 *
 * This batch-processing approach is a key performance optimization, as it avoids redundant
 * downloads of the large GeoTIFF file.
 *
 * @param fields - An array of field data, each including its centroid coordinates.
 * @param timeFrame - The start and end dates for the calculation period.
 * @param fdmPublicDataUrl - The base URL where the public FDM GeoTIFF data is hosted.
 * @returns A promise that resolves to a `Map`, where each key is a field ID and the value
 *   is the calculated nitrogen deposition for that field.
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
        if (value !== null && Number.isFinite(value)) {
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
