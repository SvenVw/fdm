import { FarmHeader } from "@/components/custom/farm/farm-header"
import { FarmTitle } from "@/components/custom/farm/farm-title"
import { SidebarInset } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { getSession } from "@/lib/auth.server"
import { handleLoaderError } from "@/lib/error"
import { fdm } from "@/lib/fdm.server"
import { getFarm, getFarms } from "@svenvw/fdm-core"
import {
    type LoaderFunctionArgs,
    type MetaFunction,
    Outlet,
    data,
    redirect,
    useLoaderData,
    useLocation,
} from "react-router"
import { ClientOnly } from "remix-utils/client-only"
import config from "~/fdm.config"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: `Kaarten | ${config.name}` },
        {
            name: "description",
            content: "Bekijk informatie op de kaart.",
        },
    ]
}

/**
 * Retrieves farm details, user farm options, and layer configuration based on the farm ID in the URL parameters.
 *
 * This loader function extracts the farm ID from the URL parameters and obtains the user's session to fetch the
 * corresponding farm details. It then gathers a list of farms associated with the authenticated user; if no farms are
 * found, it redirects to the farms overview page. The function also prepares predefined layer options with "fields" as the
 * default selected layer.
 *
 * @throws {Response} If the farm ID is missing (400), the specified farm is not found (404), or an error occurs while fetching farm details (500).
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        // Get the farm id
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw data("Farm ID is required", {
                status: 400,
                statusText: "Farm ID is required",
            })
        }

        // Get the session
        const session = await getSession(request)

        // Get details of farm
        let farm = null
        try {
            farm = await getFarm(fdm, session.principal_id, b_id_farm)
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

        // Get a list of possible farms of the user
        const farms = await getFarms(fdm, session.principal_id)

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
    } catch (error) {
        throw handleLoaderError(error)
    }
}

/**
 * Renders the main content block for the farm atlas view.
 *
 * This component retrieves data from the route loader using the useLoaderData hook, determines
 * the active map layer based on the last segment of the current URL, and displays the corresponding
 * farm header and title. It also renders an Outlet within a ClientOnly wrapper that shows a skeleton
 * loader while client-side components are being initialized.
 *
 * @returns The React element representing the farm atlas content block.
 */
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
