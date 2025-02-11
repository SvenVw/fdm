import { FormSchema } from "@/components/custom/harvest/schema"
import { HarvestForm } from "@/components/custom/harvest/form"
import { HarvestsList } from "@/components/custom/harvest/list"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { fdm } from "@/lib/fdm.server"
import { extractFormValuesFromRequest } from "@/lib/form"
import {
    addHarvest,
    getCultivation,
    getCultivationsFromCatalogue,
    getField,
    getHarvest,
    removeHarvest,
} from "@svenvw/fdm-core"
import {
    type ActionFunctionArgs,
    type LoaderFunctionArgs,
    NavLink,
    data,
    useFetcher,
    useLoaderData,
    useLocation,
} from "react-router"
import {
    dataWithError,
    dataWithSuccess,
    redirectWithSuccess,
} from "remix-toast"

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

    // Get the harvest id
    const b_id_harvesting = params.b_id_harvesting
    if (!b_id_harvesting) {
        throw data("Harvest ID is required", {
            status: 400,
            statusText: "Harvest ID is required",
        })
    }

    // Get details of cultivation
    const cultivation = await getCultivation(fdm, b_lu)
    if (!cultivation) {
        throw data("Cultivation is not found", {
            status: 404,
            statusText: "Cultivation is not found",
        })
    }

    // Get selected harvest
    const harvest = await getHarvest(fdm, b_id_harvesting)

    // Return user information from loader
    return {
        cultivation: cultivation,
        harvest: harvest,
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
                        loaderData.harvest.harvestable[0].harvestableAnalysis[0]
                            .b_lu_yield
                    }
                    b_lu_n_harvestable={
                        loaderData.harvest.harvestable[0].harvestableAnalysis[0]
                            .b_lu_n_harvestable
                    }
                    b_harvesting_date={
                        loaderData.harvest.harvestable[0].harvestableAnalysis[0]
                            .b_harvesting_date
                    }
                />
            </div>
        </div>
    )
}

export async function action({ request, params }: ActionFunctionArgs) {
    // Get the farm ID
    const b_id_farm = params.b_id_farm
    if (!b_id_farm) {
        return dataWithError(null, "Missing farm ID.")
    }

    // Get the field ID
    const b_id = params.b_id
    if (!b_id) {
        return dataWithError(null, "Missing field ID.")
    }

    // Get cultivation id
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
        const { b_lu_yield, b_lu_n_harvestable, b_harvesting_date } = formValues

        await addHarvest(
            fdm,
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
    }

    if (request.method === "DELETE") {
        const formData = await request.formData()
        const b_id_harvesting = formData.get("b_id_harvesting")

        if (!b_id_harvesting || typeof b_id_harvesting !== "string") {
            return dataWithError(
                "Invalid or missing b_id_harvesting value",
                "Oops! Something went wrong. Please try again later.",
            )
        }

        try {
            await removeHarvest(fdm, b_id_harvesting)

            return dataWithSuccess("Harvest deleted successfully", {
                message: "GOogst is verwijderd",
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
