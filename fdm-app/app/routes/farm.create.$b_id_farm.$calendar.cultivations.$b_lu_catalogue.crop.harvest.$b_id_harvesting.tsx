import {
    getCultivationPlan,
    getHarvest,
    removeHarvest,
    updateHarvest,
} from "@svenvw/fdm-core"
import {
    type ActionFunctionArgs,
    data,
    type LoaderFunctionArgs,
    type MetaFunction,
    useLoaderData,
    useNavigate,
} from "react-router"
import { redirectWithSuccess } from "remix-toast"
import { HarvestForm } from "~/components/blocks/harvest/form"
import { FormSchema } from "~/components/blocks/harvest/schema"
import { getSession } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { handleActionError, handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { extractFormValuesFromRequest } from "~/lib/form"
import { getCalendar, getTimeframe } from "~/lib/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: `Oogst - Gewas - Perceel | ${clientConfig.name}` },
        {
            name: "description",
            content: "Bekijk en bewerk de oogst van je gewas.",
        },
    ]
}

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

        // Get the cultivation catalogue id
        const b_lu_catalogue = params.b_lu_catalogue
        if (!b_lu_catalogue) {
            throw data("Cultivation Catalogue ID is required", {
                status: 400,
                statusText: "Cultivation Catalogue ID is required",
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
        const calendar = getCalendar(params)
        const timeframe = getTimeframe(params)

        // Get cultivation plan to find the target cultivation
        const cultivationPlan = await getCultivationPlan(
            fdm,
            session.principal_id,
            b_id_farm,
            timeframe,
        )
        const cultivation = cultivationPlan.find(
            (c) => c.b_lu_catalogue === b_lu_catalogue,
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
            calendar: calendar,
            b_lu_catalogue: b_lu_catalogue,
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
    const navigate = useNavigate()

    return (
        <Dialog open={true} onOpenChange={() => navigate("..")}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Oogst bijwerken</DialogTitle>
                </DialogHeader>
                <HarvestForm
                    b_lu_yield={
                        loaderData.harvest?.harvestable
                            ?.harvestable_analyses?.[0]?.b_lu_yield
                    }
                    b_lu_n_harvestable={
                        loaderData.harvest?.harvestable
                            ?.harvestable_analyses?.[0]?.b_lu_n_harvestable
                    }
                    b_lu_harvest_date={loaderData.harvest?.b_lu_harvest_date}
                    b_lu_start={loaderData.cultivation.b_lu_start}
                    b_lu_end={loaderData.cultivation.b_lu_end}
                    b_lu_harvestable={loaderData.cultivation.b_lu_harvestable}
                />
            </DialogContent>
        </Dialog>
    )
}

/**
 * Handles form submissions to add a new harvest entry.
 *
 * This function validates the presence of required route parameters (farm ID, field ID, and cultivation ID), retrieves the user session, and extracts harvest details from the submitted form based on a predefined schema. If all validations pass, it adds the new harvest and redirects to the cultivation overview with a success message.
 *
 * @throws {Error} When any required parameter is missing or if an error occurs during form processing.
 */
export async function action({ request, params }: ActionFunctionArgs) {
    try {
        // Get the farm ID
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw new Error("missing: b_id_farm")
        }

        // Get cultivation catalogue id
        const b_lu_catalogue = params.b_lu_catalogue
        if (!b_lu_catalogue) {
            throw new Error("missing: b_lu_catalogue")
        }

        // Get the session
        const session = await getSession(request)
        const calendar = getCalendar(params)
        const timeframe = getTimeframe(params)

        // Get the action from the form
        if (request.method === "POST") {
            const b_id_harvesting = params.b_id_harvesting
            if (!b_id_harvesting) {
                throw new Error("missing: b_id_harvesting")
            }
            // Collect form entry
            const formValues = await extractFormValuesFromRequest(
                request,
                FormSchema,
            )
            const { b_lu_yield, b_lu_n_harvestable, b_lu_harvest_date } =
                formValues

            // Get all cultivation IDs associated with this catalogue
            const cultivationPlan = await getCultivationPlan(
                fdm,
                session.principal_id,
                b_id_farm,
                timeframe,
            )
            const cultivation = cultivationPlan.find(
                (c) => c.b_lu_catalogue === b_lu_catalogue,
            )
            if (!cultivation) {
                throw new Error("Cultivation not found")
            }
            const b_lu_ids = cultivation.fields.map((field: { b_lu: string }) => field.b_lu)

            // Update harvests for all cultivations that share the same harvest ID
            await Promise.all(
                b_lu_ids.map(async (b_lu: string) => {
                    const harvestsForCultivation = cultivation.fields.find(
                        (field: { b_lu: string }) => field.b_lu === b_lu,
                    )?.harvests || []

                    const targetHarvest = harvestsForCultivation.find(
                        (h: { b_id_harvesting: string }) => h.b_id_harvesting === b_id_harvesting,
                    )

                    if (targetHarvest) {
                        await updateHarvest(
                            fdm,
                            session.principal_id,
                            targetHarvest.b_id_harvesting,
                            b_lu_harvest_date,
                            b_lu_yield,
                            b_lu_n_harvestable,
                        )
                    }
                }),
            )

            return redirectWithSuccess(
                `/farm/create/${b_id_farm}/${calendar}/cultivations/${b_lu_catalogue}/crop`,
                {
                    message: "Oogst is gewijzigd! 🎉",
                },
            )
        }
        if (request.method === "DELETE") {
            const b_id_harvesting = params.b_id_harvesting
            if (!b_id_harvesting) {
                throw new Error("missing: b_id_harvesting")
            }

            // Get all cultivation IDs associated with this catalogue
            const cultivationPlan = await getCultivationPlan(
                fdm,
                session.principal_id,
                b_id_farm,
                timeframe,
            )
            const cultivation = cultivationPlan.find(
                (c) => c.b_lu_catalogue === b_lu_catalogue,
            )
            if (!cultivation) {
                throw new Error("Cultivation not found")
            }
            const b_lu_ids = cultivation.fields.map((field: { b_lu: string }) => field.b_lu)

            // Remove harvests for all cultivations that share the same harvest ID
            await Promise.all(
                b_lu_ids.map(async (b_lu: string) => {
                    const harvestsForCultivation = cultivation.fields.find(
                        (field: { b_lu: string }) => field.b_lu === b_lu,
                    )?.harvests || []

                    const targetHarvest = harvestsForCultivation.find(
                        (h: { b_id_harvesting: string }) => h.b_id_harvesting === b_id_harvesting,
                    )

                    if (targetHarvest) {
                        await removeHarvest(
                            fdm,
                            session.principal_id,
                            targetHarvest.b_id_harvesting,
                        )
                    }
                }),
            )

            return redirectWithSuccess(
                `/farm/create/${b_id_farm}/${calendar}/cultivations/${b_lu_catalogue}/crop`,
                {
                    message: "Oogst is verwijderd! 🎉",
                },
            )
        }
    } catch (error) {
        throw handleActionError(error)
    }
}
