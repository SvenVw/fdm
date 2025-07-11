import {
    addHarvest,
    getCultivationPlan,
    getCultivationsFromCatalogue,
} from "@svenvw/fdm-core"
import {
    type ActionFunctionArgs,
    data,
    type LoaderFunctionArgs,
    type MetaFunction,
    NavLink,
} from "react-router"
import { redirectWithSuccess } from "remix-toast"
import { HarvestForm } from "~/components/blocks/harvest/form"
import { FormSchema } from "~/components/blocks/harvest/schema"
import { Button } from "~/components/ui/button"
import { getSession } from "~/lib/auth.server"
import { getTimeframe } from "~/lib/calendar"
import { clientConfig } from "~/lib/config"
import { handleActionError, handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { extractFormValuesFromRequest } from "~/lib/form"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: `Oogst- Bouwplan - Bedrijf toevoegen | ${clientConfig.name}` },
        {
            name: "description",
            content:
                "Bekijk en selecteer de oogsten van een gewas uit je bouwplan.",
        },
    ]
}

/**
 * Retrieves required harvest and cultivation details for rendering the harvest addition form.
 *
 * This loader function validates that the necessary route parameters ("b_lu_catalogue" and "b_id_farm") are present,
 * retrieves the user session, and then obtains a list of available cultivation options from the catalogue.
 * It fetches the cultivation plan using the session's principal identifier and extracts the specific cultivation details,
 * including sowing and terminating dates as well as any associated harvest data.
 *
 * @returns An object containing:
 *   - b_lu_catalogue: The catalogue identifier for the cultivation.
 *   - b_id_farm: The identifier of the farm.
 *   - b_lu_start: The sowing date of the cultivation.
 *   - b_lu_end: The terminating date of the cultivation.
 *   - harvests: The existing harvest data for the cultivation (if available).
 *   - cultivationOptions: An array of available cultivation options with { value, label }.
 *
 * @throws {Response} If "b_lu_catalogue" or "b_id_farm" is missing in the route parameters, or if the specified cultivation is not found.
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        const b_lu_catalogue = params.b_lu_catalogue
        if (!b_lu_catalogue) {
            throw data("b_lu_catalogue is required", {
                status: 400,
                statusText: "b_lu_catalogue is required",
            })
        }

        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw data("b_id_farm is required", {
                status: 400,
                statusText: "b_id_farm is required",
            })
        }

        // Get the session
        const session = await getSession(request)

        // Get timeframe from calendar store
        const timeframe = getTimeframe(params)

        // Get the available cultivations
        let cultivationOptions = []

        const cultivationsCatalogue = await getCultivationsFromCatalogue(
            fdm,
            session.principal_id,
            b_id_farm,
        )
        cultivationOptions = cultivationsCatalogue
            .filter(
                (cultivation) =>
                    cultivation?.b_lu_catalogue && cultivation?.b_lu_name,
            )
            .map((cultivation) => ({
                value: cultivation.b_lu_catalogue,
                label: `${cultivation.b_lu_name} (${cultivation.b_lu_catalogue.split("_")[1]})`,
            }))

        const cultivationPlan = await getCultivationPlan(
            fdm,
            session.principal_id,
            b_id_farm,
            timeframe,
        )
        const cultivation = cultivationPlan.find(
            (x) => x.b_lu_catalogue === b_lu_catalogue,
        )
        if (!cultivation) {
            throw data("Cultivation not found", {
                status: 404,
                statusText: "Cultivation not found",
            })
        }
        const b_lu_start = cultivation.b_lu_start
        const b_lu_end = cultivation.b_lu_end
        const harvests = cultivation?.fields?.[0]?.harvests

        return {
            b_lu_catalogue: b_lu_catalogue,
            b_id_farm: b_id_farm,
            b_lu_start: b_lu_start,
            b_lu_end: b_lu_end,
            harvests: harvests,
            cultivationOptions: cultivationOptions,
        }
    } catch (error) {
        return handleLoaderError(error)
    }
}

/**
 * Renders a block for adding harvest details to a cultivation plan.
 *
 * This component displays an instructional message for entering the harvest date, yield, and harvestable nitrogen,
 * provides a navigation link to return to the crop overview, and includes a HarvestForm component initialized with unset values.
 */
export default function CultivationPlanAddHarvestBlock() {
    return (
        <div className="space-y-6">
            <div>
                <p className="text-sm text-muted-foreground">
                    Voeg een oogstdatum, opbrengst en N-gehalte toe voor deze
                    oogst
                </p>
                <div className="flex justify-end">
                    <NavLink to={"../crop"} className={"ml-auto"}>
                        <Button>{"Terug"}</Button>
                    </NavLink>
                </div>
            </div>
            <HarvestForm
                b_lu_yield={undefined}
                b_lu_n_harvestable={undefined}
                b_lu_harvest_date={undefined}
            />
        </div>
    )
}

/**
 * Handles the submission of the harvest form.
 *
 * Validates that the required parameters (b_lu_catalogue and b_id_farm) are present, retrieves the user session and corresponding cultivation plan, and extracts form values to add harvest data for each field associated with the selected cultivation. Returns a redirect response with a success message upon completion.
 *
 * @returns A redirect response indicating successful addition of the harvest data.
 *
 * @throws {Error} If required parameters are missing or if processing fails.
 */
export async function action({ request, params }: ActionFunctionArgs) {
    try {
        const b_lu_catalogue = params.b_lu_catalogue
        if (!b_lu_catalogue) {
            throw new Error("missing: b_lu_catalogue")
        }
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw new Error("missing: b_id_farm")
        }

        // Get the session
        const session = await getSession(request)

        // Get timeframe from calendar store
        const timeframe = getTimeframe(params)

        // Get cultivation id's for this cultivation code
        const cultivationPlan = await getCultivationPlan(
            fdm,
            session.principal_id,
            b_id_farm,
            timeframe,
        )
        const cultivation = cultivationPlan.find(
            (cultivation) => cultivation.b_lu_catalogue === b_lu_catalogue,
        )
        const b_lu = cultivation.fields.map(
            (field: { b_lu: string }) => field.b_lu,
        )
        const formValues = await extractFormValuesFromRequest(
            request,
            FormSchema,
        )

        // Add cultivation details for each cultivation
        await Promise.all(
            b_lu.map(async (item: string) => {
                await addHarvest(
                    fdm,
                    session.principal_id,
                    item,
                    formValues.b_lu_harvest_date,
                    formValues.b_lu_yield,
                    formValues.b_lu_n_harvestable,
                )
            }),
        )

        return redirectWithSuccess("../crop", "Oogst is toegevoegd! 🎉")
    } catch (error) {
        throw handleActionError(error)
    }
}
