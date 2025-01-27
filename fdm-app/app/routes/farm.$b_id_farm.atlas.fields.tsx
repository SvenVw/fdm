import { AtlasFields } from "@/components/custom/atlas-fields"
import { FarmContent } from "@/components/custom/farm/farm-content"
import { FarmHeader } from "@/components/custom/farm/farm-header"
import { FarmTitle } from "@/components/custom/farm/farm-title"
import { SidebarInset } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { Toaster } from "@/components/ui/sonner"
import { auth } from "@/lib/auth.server"
import { fdm } from "@/lib/fdm.server"
import { getFarm, getFarms } from "@svenvw/fdm-core"
import {
    type LoaderFunctionArgs,
    Outlet,
    data,
    redirect,
    useLoaderData,
} from "react-router"
import { ClientOnly } from "remix-utils/client-only"

export async function loader({ request, params }: LoaderFunctionArgs) {
    // Get the farm id
    const b_id_farm = params.b_id_farm
    if (!b_id_farm) {
        throw data("Farm ID is required", {
            status: 400,
            statusText: "Farm ID is required",
        })
    }

    // Get details of farm
    let farm
    try {
        farm = await getFarm(fdm, b_id_farm)
        if (!farm) {
            throw data("Farm is not found", {
                status: 404,
                statusText: "Farm is not found",
            })
        }
    } catch (error) {
        console.error("Failed to fetch farm details:", error)
        throw data("Failed to fetch farm details", {
            status: 500,
            statusText: "Internal Server Error",
        })
    }

    // Set farm to active
    try {
        await auth.api.updateUser({
            body: {
                farm_active: b_id_farm,
            },
            headers: request.headers,
        })
    } catch (error) {
        console.error("Failed to update active farm:", error)
        throw data("Failed to update active farm", {
            status: 500,
            statusText: "Internal Server Error",
        })
    }

    // Get a list of possible farms of the user
    let farms: Awaited<ReturnType<typeof getFarms>>
    try {
        farms = await getFarms(fdm)
    } catch (error) {
        console.error("Failed to fetch farms list:", error)
        throw data("Failed to fetch farms list", {
            status: 500,
            statusText: "Internal Server Error",
        })
    }

    // Get the Mapbox token
    const mapboxToken = String(process.env.MAPBOX_TOKEN)

    // Return user information from loader
    return {
        mapboxToken: mapboxToken,
    }
}

export default function FarmContentBlock() {
    const loaderData = useLoaderData<typeof loader>()

    return (
        <AtlasFields
            height="calc(100vh - 64px - 123px)"
            width="100%"
            interactive={false}
            mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
            mapboxToken={loaderData.mapboxToken}
            fieldsSelected={null}
            fieldsAvailableUrl={undefined}
        />
    )
}
