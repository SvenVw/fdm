import { HarvestForm } from "@/components/custom/harvest/form"
import { Button } from "@/components/ui/button"
import { fdm } from "@/lib/fdm.server"
import {
    getCultivationPlan,
    getCultivationsFromCatalogue,
} from "@svenvw/fdm-core"
import {
    type LoaderFunctionArgs,
    NavLink,
    data,
    useLoaderData,
} from "react-router"

export async function loader({ request, params }: LoaderFunctionArgs) {
    const b_lu_catalogue = params.b_lu_catalogue
    if (!b_lu_catalogue) {
        throw new Error("b_lu_catalogue is required")
    }

    const b_id_farm = params.b_id_farm
    if (!b_id_farm) {
        throw new Error("b_id_farm is required")
    }

    const b_id_harvesting = params.b_id_harvesting
    if (!b_id_harvesting) {
        throw new Error("b_id_harvesting is required")
    }

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
        console.error("Failed to fetch cultivations:", error)
        throw data("Failed to load cultivation options", {
            status: 500,
            statusText: "Failed to load cultivation options",
        })
    }

    const cultivationPlan = await getCultivationPlan(fdm, b_id_farm)
    const cultivation = cultivationPlan.find(
        (x) => x.b_lu_catalogue === b_lu_catalogue,
    )
    const harvest = cultivation?.fields[0]?.harvests?.find((harvest) => {
        return harvest.b_id_harvesting === b_id_harvesting
    })
    if (!harvest) {
        throw data("Harvest not found", {
            status: 404,
            statusText: "Harvest not found",
        })
    }

    return {
        b_lu_catalogue: b_lu_catalogue,
        b_id_farm: b_id_farm,
        b_lu_yield: harvest.harvestables[0].harvestable_analyses[0].b_lu_yield,
        b_lu_n_harvestable:
            harvest.harvestables[0].harvestable_analyses[0].b_lu_n_harvestable,
        b_harvesting_date: harvest.b_harvesting_date,
    }
}

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
                b_harvesting_date={loaderData.b_harvesting_date}
            />
        </div>
    )
}
