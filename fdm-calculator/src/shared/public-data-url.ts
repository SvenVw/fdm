/**
 * @file This module provides a centralized way to access the base URL for FDM's public data storage.
 * This ensures that all parts of the application that need to fetch public data (like GeoTIFFs)
 * use a consistent and easily updatable URL.
 *
 * @packageDocumentation
 */

/**
 * Retrieves the base URL for the FDM public data storage bucket.
 *
 * @returns The base URL as a string.
 */
export function getFdmPublicDataUrl(): string {
    return "https://storage.googleapis.com/fdm-public-data/"
}
