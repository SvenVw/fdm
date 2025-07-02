import {
    getCultivationPlan,
    getCultivationsFromCatalogue,
} from "@svenvw/fdm-core"
import {
    data,
    type LoaderFunctionArgs,
    type MetaFunction,
    NavLink,
    useLoaderData,
} from "react-router"
import { HarvestForm } from "~/components/blocks/harvest/form"
import { Button } from "~/components/ui/button"
import { getSession } from "~/lib/auth.server"
import { getTimeframe } from "~/lib/calendar"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"

// Meta
export const meta: MetaFunction = () => {
    return [
        {
            title: `Oogst - Bouwplan - Bedrijf toevoegen | ${clientConfig.name}`,
        },
        {
            name: "description",
            content:
                "Bekijk en selecteer de oogst van een gewas uit je bouwplan.",
        },
    ]
}

/**
 * Loads harvest details for a specific cultivation plan.
 *
 * This function validates that the required URL parameters (catalogue identifier, farm ID, and harvesting ID) are present before retrieving the user session and fetching the corresponding cultivation plan. It then searches the cultivation plan for the specified harvest and extracts its yield, harvestable count, and harvesting date.
 *
 * @returns An object containing:
 *   - b_lu_catalogue: The provided catalogue identifier.
 *   - b_id_farm: The provided farm identifier.
 *   - b_lu_yield: The yield value from the harvest analysis, if available.
 *   - b_lu_n_harvestable: The number of harvestable items from the harvest analysis, if available.
 *   - b_lu_harvest_date: The date of the harvest, if available.
 *
 * @throws {Response} When any required parameter (catalogue identifier, farm ID, or harvesting ID) is missing.
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

        const b_id_harvesting = params.b_id_harvesting
        if (!b_id_harvesting) {
            throw data("b_id_harvesting is required", {
                status: 400,
                statusText: "b_id_harvesting is required",
            })
        }

        // Get the session
        const session = await getSession(request)

        // Get timeframe from calendar store
        const timeframe = getTimeframe(params)

        // Get the available cultivations
        let _cultivationOptions = []

        const cultivationsCatalogue = await getCultivationsFromCatalogue(
            fdm,
            session.principal_id,
            b_id_farm,
        )
        _cultivationOptions = cultivationsCatalogue
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
        const harvest = cultivation?.fields?.[0]?.harvests?.find((harvest) => {
            return harvest.b_id_harvesting === b_id_harvesting
        })

        return {
            b_lu_catalogue: b_lu_catalogue,
            b_id_farm: b_id_farm,
            b_lu_yield:
                harvest?.harvestable.harvestable_analyses?.[0].b_lu_yield,
            b_lu_n_harvestable:
                harvest?.harvestable.harvestable_analyses?.[0]
                    .b_lu_n_harvestable,
            b_lu_harvest_date: harvest?.b_lu_harvest_date,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

/**
 * Renders a harvest input block for a cultivation plan.
 *
 * This component retrieves harvest-related data using loader context and displays a form
 * to input harvest details such as yield, harvestable N value, and harvesting date.
 * It also includes a button that navigates back to the crop page.
 *
 * @returns A React element representing the harvest details entry block.
 */
export default function CultivationPlanGetHarvestBlock() {
    const loaderData = useLoaderData<typeof loader>()

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
                b_lu_yield={loaderData.b_lu_yield}
                b_lu_n_harvestable={loaderData.b_lu_n_harvestable}
                b_lu_harvest_date={loaderData.b_lu_harvest_date}
            />
        </div>
    )
}
