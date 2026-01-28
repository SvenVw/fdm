import type { Route } from "./+types/farm.$b_id_farm.$calendar.atlas.soil.bodemdata.$soilcode"

export async function loader({ params }: Route.LoaderArgs) {
    // Fetching client-side leads to CORS and CSP errors.
    // CSP issues can be resolved but CORS issues can't be without contacting Bodemdata.
    return fetch(
        `https://legenda-bodemkaart.bodemdata.nl/soilmaplegendserver/item/bodemklasse/${params.soilcode}`,
    )
}
