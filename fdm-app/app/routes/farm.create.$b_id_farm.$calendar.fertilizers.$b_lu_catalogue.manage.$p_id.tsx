import {
    getFarm,
    getFarms,
    getFertilizer,
    getFertilizerParametersDescription,
    getFertilizers,
    updateFertilizerFromCatalogue,
} from "@svenvw/fdm-core"
import {
    type ActionFunctionArgs,
    data,
    type LoaderFunctionArgs,
    type MetaFunction,
    useLoaderData,
} from "react-router"
import { dataWithSuccess } from "remix-toast"
import { FarmFertilizerBlock } from "~/components/blocks/fertilizer/fertilizer-page"
import { FormSchema } from "~/components/blocks/fertilizer/formschema"
import { getSession } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { handleActionError, handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { extractFormValuesFromRequest } from "~/lib/form"

export const meta: MetaFunction = () => {
    return [
        { title: `Meststof | ${clientConfig.name}` },
        {
            name: "description",
            content: "Bekij de details van deze meststof",
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

        // Get the fertilizer id
        const p_id = params.p_id
        if (!p_id) {
            throw data("invalid: p_id", {
                status: 400,
                statusText: "invalid: p_id",
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

        // Get selected fertilizer
        const fertilizer = await getFertilizer(fdm, p_id)
        const fertilizerParameters = getFertilizerParametersDescription()

        // Get the available fertilizers
        const fertilizers = await getFertilizers(
            fdm,
            session.principal_id,
            b_id_farm,
        )
        const fertilizerOptions = fertilizers.map((fertilizer) => {
            return {
                p_id: fertilizer.p_id,
                p_name_nl: fertilizer.p_name_nl || "",
            }
        })

        // Set editable status
        let editable = false
        if (fertilizer.p_source === b_id_farm) {
            editable = true
        }

        // Return user information from loader
        return {
            farm: farm,
            p_id: p_id,
            b_id_farm: b_id_farm,
            farmOptions: farmOptions,
            fertilizerOptions: fertilizerOptions,
            fertilizer: fertilizer,
            editable: editable,
            fertilizerParameters: fertilizerParameters,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

export default function FarmFertilizerPage() {
    const loaderData = useLoaderData()

    return (
        <FarmFertilizerBlock
            loaderData={loaderData}
            backlink={"../fertilizer/manage"}
        />
    )
}

export async function action({ request, params }: ActionFunctionArgs) {
    try {
        const b_id_farm = params.b_id_farm
        const p_id = params.p_id

        if (!b_id_farm) {
            throw new Error("missing: b_id_farm")
        }
        if (!p_id) {
            throw new Error("missing: p_id")
        }

        const session = await getSession(request)
        const formValues = await extractFormValuesFromRequest(
            request,
            FormSchema,
        )

        const fertilizer = await getFertilizer(fdm, p_id)
        if (fertilizer.p_source !== b_id_farm) {
            throw new Error("Forbidden")
        }
        const p_id_catalogue = fertilizer.p_id_catalogue

        await updateFertilizerFromCatalogue(
            fdm,
            session.principal_id,
            b_id_farm,
            p_id_catalogue,
            formValues,
        )

        return dataWithSuccess(
            { result: "Data saved successfully" },
            { message: "Meststof is bijgewerkt! 🎉" },
        )
    } catch (error) {
        throw handleActionError(error)
    }
}
