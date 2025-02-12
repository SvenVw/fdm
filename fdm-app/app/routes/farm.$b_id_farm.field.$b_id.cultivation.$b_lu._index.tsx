import { CultivationForm } from "@/components/custom/cultivation/form"
import { FormSchema } from "@/components/custom/cultivation/schema"
import { HarvestsList } from "@/components/custom/harvest/list"
import { HarverstableType } from "@/components/custom/harvest/types"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { fdm } from "@/lib/fdm.server"
import { extractFormValuesFromRequest } from "@/lib/form"
import {
    getCultivation,
    getCultivationsFromCatalogue,
    getField,
    getHarvests,
    removeHarvest,
    updateCultivation,
} from "@svenvw/fdm-core"
import {
    type ActionFunctionArgs,
    type LoaderFunctionArgs,
    NavLink,
    data,
    useFetcher,
    useLoaderData,
} from "react-router"
import { dataWithError, dataWithSuccess } from "remix-toast"

export async function loader({ request, params }: LoaderFunctionArgs) {
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

    // Get details of field
    const field = await getField(fdm, b_id)
    if (!field) {
        throw data("Field is not found", {
            status: 404,
            statusText: "Field is not found",
        })
    }

    // Get available cultivations for the farm
    const cultivationsCatalogue = await getCultivationsFromCatalogue(fdm)
    // Map cultivations to options for the combobox
    const cultivationsCatalogueOptions = cultivationsCatalogue.map(
        (cultivation) => {
            return {
                value: cultivation.b_lu_catalogue,
                label: cultivation.b_lu_name,
            }
        },
    )

    // Get cultivation
    const cultivation = await getCultivation(fdm, b_lu)

    // Get harvests
    const harvests = await getHarvests(fdm, b_lu)

    let b_lu_harvestable: HarverstableType = "none"
    try {
        const cultivationCatalogueItem = cultivationsCatalogue.find((item) => {
            return item.b_lu_catalogue === cultivation.b_lu_catalogue
        })
        if (cultivationCatalogueItem) {
            b_lu_harvestable = cultivationCatalogueItem.b_lu_harvestable
        }
    } catch (error) {
        console.error("Failed to fetch b_lu_harvestable:", error)
        throw data("Failed to load b_lu_harvestable", {
            status: 500,
            statusText: "Failed to load b_lu_harvestable",
        })
    }

    // Return user information from loader
    return {
        field: field,
        cultivationsCatalogueOptions: cultivationsCatalogueOptions,
        cultivation: cultivation,
        harvests: harvests,
        b_lu_harvestable: b_lu_harvestable,
        b_id_farm: b_id_farm,
    }
}

export default function FarmFieldsOverviewBlock() {
    const loaderData = useLoaderData<typeof loader>()
    const fetcher = useFetcher()

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
                    <NavLink to={"../cultivation"} className={"ml-auto"}>
                        <Button>{"Terug"}</Button>
                    </NavLink>
                </div>
            </div>
            <Separator />
            <div className="space-y-6">
                <CultivationForm
                    b_lu_catalogue={loaderData.cultivation.b_lu_catalogue}
                    b_sowing_date={loaderData.cultivation.b_sowing_date}
                    b_terminating_date={
                        loaderData.cultivation.b_terminating_date
                    }
                    options={loaderData.cultivationsCatalogueOptions}
                    action={`/farm/${loaderData.b_id_farm}/field/${loaderData.cultivation.b_id}/cultivation/${loaderData.cultivation.b_lu}`}
                />
                <Separator />
                <HarvestsList
                    harvests={loaderData.harvests}
                    b_lu_harvestable={loaderData.b_lu_harvestable}
                    state={fetcher.state}
                />
            </div>
        </div>
    )
}

export async function action({ request, params }: ActionFunctionArgs) {
    // Get the field ID
    const b_id = params.b_id
    if (!b_id) {
        return dataWithError(null, "Missing field ID.")
    }

    // Get the cultivation ID
    const b_lu = params.b_lu
    if (!b_lu) {
        return dataWithError(null, "Missing b_lu value.")
    }

    if (request.method === "POST") {
        // Collect form entry
        const formValues = await extractFormValuesFromRequest(
            request,
            FormSchema,
        )
        const { b_lu_catalogue, b_sowing_date, b_terminating_date } = formValues

        await updateCultivation(
            fdm,
            b_lu,
            b_lu_catalogue,
            b_sowing_date,
            b_terminating_date,
        )

        return dataWithSuccess(
            { result: "Data saved successfully" },
            { message: "Oogst is toegevoegd! 🎉" },
        )
    }

    if (request.method === "DELETE") {
        const formData = await request.formData()
        const b_id_harvesting = formData.get("b_id_harvesting")
        console.log(b_id_harvesting)

        if (!b_id_harvesting || typeof b_id_harvesting !== "string") {
            return dataWithError(
                "Invalid or missing b_id_harvesting value",
                "Oops! Something went wrong. Please try again later.",
            )
        }

        try {
            await removeHarvest(fdm, b_id_harvesting)

            return dataWithSuccess("Harvest deleted successfully", {
                message: "Oogst is verwijderd",
            })
        } catch (error) {
            // Handle errors appropriately. Log the error for debugging purposes.
            console.error("Error deleting harvest:", error)
            return dataWithError(
                error instanceof Error ? error.message : "Unknown error",
                "Er is een fout opgetreden bij het verwijderen van het oogst. Probeer het later opnieuw.",
            )
        }
    }
}
