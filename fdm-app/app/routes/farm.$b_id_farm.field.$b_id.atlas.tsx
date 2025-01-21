import { AtlasFields } from "@/components/custom/atlas-fields"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { fdm } from "@/lib/fdm.server"
import { getField } from "@svenvw/fdm-core"
import {
    type ActionFunctionArgs,
    type LoaderFunctionArgs,
    data,
    useLoaderData,
} from "react-router"
import { dataWithError } from "remix-toast"
import { ClientOnly } from "remix-utils/client-only"
import wkx from "wkx"

export async function loader({ request, params }: LoaderFunctionArgs) {
    // Get the field id
    const b_id = params.b_id
    if (!b_id) {
        throw data("Field ID is required", {
            status: 400,
            statusText: "Field ID is required",
        })
    }

    // Get details of field
    const field = await getField(fdm, b_id)
    if (!field) {
        throw data("Field is not found", {
            status: 404,
            statusText: "Field is not found",
        })
    }
    field.b_geojson = wkx.Geometry.parse(field.b_geometry).toGeoJSON()

    // Get mapbox token
    const mapboxToken = process.env.MAPBOX_TOKEN
    if (!mapboxToken) {
        throw data("Mapbox token is not set", {
            status: 500,
            statusText: "Mapbox token is not set",
        })
    }

    // Return user information from loader
    return {
        field: field,
        mapboxToken: mapboxToken,
    }
}

export default function FarmFieldAtlasBlock() {
    const loaderData = useLoaderData<typeof loader>()

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Kaart</h3>
                <p className="text-sm text-muted-foreground">
                    Bekijk het perceel op de kaart
                </p>
            </div>
            <Separator />
            <div>
                <ClientOnly
                    fallback={<Skeleton className="h-full w-full rounded-xl" />}
                >
                    {() => (
                        <AtlasFields
                            height="calc(100vh - 64px - 123px)"
                            width="100%"
                            interactive={false}
                            mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
                            mapboxToken={loaderData.mapboxToken}
                            fieldsSelected={loaderData.field.b_geojson}
                            fieldsAvailableUrl={undefined}
                        />
                    )}
                </ClientOnly>
            </div>
        </div>
    )
}

export async function action({ request, params }: ActionFunctionArgs) {
    const b_id = params.b_id

    if (!b_id) {
        return dataWithError(null, "Missing field ID.")
    }
}
