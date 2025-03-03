import { HarvestForm } from "@/components/custom/harvest/form"
import { FormSchema } from "@/components/custom/harvest/schema"
import { Button } from "@/components/ui/button"
import { getSession } from "@/lib/auth.server"
import { handleActionError } from "@/lib/error"
import { fdm } from "@/lib/fdm.server"
import { extractFormValuesFromRequest } from "@/lib/form"
import {
    addHarvest,
    getCultivationPlan,
    getCultivationsFromCatalogue,
} from "@svenvw/fdm-core"
import {
    type ActionFunctionArgs,
    type LoaderFunctionArgs,
    NavLink,
    data,
} from "react-router"
import { redirectWithSuccess } from "remix-toast"

export async function loader({ request, params }: LoaderFunctionArgs) {
    const b_lu_catalogue = params.b_lu_catalogue
    if (!b_lu_catalogue) {
        throw new Error("b_lu_catalogue is required")
    }

    const b_id_farm = params.b_id_farm
    if (!b_id_farm) {
        throw new Error("b_id_farm is required")
    }

    // Get the session
    const session = await getSession(request)

    // Get the available cultivations
    let cultivationOptions = []
    try {
        const cultivationsCatalogue = await getCultivationsFromCatalogue(fdm)
        cultivationOptions = cultivationsCatalogue
            .filter(
                (cultivation) =>
                    cultivation?.b_lu_catalogue && cultivation?.b_lu_name,
            )
            .map((cultivation) => ({
                value: cultivation.b_lu_catalogue,
                label: `${cultivation.b_lu_name} (${cultivation.b_lu_catalogue.split("_")[1]})`,
            }))
    } catch (error) {
        throw data("Failed to load cultivation options", {
            status: 500,
            statusText: "Failed to load cultivation options",
        })
    }

    const cultivationPlan = await getCultivationPlan(
        fdm,
        session.principal_id,
        b_id_farm,
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
    const b_sowing_date = cultivation.b_sowing_date
    const b_terminating_date = cultivation.b_terminating_date
    const harvests = cultivation?.fields?.[0]?.harvests

    return {
        b_lu_catalogue: b_lu_catalogue,
        b_id_farm: b_id_farm,
        b_sowing_date: b_sowing_date,
        b_terminating_date: b_terminating_date,
        harvests: harvests,
        cultivationOptions: cultivationOptions,
    }
}

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
                b_harvesting_date={undefined}
            />
        </div>
    )
}

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

        // Get cultivation id's for this cultivation code
        const cultivationPlan = await getCultivationPlan(
            fdm,
            session.principal_id,
            b_id_farm,
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
                    formValues.b_harvesting_date,
                    formValues.b_lu_yield,
                    formValues.b_lu_n_harvestable,
                )
            }),
        )

        return redirectWithSuccess("../crop", "Oogst is toegevoegd! 🎉")
    } catch (error) {
        return handleActionError(error)
    }
}
