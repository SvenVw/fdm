import {
    type ActionFunctionArgs,
    data,
    type LoaderFunctionArgs,
    useFetcher,
    useLoaderData,
} from "react-router"
import {
    getCultivationPlan,
    getCultivationsFromCatalogue,
    getHarvestableTypeOfCultivation,
    removeHarvest,
    updateCultivation,
} from "@svenvw/fdm-core"
import { extractFormValuesFromRequest } from "@/lib/form"
import { dataWithSuccess } from "remix-toast"
import { fdm } from "@/lib/fdm.server"
import { HarvestsList } from "@/components/custom/harvest/list"
import { CultivationForm } from "@/components/custom/cultivation/form"
import { Separator } from "@/components/ui/separator"
import { FormSchema } from "@/components/custom/cultivation/schema"
import { cultivationsCatalogue } from "node_modules/@svenvw/fdm-core/dist/db/schema"

export async function loader({ request, params }: LoaderFunctionArgs) {
    const b_lu_catalogue = params.b_lu_catalogue
    if (!b_lu_catalogue) {
        throw new Error("b_lu_catalogue is required")
    }

    const b_id_farm = params.b_id_farm
    if (!b_id_farm) {
        throw new Error("b_id_farm is required")
    }

    // Get the available cultivations
    let cultivationOptions = []
    let b_lu_harvestable = "none"
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

        const cultivationCatalogueItem = cultivationsCatalogue.find(
            (cultivation) => {
                cultivation.b_lu_catalogue === b_lu_catalogue
            },
        )
        if (cultivationCatalogueItem) {
            b_lu_harvestable = cultivationCatalogueItem.b_lu_harvestable
        }
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
    const b_sowing_date = cultivation.b_sowing_date
    const b_terminating_date = cultivation.b_terminating_date
    const harvests = cultivation.fields[0].harvests

    return {
        b_lu_catalogue: b_lu_catalogue,
        b_id_farm: b_id_farm,
        b_sowing_date: b_sowing_date,
        b_terminating_date: b_terminating_date,
        b_lu_harvestable: b_lu_harvestable,
        harvests: harvests,
        cultivationOptions: cultivationOptions,
    }
}

export default function FarmAFieldCultivationBlock() {
    const loaderData = useLoaderData<typeof loader>()
    const fetcher = useFetcher()

    return (
        <div className="space-y-6">
            <div>
                <p className="text-sm text-muted-foreground">
                    Werk de opbrengst, stikstofgehalte en zaai- en oogstdatum
                    bij voor dit gewas.
                </p>
            </div>
            <CultivationForm
                b_lu_catalogue={loaderData.b_lu_catalogue}
                b_sowing_date={loaderData.b_sowing_date}
                b_terminating_date={loaderData.b_terminating_date}
                options={loaderData.cultivationOptions}
                action={`/farm/create/${loaderData.b_id_farm}/cultivations/${loaderData.b_lu_catalogue}/crop`}
            />
            <Separator />
            <HarvestsList
                harvests={loaderData.harvests}
                harvestableType="multiple"
                state={fetcher.state}
            />
        </div>
    )
}

export async function action({ request, params }: ActionFunctionArgs) {
    const b_lu_catalogue = params.b_lu_catalogue
    if (!b_lu_catalogue) {
        throw new Error("b_lu_catalogue is required")
    }
    const b_id_farm = params.b_id_farm
    if (!b_id_farm) {
        throw new Error("b_id_farm is required")
    }

    // Get cultivation id's for this cultivation code
    const cultivationPlan = await getCultivationPlan(fdm, b_id_farm)
    const cultivation = cultivationPlan.find(
        (cultivation) => cultivation.b_lu_catalogue === b_lu_catalogue,
    )
    const b_lu = cultivation.fields.map((field: { b_lu: string }) => field.b_lu)
    const formValues = await extractFormValuesFromRequest(request, FormSchema)

    // Add cultivation details for each cultivation
    await Promise.all(
        b_lu.map(async (item: string) => {
            try {
                if (formValues.b_sowing_date || formValues.b_terminating_date) {
                    await updateCultivation(
                        fdm,
                        item,
                        undefined,
                        formValues.b_sowing_date,
                        formValues.b_terminating_date,
                    )
                }
            } catch (error) {
                console.error(
                    `Failed to process cultivation ${b_lu_catalogue} for farm ${b_id_farm}:`,
                    error,
                )
                throw data(
                    `Failed to process cultivation ${b_lu_catalogue} for farm ${b_id_farm}: ${error.message}`,
                    {
                        status: 500,
                        statusText: `Failed to process cultivation ${b_lu_catalogue} for farm ${b_id_farm}`,
                    },
                )
            }
        }),
    )

    return dataWithSuccess(
        { result: "Data saved successfully" },
        "Gewas is bijgewerkt! 🎉",
    )
}
