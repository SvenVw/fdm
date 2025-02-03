import { FarmHeader } from "@/components/custom/farm/farm-header"
import { FarmTitle } from "@/components/custom/farm/farm-title"
import { SidebarInset } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { auth } from "@/lib/auth.server"
import { fdm } from "@/lib/fdm.server"
import { getFarm, getFarms } from "@svenvw/fdm-core"
import {
    type LoaderFunctionArgs,
    Outlet,
    data,
    redirect,
    useLoaderData,
    useLocation,
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
    let farm = null
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

    // Redirect to farms overview if user has no farm
    if (farms.length === 0) {
        return redirect("./farm")
    }

    const farmOptions = farms.map((farm) => {
        return {
            b_id_farm: farm.b_id_farm,
            b_name_farm: farm.b_name_farm,
        }
    })

    const layerOptions = [
        { layerKey: "fields", layerName: "Percelen" },
        { layerKey: "soil", layerName: "Bodem" },
        { layerKey: "elevation", layerName: "Hoogtekaart" },
    ]

    // Return user information from loader
    return {
        farm: farm,
        b_id_farm: b_id_farm,
        farmOptions: farmOptions,
        layerOptions: layerOptions,
        layerSelected: "fields",
    }
}

export default function FarmContentBlock() {
    const loaderData = useLoaderData<typeof loader>()
    const location = useLocation()

    // Get the current layer
    const pathname = location.pathname
    const pathSegments = pathname.split("/")
    const layerSelected = pathSegments[pathSegments.length - 1]

    return (
        <SidebarInset>
            <FarmHeader
                farmOptions={loaderData.farmOptions}
                b_id_farm={loaderData.b_id_farm}
                layerOptions={loaderData.layerOptions}
                layerSelected={layerSelected}
                action={{
                    to: `/farm/${loaderData.b_id_farm}/field`,
                    label: "Naar percelen",
                }}
            />
            <main>
                <FarmTitle
                    title={"Kaarten"}
                    description={
                        "Bekijk verschillende kaartlagen van je bedrijf"
                    }
                />
                <ClientOnly
                    fallback={<Skeleton className="h-full w-full rounded-xl" />}
                >
                    {() => <Outlet />}
                </ClientOnly>
            </main>
        </SidebarInset>
    )
}
