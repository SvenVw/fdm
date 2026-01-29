import { data } from "react-router-dom"
import type { Route } from "./+types/farm.$b_id_farm.$calendar.atlas.soil.bodemdata.$soilcode"

export async function loader({ params }: Route.LoaderArgs) {
    // Fetching client-side leads to CORS and CSP errors.
    // CSP issues can be resolved but CORS issues can't be without contacting Bodemdata.
    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const response = await fetch(
            `https://legenda-bodemkaart.bodemdata.nl/soilmaplegendserver/item/bodemklasse/${params.soilcode}`,
            { signal: controller.signal },
        )
        clearTimeout(timeoutId)

        if (!response.ok) {
            return response
        }

        const json = await response.json()
        return data({ success: json.success, data: json.data })
    } catch (error) {
        console.error(error)
        return data(
            { success: false, error: "Failed to fetch soil data" },
            { status: 502 },
        )
    }
}
