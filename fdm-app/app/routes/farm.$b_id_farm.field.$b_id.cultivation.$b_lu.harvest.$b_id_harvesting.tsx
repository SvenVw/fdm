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

/**
 * Retrieves cultivation and harvest data based on provided URL parameters.
 *
 * This function extracts the farm, field, cultivation, and harvest identifiers from the URL parameters,
 * validates their presence, obtains the user session, and then fetches the corresponding cultivation details
 * and associated harvest data. The returned object is used to render the harvest overview.
 *
 * @returns An object containing the cultivation details, the associated harvest data, and the farm ID.
 *
 * @throws {Response} If any required URL parameter is missing or if the specified cultivation is not found.
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

/**
 * Renders a block displaying cultivation details and a harvest input form.
 *
 * This component uses data loaded by the router to show the name of the cultivation and an instruction
 * for entering harvest information. It also provides a navigation link back to the cultivation details page
 * and renders a HarvestForm component prefilled with available harvest analytics data when present.
 *
 * @returns The JSX element representing the harvest overview block.
 */
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
                    b_lu_harvest_date={loaderData.harvest?.b_lu_harvest_date}
                />
            </div>
        </div>
    )
}

/**
 * Processes a form submission to add a new harvest entry.
 *
 * Validates that the required route parameters (farm, field, and cultivation IDs) are present, retrieves the user session,
 * and extracts harvest details from the submitted form using a predefined schema. On success, a new harvest entry is added
 * and the user is redirected to the cultivation overview page with a confirmation message.
 *
 * @throws {Error} If any required route parameter is missing or if form processing fails.
 */
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
        const { b_lu_yield, b_lu_n_harvestable, b_lu_harvest_date } = formValues

        await addHarvest(
            fdm,
            session.principal_id,
            b_lu,
            b_lu_harvest_date,
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
