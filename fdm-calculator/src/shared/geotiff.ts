/**
 * @file This module provides shared utility functions for fetching and processing GeoTIFF data.
 * It includes an efficient caching mechanism to minimize redundant downloads and parsing
 * of large GeoTIFF files.
 *
 * The primary functions are `getTiff` for retrieving a GeoTIFF object and `getGeoTiffValue`
 * for extracting a specific value from it based on geographic coordinates.
 *
 * @packageDocumentation
 */
import { fromUrl, type GeoTIFF } from "geotiff"

/**
 * An in-memory cache for GeoTIFF objects to avoid re-fetching large files.
 * @internal
 */
const tiffCache = new Map<string, GeoTIFF>()

/**
 * An in-memory cache for promises of in-flight GeoTIFF fetches to prevent duplicate requests.
 * @internal
 */
const tiffPromiseCache = new Map<string, Promise<GeoTIFF>>()

/**
 * Fetches a GeoTIFF object from a URL with in-memory caching.
 *
 * This function handles the retrieval and parsing of a GeoTIFF file. It implements a cache
 * to store the parsed GeoTIFF object, preventing repeated downloads for the same URL. It also
 * de-duplicates concurrent requests for the same URL, ensuring the file is fetched only once.
 *
 * @param url - The URL of the GeoTIFF file.
 * @returns A promise that resolves to the parsed `GeoTIFF` object.
 * @throws {Error} If the GeoTIFF file cannot be fetched or parsed.
 */
export async function getTiff(url: string): Promise<GeoTIFF> {
    // Return cached object if it exists
    const cached = tiffCache.get(url)
    if (cached) return cached

    // Deduplicate in-flight fetches
    const inFlight = tiffPromiseCache.get(url)
    if (inFlight) return inFlight

    const promise = (async () => {
        try {
            // fromUrl fetches headers first (HTTP Range) and lazily reads data
            const tiff = await fromUrl(url)
            tiffCache.set(url, tiff)
            tiffPromiseCache.delete(url)
            return tiff
        } catch (error) {
            tiffPromiseCache.delete(url)
            throw new Error(
                `Failed to fetch or parse GeoTIFF from ${url}: ${String(error)}`,
            )
        }
    })()
    tiffPromiseCache.set(url, promise)
    return promise
}

/**
 * Extracts a pixel value from a GeoTIFF file at a specific geographic coordinate.
 *
 * This function performs the following steps:
 * 1.  Retrieves the cached or newly fetched GeoTIFF object.
 * 2.  Gets the image and its bounding box metadata.
 * 3.  Converts the input longitude and latitude into pixel coordinates (x, y).
 * 4.  Checks if the coordinates are within the image bounds.
 * 5.  Reads the raster data for the single pixel at that location.
 * 6.  Returns the value, ensuring it is not a "NoData" value.
 *
 * @param url - The URL of the GeoTIFF file.
 * @param longitude - The longitude for the point of interest.
 * @param latitude - The latitude for the point of interest.
 * @returns A promise that resolves to the numeric value at the specified coordinate,
 *   or `null` if the coordinate is out of bounds or corresponds to a "NoData" pixel.
 */
export async function getGeoTiffValue(
    url: string,
    longitude: number,
    latitude: number,
): Promise<number | null> {
    const tiff = await getTiff(url)
    const image = await tiff.getImage()
    const bbox = image.getBoundingBox()
    const pixelWidth = image.getWidth()
    const pixelHeight = image.getHeight()
    const bboxWidth = bbox[2] - bbox[0]
    const bboxHeight = bbox[3] - bbox[1]
    const _noData = image.getGDALNoData()
    const noDataValue =
        typeof _noData === "string" ? Number.parseFloat(_noData) : _noData

    // Convert geographic coordinates to pixel coordinates.
    const widthPct = (longitude - bbox[0]) / bboxWidth
    const heightPct = (latitude - bbox[1]) / bboxHeight
    const xPx = Math.floor(pixelWidth * widthPct)
    const yPx = Math.floor(pixelHeight * (1 - heightPct))

    // Explicit OOB check: centroids outside the TIFF should return null
    if (xPx < 0 || xPx >= pixelWidth || yPx < 0 || yPx >= pixelHeight) {
        return null
    }

    const window = [xPx, yPx, xPx + 1, yPx + 1]

    // Read the raster data for this specific field's window.
    const rasterData = await image.readRasters({ window })

    // For a single window and band, the result is typically [Float32Array(1)].
    const value = (rasterData[0] as Float32Array)[0]

    // Check if the value is valid and not the 'NoData' value.
    if (
        value !== undefined &&
        (noDataValue === null ||
            Number.isNaN(noDataValue as number) ||
            value !== noDataValue)
    ) {
        return value
    }

    return null
}
