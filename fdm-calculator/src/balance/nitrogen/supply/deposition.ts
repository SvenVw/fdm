import Decimal from "decimal.js"
import type { FieldInput, NitrogenBalanceInput, NitrogenSupply } from "../types"
import { fromUrl } from "geotiff"
import { differenceInCalendarDays } from "date-fns/differenceInCalendarDays"

/**
 * Calculates the amount of nitrogen supplied through atmospheric deposition for a given field and time frame.
 *
 * This function uses the geotiff.js library to identify the nitrogen deposition value at the field's centroid
 * from a raster dataset (TIFF file) provided by RIVM (Netherlands National Institute for Public Health and the Environment).
 * It adjusts the total deposition based on the number of days in the specified time frame.
 *
 * @param field - The field for which to calculate nitrogen deposition.
 *                  The field object must include the `b_centroid` property, which represents the field's centroid coordinates as [longitude, latitude].
 * @param timeFrame - The time frame for which to calculate nitrogen deposition.
 *                      The timeFrame object must include `start` and `end` properties, which are Date objects representing the start and end dates of the period.
 * @param fdmPublicDataUrl - The base URL for accessing FDM public data, including the deposition raster dataset.
 * @returns A promise that resolves with an object containing the total nitrogen deposition for the field in kg N / ha.
 *          If the location is outside the RIVM dataset, or if an error occurs, it returns 0.
 */
export async function calculateNitrogenSupplyByDeposition(
    field: FieldInput["field"],
    timeFrame: NitrogenBalanceInput["timeFrame"],
    fdmPublicDataUrl: string,
): Promise<NitrogenSupply["deposition"]> {
    // Settings
    const year = "2022"
    const region = "nl"
    const url = `${fdmPublicDataUrl}deposition/${region}/ntot_${year}.tiff`

    // Get centroid coordinates
    const b_centroid = field.b_centroid
    const [longitude, latitude] = b_centroid

    // Source: https://medium.com/data-science/geotiff-coordinate-querying-with-javascript-5e6caaaf88cf
    try {
        const tiff = await fromUrl(url)
        const image = await tiff.getImage()

        const bbox = image.getBoundingBox()
        const pixelWidth = image.getWidth()
        const pixelHeight = image.getHeight()
        const bboxWidth = bbox[2] - bbox[0]
        const bboxHeight = bbox[3] - bbox[1]

        const widthPct = (longitude - bbox[0]) / bboxWidth
        const heightPct = (latitude - bbox[1]) / bboxHeight
        const xPx = Math.floor(pixelWidth * widthPct)
        const yPx = Math.floor(pixelHeight * (1 - heightPct))

        const window = [xPx, yPx, xPx + 1, yPx + 1]
        const rasterData = await image.readRasters({ window })

        // rasterData should be an array of TypedArrays, one for each band requested.
        // For one point, one band: e.g., [ Float32Array(1) [value] ]
        const firstBandData = rasterData[0]

        // Check if the first band data exists and has at least one element
        if (
            !firstBandData ||
            typeof firstBandData === "number" ||
            firstBandData.length === 0
        ) {
            console.warn(
                "Invalid raster data received for deposition calculation (expected TypedArray with length > 0).",
            )
            return { total: new Decimal(0) }
        }

        // Access the first value from the TypedArray
        const depositionValue = firstBandData[0]

        // Check for NoData value
        const noDataValue = image.getGDALNoData()
        if (noDataValue !== null && depositionValue === noDataValue) {
            console.warn("Pixel value is NoData.")
            return { total: new Decimal(0) }
        }

        if (depositionValue === undefined) {
            console.warn(
                "Pixel value is undefined (possibly out of bounds or issue with readRasters).",
            )
            return { total: new Decimal(0) }
        }

        // Adjust for the number of days
        const timeFrameDays = new Decimal(
            differenceInCalendarDays(timeFrame.end, timeFrame.start),
        )
        // Ensure timeFrameDays is positive
        if (timeFrameDays.lessThanOrEqualTo(0)) {
            return { total: new Decimal(0) }
        }
        const timeFrameFraction = timeFrameDays.add(1).dividedBy(365)
        const deposition = new Decimal(depositionValue).times(timeFrameFraction)

        return { total: deposition }
    } catch (error) {
        throw new Error(
            `Error processing GeoTIFF for deposition calculation: ${String(error)}`,
        )
    }
}
