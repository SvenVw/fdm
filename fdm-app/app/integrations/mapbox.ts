/**
 * @file This module provides utility functions for integrating with Mapbox.
 *
 * It centralizes the retrieval of the Mapbox access token and the map style URL,
 * ensuring that these values are consistently accessed throughout the application.
 *
 * @packageDocumentation
 */
import { clientConfig } from "@/app/lib/config"

/**
 * Retrieves the Mapbox access token from the client configuration.
 *
 * @returns The Mapbox access token as a string.
 * @throws {Error} If the `MAPBOX_TOKEN` is not set in the configuration.
 */
export function getMapboxToken(): string {
    const mapboxToken = clientConfig.integrations.mapbox.token
    if (!mapboxToken || mapboxToken.length === 0) {
        throw new Error("MAPBOX_TOKEN is not set")
    }
    return mapboxToken
}

/**
 * Retrieves the Mapbox style URL to be used for maps in the application.
 *
 * @returns The Mapbox style URL as a string.
 */
export function getMapboxStyle(): string {
    return "mapbox://styles/mapbox/satellite-streets-v12"
}
