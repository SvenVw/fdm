import { HarvestForm } from "@/components/custom/harvest/form"
import { FormSchema } from "@/components/custom/harvest/schema"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { fdm } from "@/lib/fdm.server"
import { extractFormValuesFromRequest } from "@/lib/form"
import {
    addHarvest,
    getCultivation,
    getCultivationsFromCatalogue,
    getField,
} from "@svenvw/fdm-core"
import {
    type ActionFunctionArgs,
    type LoaderFunctionArgs,
    NavLink,
    data,
    useFetcher,
    useLoaderData,
} from "react-router"
import { dataWithError, redirectWithSuccess } from "remix-toast"

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

    // Get selected cultivation
    const cultivation = await getCultivation(fdm, b_lu)

    // Return user information from loader
    return {
        field: field,
        cultivationsCatalogueOptions: cultivationsCatalogueOptions,
        cultivation: cultivation,
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
                <HarvestForm
                    b_lu_yield={undefined}
                    b_lu_n_harvestable={undefined}
                    b_harvesting_date={undefined}
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
    console.log(b_lu)

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
}
