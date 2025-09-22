import { getFarm, getFarms, getFertilizers } from "@svenvw/fdm-core"
import {
    data,
    type LoaderFunctionArgs,
    type MetaFunction,
    useLoaderData,
} from "react-router"
import type { Fertilizer } from "~/components/blocks/fertilizer/columns"
import { FarmFertilizersIndexBlock } from "~/components/blocks/fertilizer/index-page"
import { getSession } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import type { Route } from "./+types/farm.create.$b_id_farm.$calendar.fertilizers.$b_lu_catalogue.manage._index"

export const meta: MetaFunction = () => {
    return [
        { title: `Meststoffen | ${clientConfig.name}` },
        {
            name: "description",
            content: "Bekij de lijst van meststoffen beschikbaar.",
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
                b_name_farm: farm.b_name_farm,
            }
        })

        // Get the available fertilizers
        const fertilizers: Fertilizer[] = await getFertilizers(
            fdm,
            session.principal_id,
            b_id_farm,
        )

        // Return user information from loader
        return {
            farm: farm,
            b_id_farm: b_id_farm,
            farmOptions: farmOptions,
            fertilizers: fertilizers,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

export default function FarmFertilizersIndexPage({
    params,
}: Route.ComponentProps) {
    const loaderData = useLoaderData<typeof loader>()

    return (
        <FarmFertilizersIndexBlock
            loaderData={loaderData}
            action={{
                label: "Terug naar bemesting toevoegen",
                to: `/farm/create/${params.b_id_farm}/${params.calendar}/fertilizers/${params.b_lu_catalogue}`,
                disabled: false,
            }}
        />
    )
}
