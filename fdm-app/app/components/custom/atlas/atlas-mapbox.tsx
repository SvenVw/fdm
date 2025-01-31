export function getMapboxToken() {
    const mapboxToken = process.env.MAPBOX_TOKEN as string | undefined
    if (!mapboxToken || mapboxToken.length === 0) {
        throw new Error("MAPBOX_TOKEN is not set")
    }

    return mapboxToken
}

export function getMapboxStyle() {
    return "mapbox://styles/mapbox/satellite-streets-v12"
}
