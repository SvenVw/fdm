import { FormSchema } from "@/components/custom/cultivations"
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
    getHarvests,
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
    console.log(harvests)

    // Return user information from loader
    return {
        field: field,
        cultivationsCatalogueOptions: cultivationsCatalogueOptions,
        cultivation: cultivation,
        harvests: harvests
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
                <HarvestsList
                    harvests={loaderData.harvests}
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

    if (request.method === "POST") {
        // Collect form entry
        const formValues = await extractFormValuesFromRequest(
            request,
            FormSchema,
        )
        // const {  } = formValues

        // await addHarvest(
        //     fdm,

        // )

        return dataWithSuccess(
            { result: "Data saved successfully" },
            { message: "Oogst is toegevoegd! 🎉" },
        )
    }

    if (request.method === "DELETE") {
        const formData = await request.formData()
        const b_lu = formData.get("b_lu")

        if (!b_lu || typeof b_lu !== "string") {
            return dataWithError(
                "Invalid or missing b_lu value",
                "Oops! Something went wrong. Please try again later.",
            )
        }

        try {
            // await removeHarvest(fdm)

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
