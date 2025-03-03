import { CultivationForm } from "@/components/custom/cultivation/form"
import { FormSchema } from "@/components/custom/cultivation/schema"
import { HarvestsList } from "@/components/custom/harvest/list"
import type { HarvestableType } from "@/components/custom/harvest/types"
import { Separator } from "@/components/ui/separator"
import { getSession } from "@/lib/auth.server"
import { handleActionError } from "@/lib/error"
import { fdm } from "@/lib/fdm.server"
import { extractFormValuesFromRequest } from "@/lib/form"
import {
    getCultivationPlan,
    getCultivationsFromCatalogue,
    removeHarvest,
    updateCultivation,
} from "@svenvw/fdm-core"
import { E } from "node_modules/better-auth/dist/index-Y--3ocl8"
import {
    type ActionFunctionArgs,
    type LoaderFunctionArgs,
    data,
    useFetcher,
    useLoaderData,
} from "react-router"
import { dataWithError, dataWithSuccess } from "remix-toast"

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
    let b_lu_harvestable: HarvestableType = "none"
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
                return cultivation.b_lu_catalogue === b_lu_catalogue
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

    const cultivationPlan = await getCultivationPlan(
        fdm,
        session.principal_id,
        b_id_farm,
    )
    const cultivation = cultivationPlan.find(
        (x) => x.b_lu_catalogue === b_lu_catalogue,
    )
    const b_sowing_date = cultivation.b_sowing_date
    const b_terminating_date = cultivation.b_terminating_date

    // Find the target cultivation within the cultivation plan
    const targetCultivation = cultivationPlan.find(
        (c) => c.b_lu_catalogue === b_lu_catalogue,
    )
    if (!targetCultivation) {
        throw data("Cultivation not found", { status: 404 })
    }

    // Combine similar harvests across all fields of the target cultivation.
    interface HarvestInfo {
        b_harvesting_date: Date
        harvestables: {
            harvestable_analyses: {
                b_lu_yield?: number
                b_lu_n_harvestable?: number
            }[]
        }[]
    }
    const harvests = targetCultivation.fields.reduce((accumulator, field) => {
        for (const harvest of field.harvests) {
            // Create a key based on harvest properties to identify similar harvests
            const isSimilarHarvest = (h1: HarvestInfo, h2: HarvestInfo) =>
                h1.b_harvesting_date.getTime() ===
                    h2.b_harvesting_date.getTime() &&
                h1.harvestables[0].harvestable_analyses[0].b_lu_yield ===
                    h2.harvestables[0].harvestable_analyses[0].b_lu_yield &&
                h1.harvestables[0].harvestable_analyses[0]
                    .b_lu_n_harvestable ===
                    h2.harvestables[0].harvestable_analyses[0]
                        .b_lu_n_harvestable

            const existingHarvestIndex = accumulator.findIndex(
                (existingHarvest: HarvestInfo) =>
                    isSimilarHarvest(existingHarvest, harvest),
            )

            if (existingHarvestIndex !== -1) {
                // If similar harvests exist, add the current b_id_harvesting to its b_ids_harvesting array
                accumulator[existingHarvestIndex].b_ids_harvesting.push(
                    harvest.b_id_harvesting,
                )
            } else {
                // If it's a new harvest, add it to the accumulator with a new b_ids_harvesting array
                accumulator.push({
                    ...harvest,
                    b_ids_harvesting: [harvest.b_id_harvesting],
                })
            }
        }

        return accumulator
    }, [] as HarvestInfo[])

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
                b_lu_harvestable={loaderData.b_lu_harvestable}
                state={fetcher.state}
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

        if (request.method === "POST") {
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
                    if (
                        formValues.b_sowing_date ||
                        formValues.b_terminating_date
                    ) {
                        await updateCultivation(
                            fdm,
                            session.principal_id,
                            item,
                            undefined,
                            formValues.b_sowing_date,
                            formValues.b_terminating_date,
                        )
                    }
                }),
            )

            return dataWithSuccess(
                { result: "Data saved successfully" },
                "Gewas is bijgewerkt! 🎉",
            )
        }
        if (request.method === "DELETE") {
            const formData = await request.formData()
            const rawHarvestIds = formData.get("b_id_harvesting")

            if (!rawHarvestIds || typeof rawHarvestIds !== "string") {
                throw new Error("invalid: rawHarvestIds")
            }
            const b_ids_harvesting = rawHarvestIds.split(",")

            // Remove harvests for all cultivations
            await Promise.all(
                b_ids_harvesting.map(async (b_id_harvesting: string) => {
                    await removeHarvest(
                        fdm,
                        session.principal_id,
                        b_id_harvesting,
                    )
                }),
            )

            return dataWithSuccess(
                { result: "Data removed successfully" },
                "Oogst is verwijderd",
            )
        }
    } catch (error) {
        return handleActionError(error)
    }
}
