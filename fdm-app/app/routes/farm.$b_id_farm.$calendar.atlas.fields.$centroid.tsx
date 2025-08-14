import {
    data,
    type LoaderFunctionArgs,
    type MetaFunction,
    useLoaderData,
    useLocation,
} from "react-router"
import { getCalendar } from "~/lib/calendar"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"
import { getNmiApiKey, getSoilParameterEstimates } from "~/integrations/nmi"
import { getCultivationCatalogue } from "@svenvw/fdm-data"
import { FarmTitle } from "~/components/blocks/farm/farm-title"
import { CultivationHistoryCard } from "~/components/blocks/atlas-fields/cultivation-history"
import { SoilTextureCard } from "~/components/blocks/atlas-fields/soil-texture"
import { GroundwaterCard } from "~/components/blocks/atlas-fields/groundwater"
import { FieldDetailsCard } from "~/components/blocks/atlas-fields/field-details"
import { Suspense } from "react"
import {
    getRegion,
    isFieldInGWGBGebied,
    isFieldInNatura2000Gebied,
    isFieldInNVGebied,
} from "@svenvw/fdm-calculator"
import { getFieldByCentroid } from "~/components/blocks/atlas-fields/query"
import type { Feature, Point } from "geojson"
import { use } from "react"
import { FieldDetailsAtlasLayout } from "~/components/blocks/atlas-fields/layout"
import { ErrorBlock } from "~/components/custom/error"
import { FieldDetailsAtlasSkeleton } from "~/components/blocks/atlas-fields/skeleton"

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

export async function loader({ params }: LoaderFunctionArgs) {
    try {
        // Get the farm id
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw data("Farm ID is required", {
                status: 400,
                statusText: "Farm ID is required",
            })
        }

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
        if (Number.isNaN(longitude) || Number.isNaN(latitude)) {
            throw data("Invalid centroid format", {
                status: 400,
                statusText: "Centroid must be in format: longitude,latitude",
            })
        }

        return {
            calendar,
            centroid,
            asyncData: loadAsyncData(calendar, latitude, longitude),
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

async function loadAsyncData(
    calendar: string,
    latitude: number,
    longitude: number,
) {
    try {
        const fieldPromise = getFieldByCentroid(longitude, latitude, calendar)
        const field = {
            type: "Feature",
            properties: {},
            geometry: {
                type: "Point",
                coordinates: [longitude, latitude],
            },
        } as Feature<Point>
        const nmiApiKey = getNmiApiKey()

        const estimatesPromise = getSoilParameterEstimates(field, nmiApiKey)
        const cultivationCataloguePromise = getCultivationCatalogue("brp")

        const fieldDetailsPromise = Promise.all([
            getRegion([longitude, latitude]),
            isFieldInNVGebied([longitude, latitude]),
            isFieldInGWGBGebied([longitude, latitude]),
            isFieldInNatura2000Gebied([longitude, latitude]),
        ])

        const [
            estimates,
            cultivationCatalogue,
            fieldDetailsData,
            queriedField,
        ] = await Promise.all([
            estimatesPromise,
            cultivationCataloguePromise,
            fieldDetailsPromise,
            fieldPromise,
        ])

        const [regionTable2, isNvGebied, isGWBGGebied, isNatura2000Area] =
            fieldDetailsData

        const cultivationHistory = estimates.cultivations.map(
            (cultivation: { year: number; b_lu_brp: string }) => {
                const b_lu_catalogue = `nl_${cultivation.b_lu_brp}`
                const catalogueItem = cultivationCatalogue.find(
                    (item: { b_lu_catalogue: string }) =>
                        item.b_lu_catalogue === b_lu_catalogue,
                )
                return {
                    year: cultivation.year,
                    b_lu_catalogue,
                    b_lu_name: catalogueItem?.b_lu_name ?? "Onbekend gewas",
                    b_lu_croprotation:
                        catalogueItem?.b_lu_croprotation ?? "other",
                    b_lu_rest_oravib: catalogueItem?.b_lu_rest_oravib ?? false,
                }
            },
        )

        return {
            cultivationHistory,
            groundwaterEstimates: {
                b_gwl_class: estimates.b_gwl_class,
                b_gwl_ghg: estimates.b_gwl_ghg,
                b_gwl_glg: estimates.b_gwl_glg,
            },
            soilParameterEstimates: {
                a_clay_mi: Math.round(estimates.a_clay_mi),
                a_silt_mi: Math.round(estimates.a_silt_mi),
                a_sand_mi: Math.round(estimates.a_sand_mi),
            },
            fieldDetails: {
                b_area: queriedField?.properties?.b_area
                    ? Math.round(
                          (queriedField.properties.b_area / 10000) * 100,
                      ) / 100
                    : 0,
                isNvGebied,
                isGWBGGebied,
                isNatura2000Area,
                regionTable2,
            },
            calendar,
        }
    } catch (error) {
        return { errorMessage: String(error).replace("Error: ", "") }
    }
}

export default function FieldDetailsAtlasBlock() {
    const loaderData = useLoaderData<typeof loader>()

    return (
        <Suspense
            key={loaderData.centroid}
            fallback={<FieldDetailsAtlasSkeleton />}
        >
            <FieldDetailsAtlas {...loaderData} />
        </Suspense>
    )
}

function FieldDetailsAtlas({
    calendar,
    asyncData,
}: Awaited<ReturnType<typeof loader>>) {
    const {
        fieldDetails,
        cultivationHistory,
        groundwaterEstimates,
        soilParameterEstimates,
        errorMessage,
    } = use(asyncData)

    const location = useLocation()

    if (typeof errorMessage === "string") {
        return (
            <ErrorBlock
                page={location.pathname}
                timestamp={new Date().toISOString()}
                status={500}
                message={errorMessage}
                stacktrace={undefined}
            />
        )
    }

    return (
        <FieldDetailsAtlasLayout
            title={
                <FarmTitle
                    title={
                        cultivationHistory.find(
                            (cultivation: { year: number }) =>
                                cultivation.year === Number(calendar),
                        )?.b_lu_name ?? "Onbekend gewas"
                    }
                    description="Bekijk alle details over dit perceel"
                />
            }
            cultivationHistory={
                <CultivationHistoryCard
                    cultivationHistory={cultivationHistory}
                />
            }
            fieldDetails={<FieldDetailsCard fieldDetails={fieldDetails} />}
            soilTexture={
                <SoilTextureCard
                    soilParameterEstimates={soilParameterEstimates}
                />
            }
            groundWater={
                <GroundwaterCard groundwaterEstimates={groundwaterEstimates} />
            }
        />
    )
}
