import { CultivationForm } from "~/components/custom/cultivation/form"
import { FormSchema } from "~/components/custom/cultivation/schema"
import { HarvestsList } from "~/components/custom/harvest/list"
import type { HarvestableType } from "~/components/custom/harvest/types"
import { Separator } from "~/components/ui/separator"
import { getSession } from "~/lib/auth.server"
import { handleActionError, handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { extractFormValuesFromRequest } from "~/lib/form"
import { getTimeframe } from "~/lib/calendar"
import {
    getCultivationPlan,
    getCultivationsFromCatalogue,
    removeHarvest,
    updateCultivation,
} from "@svenvw/fdm-core"
import {
    type ActionFunctionArgs,
    type LoaderFunctionArgs,
    type MetaFunction,
    data,
    useFetcher,
    useLoaderData,
} from "react-router"
import { dataWithSuccess } from "remix-toast"
import { clientConfig } from "~/lib/config"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: `Gewas- Bouwplan - Bedrijf toevoegen | ${clientConfig.name}` },
        {
            name: "description",
            content:
                "Bekijk en selecteer de oogst van een gewas uit je bouwplan.",
        },
    ]
}

/**
 * Loads and prepares cultivation and harvest data for a specified farm and catalogue.
 *
 * This loader validates that the required route parameters are provided, retrieves the session, and fetches available cultivation
 * options from the catalogue. It then obtains the farm's cultivation plan, identifies the target cultivation, extracts its start
 * and end dates, and aggregates similar harvest entries by combining their identifiers based on harvest date and yield data.
 * @throws {Response} When b_lu_catalogue or b_id_farm is missing, or if the target cultivation does not exist.
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
        let b_lu_harvestable: HarvestableType = "none"
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

        const cultivationCatalogueItem = cultivationsCatalogue.find(
            (cultivation) => {
                return cultivation.b_lu_catalogue === b_lu_catalogue
            },
        )

        if (cultivationCatalogueItem) {
            b_lu_harvestable = cultivationCatalogueItem.b_lu_harvestable
        }

        const cultivationPlan = await getCultivationPlan(
            fdm,
            session.principal_id,
            b_id_farm,
            timeframe,
        )
        const cultivation = cultivationPlan.find(
            (x) => x.b_lu_catalogue === b_lu_catalogue,
        )
        const b_lu_start = cultivation.b_lu_start
        const b_lu_end = cultivation.b_lu_end

        // Find the target cultivation within the cultivation plan
        const targetCultivation = cultivationPlan.find(
            (c) => c.b_lu_catalogue === b_lu_catalogue,
        )
        if (!targetCultivation) {
            throw data("Cultivation not found", { status: 404 })
        }

        // Combine similar harvests across all fields of the target cultivation.
        interface HarvestInfo {
            b_lu_harvest_date: Date
            harvestables: {
                harvestable_analyses: {
                    b_lu_yield?: number
                    b_lu_n_harvestable?: number
                }[]
            }[]
        }
        const harvests = targetCultivation.fields.reduce(
            (accumulator, field) => {
                for (const harvest of field.harvests) {
                    // Create a key based on harvest properties to identify similar harvests
                    const isSimilarHarvest = (
                        h1: HarvestInfo,
                        h2: HarvestInfo,
                    ) =>
                        h1.b_lu_harvest_date.getTime() ===
                            h2.b_lu_harvest_date.getTime() &&
                        h1.harvestables[0].harvestable_analyses[0]
                            .b_lu_yield ===
                            h2.harvestables[0].harvestable_analyses[0]
                                .b_lu_yield &&
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
            },
            [] as HarvestInfo[],
        )

        return {
            b_lu_catalogue: b_lu_catalogue,
            b_id_farm: b_id_farm,
            b_lu_start: b_lu_start,
            b_lu_end: b_lu_end,
            b_lu_harvestable: b_lu_harvestable,
            harvests: harvests,
            cultivationOptions: cultivationOptions,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

/**
 * Renders the farm cultivation management interface.
 *
 * This component displays a form for updating cultivation details and a list of harvests. It retrieves
 * cultivation data using the loader hook and uses a fetcher to handle form submissions, enabling users
 * to update start and end dates as well as manage harvest records.
 *
 * @returns A JSX element representing the cultivation form and harvest list.
 */
export default function FarmAFieldCultivationBlock() {
    const loaderData = useLoaderData<typeof loader>()
    const fetcher = useFetcher()

    return (
        <div className="space-y-6">
            <div>
                <p className="text-sm text-muted-foreground">
                    Vul de oogsten in voor dit gewas.
                </p>
            </div>
            <Separator />
            <div className="grid 2xl:grid-cols-2 gap-8">
                <CultivationForm
                    b_lu_catalogue={loaderData.b_lu_catalogue}
                    b_lu_start={loaderData.b_lu_start}
                    b_lu_end={loaderData.b_lu_end}
                    options={loaderData.cultivationOptions}
                    action={`/farm/create/${loaderData.b_id_farm}/cultivations/${loaderData.b_lu_catalogue}/crop`}
                />
                <div>{null}</div>
                <HarvestsList
                    harvests={loaderData.harvests}
                    b_lu_harvestable={loaderData.b_lu_harvestable}
                    state={fetcher.state}
                />
            </div>
        </div>
    )
}

/**
 * Processes POST and DELETE requests to update cultivation details or remove harvest records.
 *
 * For POST requests, it updates the cultivation fields with provided start and end dates for the specified farm and catalogue.
 * For DELETE requests, it removes the specified harvest entries.
 *
 * This function validates that the required route parameters are present and uses session information to execute the appropriate operation.
 *
 * @throws {Error} If required parameters are missing or if the provided harvest IDs are invalid.
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

        if (request.method === "POST") {
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
                    if (formValues.b_lu_start || formValues.b_lu_end) {
                        await updateCultivation(
                            fdm,
                            session.principal_id,
                            item,
                            undefined,
                            formValues.b_lu_start,
                            formValues.b_lu_end,
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
        throw handleActionError(error)
    }
}
