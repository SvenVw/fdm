import {
    data,
    type LoaderFunctionArgs,
    type MetaFunction,
    useLoaderData,
    Await,
} from "react-router"
import { getSession } from "~/lib/auth.server"
import { getCalendar, getTimeframe } from "~/lib/calendar"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"
import { getNmiApiKey, getSoilParameterEstimates } from "~/integrations/nmi"
import { getCultivationCatalogue } from "@svenvw/fdm-data"
import {
    FarmTitle,
    FarmTitleSkeleton,
} from "~/components/blocks/farm/farm-title"
import {
    CultivationHistoryCard,
    CultivationHistorySkeleton,
} from "~/components/blocks/atlas-fields/cultivation-history"
import {
    SoilTextureCard,
    SoilTextureSkeleton,
} from "~/components/blocks/atlas-fields/soil-texture"
import {
    GroundWaterCard,
    GroundWaterSkeleton,
} from "~/components/blocks/atlas-fields/groundwater"
import { Suspense } from "react"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: `Perceel | Atlas | ${clientConfig.name}` },
        {
            name: "description",
            content: "Bekijk de details van dit perceel",
        },
    ]
}

export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        // Get the farm id
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw data("Farm ID is required", {
                status: 400,
                statusText: "Farm ID is required",
            })
        }

        // Get the session
        const session = await getSession(request)

        // Get timeframe from calendar store
        const calendar = getCalendar(params)
        const timeframe = getTimeframe(params)

        // Get the estimates for this field
        const centroid = params.centroid
        if (!centroid) {
            throw data("Centroid is required", {
                status: 400,
                statusText: "Centroid is required",
            })
        }
        const [longitude, latitude] = centroid.split(",").map(Number)
        const field = {
            type: "Feature",
            properties: {},
            geometry: {
                type: "Point",
                coordinates: [longitude, latitude],
            },
        } as GeoJSON.Feature<GeoJSON.Point>
        const nmiApiKey = getNmiApiKey()

        const estimatesPromise = getSoilParameterEstimates(field, nmiApiKey)
        const cultivationCataloguePromise = getCultivationCatalogue("brp")

        return {
            cultivationHistory: (async () => {
                const estimates = await estimatesPromise
                const cultivationCatalogue = await cultivationCataloguePromise
                return estimates.cultivations.map((cultivation) => {
                    const b_lu_catalogue = `nl_${cultivation.b_lu_brp}`
                    const catalogueItem = cultivationCatalogue.find(
                        (catalogueItem) =>
                            catalogueItem.b_lu_catalogue === b_lu_catalogue,
                    )
                    return {
                        year: cultivation.year,
                        b_lu_catalogue: b_lu_catalogue,
                        b_lu_name: catalogueItem?.b_lu_name,
                        b_lu_croprotation: catalogueItem?.b_lu_croprotation,
                    }
                })
            })(),
            groundwaterEstimates: (async () => {
                const estimates = await estimatesPromise
                return {
                    b_gwl_class: estimates.b_gwl_class,
                    b_gwl_ghg: estimates.b_gwl_ghg,
                    b_gwl_glg: estimates.b_gwl_glg,
                }
            })(),
            soilParameterEstimates: (async () => {
                const estimates = await estimatesPromise
                return {
                    a_clay_mi: Math.round(estimates.a_clay_mi),
                    a_silt_mi: Math.round(estimates.a_silt_mi),
                    a_sand_mi: Math.round(estimates.a_sand_mi),
                }
            })(),
            fieldDetails: {
                b_area: undefined,
                isNvGebied: undefined,
                isNatura2000Area: undefined,
                regionTable2: undefined,
            },
            calendar: calendar,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

export default function FieldDetailsAtlasBlock() {
    const {
        cultivationHistory,
        calendar,
        soilParameterEstimates,
        groundwaterEstimates,
    } = useLoaderData<typeof loader>()

    return (
        <main>
            <Suspense fallback={<FarmTitleSkeleton />}>
                <Await resolve={cultivationHistory}>
                    {(resolvedCultivationHistory) => (
                        <FarmTitle
                            title={
                                resolvedCultivationHistory.find(
                                    (cultivation) =>
                                        String(cultivation.year) === calendar,
                                )?.b_lu_name ?? ""
                            }
                            description="Bekijk alle details over dit perceel"
                            action={{
                                to: "../fields",
                                label: "Terug",
                            }}
                        />
                    )}
                </Await>
            </Suspense>
            <div className="grid grid-flow-col grid-rows-3 gap-6 lg:grid-cols-3 px-10 items-start">
                <div className="row-span-3">
                    <Suspense fallback={<CultivationHistorySkeleton />}>
                        <Await resolve={cultivationHistory}>
                            {(resolvedCultivationHistory) => (
                                <CultivationHistoryCard
                                    cultivationHistory={
                                        resolvedCultivationHistory
                                    }
                                />
                            )}
                        </Await>
                    </Suspense>
                </div>
                <div className="col-span-2 space-y-4">
                    <Suspense fallback={<SoilTextureSkeleton />}>
                        <Await resolve={soilParameterEstimates}>
                            {(resolvedSoilParameterEstimates) => (
                                <SoilTextureCard
                                    soilParameterEstimates={
                                        resolvedSoilParameterEstimates
                                    }
                                />
                            )}
                        </Await>
                    </Suspense>
                    <Suspense fallback={<GroundWaterSkeleton />}>
                        <Await resolve={groundwaterEstimates}>
                            {(resolvedGroundwaterEstimates) => (
                                <GroundWaterCard
                                    groundWaterEstimates={
                                        resolvedGroundwaterEstimates
                                    }
                                />
                            )}
                        </Await>
                    </Suspense>
                </div>
            </div>
        </main>
    )
}
