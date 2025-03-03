import { HarvestForm } from "@/components/custom/harvest/form"
import { FormSchema } from "@/components/custom/harvest/schema"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { getSession } from "@/lib/auth.server"
import { handleActionError, handleLoaderError } from "@/lib/error"
import { fdm } from "@/lib/fdm.server"
import { extractFormValuesFromRequest } from "@/lib/form"
import { addHarvest, getCultivation, getHarvest } from "@svenvw/fdm-core"
import {
    type ActionFunctionArgs,
    type LoaderFunctionArgs,
    NavLink,
    data,
    useFetcher,
    useLoaderData,
} from "react-router"
import { dataWithError, redirectWithSuccess } from "remix-toast"

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

        // Get the field id
        const b_id = params.b_id
        if (!b_id) {
            throw data("Field ID is required", {
                status: 400,
                statusText: "Field ID is required",
            })
        }

        // Get the cultivation id
        const b_lu = params.b_lu
        if (!b_lu) {
            throw data("Cultivation ID is required", {
                status: 400,
                statusText: "Cultivation ID is required",
            })
        }

        // Get the harvest id
        const b_id_harvesting = params.b_id_harvesting
        if (!b_id_harvesting) {
            throw data("Harvest ID is required", {
                status: 400,
                statusText: "Harvest ID is required",
            })
        }

        // Get the session
        const session = await getSession(request)

        // Get details of cultivation
        const cultivation = await getCultivation(
            fdm,
            session.principal_id,
            b_lu,
        )
        if (!cultivation) {
            throw data("Cultivation is not found", {
                status: 404,
                statusText: "Cultivation is not found",
            })
        }

        // Get selected harvest
        const harvest = await getHarvest(
            fdm,
            session.principal_id,
            b_id_harvesting,
        )

        // Return user information from loader
        return {
            cultivation: cultivation,
            harvest: harvest,
            b_id_farm: b_id_farm,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

export default function FarmFieldsOverviewBlock() {
    const loaderData = useLoaderData<typeof loader>()

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <h3 className="text-lg font-medium">
                        {loaderData.cultivation.b_lu_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Vul de oogsten in voor dit gewas.
                    </p>
                </div>
                <div className="flex justify-end">
                    <NavLink
                        to={`/farm/${loaderData.b_id_farm}/field/${loaderData.cultivation.b_id}/cultivation/${loaderData.cultivation.b_lu}`}
                        className={"ml-auto"}
                    >
                        <Button>{"Terug"}</Button>
                    </NavLink>
                </div>
            </div>
            <Separator />
            <div className="space-y-6">
                <HarvestForm
                    b_lu_yield={
                        loaderData.harvest?.harvestables?.[0]
                            ?.harvestable_analyses?.[0]?.b_lu_yield
                    }
                    b_lu_n_harvestable={
                        loaderData.harvest?.harvestables?.[0]
                            ?.harvestable_analyses?.[0]?.b_lu_n_harvestable
                    }
                    b_harvesting_date={loaderData.harvest?.b_harvesting_date}
                />
            </div>
        </div>
    )
}

export async function action({ request, params }: ActionFunctionArgs) {
    try {
        // Get the farm ID
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw new Error("missing: b_id_farm")
        }

        // Get the field ID
        const b_id = params.b_id
        if (!b_id) {
            throw new Error("missing: b_id")
        }

        // Get cultivation id
        const b_lu = params.b_lu
        if (!b_lu) {
            throw new Error("missing: b_lu")
        }

        // Get the session
        const session = await getSession(request)

        // Collect form entry
        const formValues = await extractFormValuesFromRequest(
            request,
            FormSchema,
        )
        const { b_lu_yield, b_lu_n_harvestable, b_harvesting_date } = formValues

        await addHarvest(
            fdm,
            session.principal_id,
            b_lu,
            b_harvesting_date,
            b_lu_yield,
            b_lu_n_harvestable,
        )

        return redirectWithSuccess(
            `/farm/${b_id_farm}/field/${b_id}/cultivation/${b_lu}`,
            {
                message: "Oogst is toegevoegd! 🎉",
            },
        )
    } catch (error) {
        throw handleActionError(error)
    }
}
