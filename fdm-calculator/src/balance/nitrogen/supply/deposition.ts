import { differenceInCalendarDays } from "date-fns/differenceInCalendarDays"
import Decimal from "decimal.js"
import { fromUrl, type GeoTIFF } from "geotiff"
import type { FieldInput, NitrogenBalanceInput, NitrogenSupply } from "../types"

/**
 * In-memory cache for the GeoTIFF object.
 * This is a simple singleton pattern to ensure that for a given server instance,
 * the potentially large TIFF file is only downloaded and parsed once.
 * Subsequent calls will reuse the cached object, saving network and CPU resources.
 */
let tiffCache: GeoTIFF | null = null

/**
 * Fetches and caches the GeoTIFF object for nitrogen deposition data.
 * It checks if the TIFF object is already in the cache. If not, it fetches it
 * from the provided URL and stores it in the cache for future use.
 *
 * @param fdmPublicDataUrl - The base URL for accessing FDM public data.
 * @returns A promise that resolves with the GeoTIFF object.
 * @throws Throws an error if the GeoTIFF file cannot be fetched or parsed.
 */
async function getTiff(fdmPublicDataUrl: string): Promise<GeoTIFF> {
    // Return the cached object if it exists
    if (tiffCache) {
        return tiffCache
    }

    // Settings for the GeoTIFF file.
    // Currently, only the year 2022 is available.
    // TODO: Add support for multiple years when data becomes available.
    const year = "2022"
    const region = "nl"
    const url = `${fdmPublicDataUrl}deposition/${region}/ntot_${year}.tiff`

    try {
        // The `fromUrl` function from geotiff.js is efficient. It initially only
        // fetches the headers of the TIFF file using HTTP Range Requests.
        // The full image data is not downloaded at this stage.
        const tiff = await fromUrl(url)
        // Store the successfully fetched object in the cache.
        tiffCache = tiff
        return tiff
    } catch (error) {
        // Clear cache on failure to allow for retries
        tiffCache = null
        throw new Error(
            `Failed to fetch or parse GeoTIFF from ${url}: ${String(error)}`,
        )
    }
}

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

    // Step 1: Get the (potentially cached) GeoTIFF object and its image metadata.
    const tiff = await getTiff(fdmPublicDataUrl)
    const image = await tiff.getImage()
    const bbox = image.getBoundingBox()
    const pixelWidth = image.getWidth()
    const pixelHeight = image.getHeight()
    const bboxWidth = bbox[2] - bbox[0]
    const bboxHeight = bbox[3] - bbox[1]
    const noDataValue = image.getGDALNoData()

    // Calculate the time frame fraction once to reuse in each promise.
    const timeFrameDays = new Decimal(
        differenceInCalendarDays(timeFrame.end, timeFrame.start),
    )
    const timeFrameFraction = timeFrameDays.isPositive()
        ? timeFrameDays.add(1).dividedBy(365)
        : new Decimal(0)

    // Step 2: Create an array of promises to calculate deposition for each field concurrently.
    const depositionPromises = fields.map(async (field) => {
        // Convert geographic coordinates to pixel coordinates.
        const [longitude, latitude] = field.field.b_centroid
        const widthPct = (longitude - bbox[0]) / bboxWidth
        const heightPct = (latitude - bbox[1]) / bboxHeight
        const xPx = Math.floor(pixelWidth * widthPct)
        const yPx = Math.floor(pixelHeight * (1 - heightPct))
        const window = [xPx, yPx, xPx + 1, yPx + 1]

        // Read the raster data for this specific field's window.
        // This is efficient because the main TIFF object is already in memory,
        // and geotiff.js uses HTTP Range Requests to fetch only the required bytes.
        const rasterData = await image.readRasters({ window })

        // For a single window and band, the result is typically [Float32Array(1)].
        const value = (rasterData[0] as Float32Array)[0]

        let depositionValue = new Decimal(0)
        // Check if the value is valid and not the 'NoData' value.
        if (
            value !== undefined &&
            (noDataValue === null || value !== noDataValue)
        ) {
            depositionValue = new Decimal(value).times(timeFrameFraction)
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
