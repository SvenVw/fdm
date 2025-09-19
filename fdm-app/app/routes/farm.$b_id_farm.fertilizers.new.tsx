import { getFarm, getFarms } from "@svenvw/fdm-core"
import {
    data,
    type LoaderFunctionArgs,
    type MetaFunction,
    Outlet,
    useLoaderData,
} from "react-router"
import { getSession } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { FarmNewFertilizerLayout } from "../components/blocks/fertilizer/new-layout"
import type { Route } from "./+types/farm.$b_id_farm.fertilizers.new"

export const meta: MetaFunction = () => {
    return [
        { title: `Meststof toevoegen | ${clientConfig.name}` },
        {
            name: "description",
            content:
                "Voeg een meststof toe om deze te gebruiken op dit bedrijf.",
        },
    ]
}

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

        // Get a list of possible farms of the user
        const farms = await getFarms(fdm, session.principal_id)
        if (!farms || farms.length === 0) {
            throw data("not found: farms", {
                status: 404,
                statusText: "not found: farms",
            })
        }

        const farmOptions = farms.map((farm) => {
            return {
                b_id_farm: farm.b_id_farm,
                b_name_farm: farm.b_name_farm || "",
            }
        })

        // Return user information from loader
        return {
            farm: farm,
            b_id_farm: b_id_farm,
            farmOptions: farmOptions,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

/**
 * Renders the new fertilizer wizard when coming from the main sidebar.
 */
export default function FarmFertilizerBlock({ params }: Route.ComponentProps) {
    const loaderData = useLoaderData<typeof loader>()

    return (
        <FarmNewFertilizerLayout
            loaderData={loaderData}
            backlink={`/farm/${params.b_id_farm}/fertilizers`}
        >
            <Outlet />
        </FarmNewFertilizerLayout>
    )
}
