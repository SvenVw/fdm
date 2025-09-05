import { getFields } from "@svenvw/fdm-core"
import {
    data,
    type LoaderFunctionArgs,
    type MetaFunction,
    Outlet,
} from "react-router"
import { FarmTitle } from "~/components/blocks/farm/farm-title"
import { SidebarInset } from "~/components/ui/sidebar"
import { clientConfig } from "~/lib/config"
import { getSession } from "~/lib/auth.server"
import { getTimeframe } from "~/lib/calendar"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: `Stikstof | Nutriëntenbalans| ${clientConfig.name}` },
        {
            name: "description",
            content: "Bekijk stikstof voor je nutriëntenbalans.",
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

        // Get timeframe from calendar store
        const timeframe = getTimeframe(params)

        // Get the fields to be selected
        const fields = await getFields(
            fdm,
            session.principal_id,
            b_id_farm,
            timeframe,
        )
        const fieldOptions = fields.map((field) => {
            if (!field?.b_id || !field?.b_name) {
                throw new Error("Invalid field data structure")
            }
            return {
                b_id: field.b_id,
                b_name: field.b_name,
                b_area: Math.round(field.b_area * 10) / 10,
            }
        })

        // Return user information from loader
        return {
            fieldOptions: fieldOptions,
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
export default function FarmBalanceNitrogenBlock() {
    return (
        <SidebarInset>
            <main>
                <FarmTitle
                    title={"Stikstof"}
                    description={"Bekijk stikstof voor je nutriëntenbalans."}
                />
                <div className="space-y-6 p-10 pb-0">
                    <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                        <div className="flex-1">{<Outlet />}</div>
                    </div>
                </div>
            </main>
        </SidebarInset>
    )
}
