import { getFarm } from "@svenvw/fdm-core"
import {
    data,
    type LoaderFunctionArgs,
    type MetaFunction,
    Outlet,
    useLoaderData,
} from "react-router"
import { FarmContent } from "~/components/blocks/farm/farm-content"
import { FarmTitle } from "~/components/blocks/farm/farm-title"
import { SidebarInset } from "~/components/ui/sidebar"
import { Toaster } from "~/components/ui/sonner"
import { getSession } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: `Instellingen - Bedrijf | ${clientConfig.name}` },
        {
            name: "description",
            content: "Bekijk en bewerk de instellingen van je bedrijf.",
        },
    ]
}

/**
 * Loads farm details, farm options, and sidebar navigation items for a given farm.
 *
 * Retrieves the farm identifier from the route parameters, validates it, and uses the user's session from the request to
 * fetch the corresponding farm details. It also retrieves all farms associated with the user, mapping them into simplified
 * farm options. Additionally, it constructs sidebar page items for navigating to farm properties, access settings, and deletion.
 *
 * @param params - Route parameters; must include a valid `b_id_farm`.
 * @returns An object containing the farm details, the farm identifier, an array of farm options, and an array of sidebar page items.
 *
 * @throws {Response} If `b_id_farm` is missing from the parameters.
 * @throws {Response} If no farm matches the provided `b_id_farm`.
 * @throws {Response} If no farms associated with the user are found.
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        // Get the farm id
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw data("invalid: b_id_farm", {
                status: 400,
                statusText: "invalid: b_id_farm",
            })
        }

        // Get the session
        const session = await getSession(request)

        // Get details of farm
        const farm = await getFarm(fdm, session.principal_id, b_id_farm)
        if (!farm) {
            throw data("not found: b_id_farm", {
                status: 404,
                statusText: "not found: b_id_farm",
            })
        }

        // Create the items for sidebar page
        const sidebarPageItems = [
            {
                to: `/farm/${b_id_farm}/settings/properties`,
                title: "Gegevens",
            },
            {
                to: `/farm/${b_id_farm}/settings/access`,
                title: "Toegang",
            },
            {
                to: `/farm/${b_id_farm}/settings/derogation`,
                title: "Derogatie",
            },
            {
                to: `/farm/${b_id_farm}/settings/delete`,
                title: "Verwijderen",
            },
        ]

        // Return user information from loader
        return {
            sidebarPageItems: sidebarPageItems,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

/**
 * Renders the layout for managing farm settings.
 *
 * This component displays a sidebar that includes the farm header, navigation options, and a link to farm fields.
 * It also renders a main section containing the farm title, description, nested routes via an Outlet, and a notification toaster.
 */
export default function FarmContentBlock() {
    const loaderData = useLoaderData<typeof loader>()

    return (
        <SidebarInset>
            <main>
                <FarmTitle
                    title={"Instellingen"}
                    description={"Beheer de instellingen van je bedrijf"}
                />
                <FarmContent sidebarItems={loaderData.sidebarPageItems}>
                    <Outlet />
                </FarmContent>
                <Toaster />
            </main>
        </SidebarInset>
    )
}
