export function getMapboxToken() {

    const mapboxToken = String(process.env.MAPBOX_TOKEN)
    if (!mapboxToken || mapboxToken.length === 0) {
        throw new Error("MAPBOX_TOKEN is not set")
    }

    return mapboxToken
}

export function getMapboxStyle() {
    return "mapbox://styles/mapbox/satellite-streets-v12"
}