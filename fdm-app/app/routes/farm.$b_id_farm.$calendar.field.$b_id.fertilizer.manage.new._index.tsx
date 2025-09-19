import { getFertilizers } from "@svenvw/fdm-core"
import type { LoaderFunctionArgs } from "react-router"
import { useLoaderData } from "react-router"
import { NewFertilizerIndex } from "@/app/components/blocks/fertilizer/new-index-page"
import { getSession } from "~/lib/auth.server"
import { fdm } from "~/lib/fdm.server"

export async function loader({ request, params }: LoaderFunctionArgs) {
    const { b_id_farm } = params
    if (!b_id_farm) {
        throw new Error("Farm ID is required")
    }

    const session = await getSession(request)

    const fertilizers = await getFertilizers(
        fdm,
        session.principal_id,
        b_id_farm,
    )

    return { b_id_farm: b_id_farm, fertilizers: fertilizers }
}

export default function NewFertilizerIndexPage() {
    const loaderData = useLoaderData<typeof loader>()

    return <NewFertilizerIndex loaderData={loaderData} />
}
