import {
    data,
    type LoaderFunctionArgs,
    type MetaFunction,
    useLoaderData,
    Await,
} from "react-router"
import { getSession } from "~/lib/auth.server"
import { getCalendar } from "~/lib/calendar"
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
import {
    FieldDetailsCard,
    FieldDetailsSkeleton,
} from "~/components/blocks/atlas-fields/field-details"
import { Suspense } from "react"
import {
    getRegion,
    isFieldInGWGBGebied,
    isFieldInNatura2000Gebied,
    isFieldInNVGebied,
} from "@svenvw/fdm-calculator"
import { is } from "drizzle-orm"

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

        const fieldDetails = Promise.all([
            getRegion([longitude, latitude]),
            isFieldInNVGebied([longitude, latitude]),
            isFieldInGWGBGebied([longitude, latitude]),
            isFieldInNatura2000Gebied([longitude, latitude]),
        ])

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
            fieldDetails: (async () => {
                const [
                    regionTable2,
                    isNvGebied,
                    isGWBGGebied,
                    isNatura2000Area,
                ] = await fieldDetails
                return {
                    b_area: 10.5,
                    isNvGebied: isNvGebied,
                    isGWBGGebied: isGWBGGebied,
                    isNatura2000Area: isNatura2000Area,
                    regionTable2: regionTable2,
                }
            })(),
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
        fieldDetails,
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
                        />
                    )}
                </Await>
            </Suspense>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-10 items-start">
                {/* Field Details - Mobile first (order 1), Desktop (order 2) */}
                <div className="lg:order-2 lg:col-span-2 space-y-4">
                    <Suspense fallback={<FieldDetailsSkeleton />}>
                        <Await resolve={fieldDetails}>
                            {(resolvedFieldDetails) => (
                                <FieldDetailsCard
                                    fieldDetails={resolvedFieldDetails}
                                />
                            )}
                        </Await>
                    </Suspense>
                </div>
                {/* Cultivation History - Mobile (order 2), Desktop (order 1) */}
                <div className="lg:order-1 lg:row-span-3">
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
                {/* Soil Texture - Mobile (order 3), Desktop (order 3) */}
                <div className="lg:order-3 lg:col-span-2 space-y-4">
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
                </div>
                {/* Ground Water - Mobile (order 4), Desktop (order 4) */}
                <div className="lg:order-4 lg:col-span-2 space-y-4">
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
