import { centroid } from "@turf/centroid"
import {
    GeolocateControl,
    Layer,
    Map as MapGL,
    NavigationControl,
} from "react-map-gl"
import {
    type ActionFunctionArgs,
    type LoaderFunctionArgs,
    type MetaFunction,
    data,
    redirect,
    useLoaderData,
} from "react-router"
import { ClientOnly } from "remix-utils/client-only"
import wkx from "wkx"

// Components
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import {
    addCultivation,
    addField,
    addSoilAnalysis,
    getFarm,
} from "@svenvw/fdm-core"
import { redirectWithSuccess } from "remix-toast"
import { fdm } from "../lib/fdm.server"
import {
    FieldsSourceAvailable,
    FieldsSourceNotClickable,
    FieldsSourceSelected,
} from "@/components/custom/atlas/atlas-sources"
import {
    FieldsPanelHover,
    FieldsPanelSelection,
    FieldsPanelZoom,
} from "@/components/custom/atlas/atlas-panels"
import { ZOOM_LEVEL_FIELDS } from "@/components/custom/atlas/atlas"
import { getViewState } from "@/components/custom/atlas/atlas-viewstate"
import { getFieldsStyle } from "@/components/custom/atlas/atlas-styles"
import {
    getMapboxStyle,
    getMapboxToken,
} from "@/components/custom/atlas/atlas-mapbox"
import { useEffect, useState } from "react"
import { generateFeatureClass } from "@/components/custom/atlas/atlas-functions"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: "FDM App" },
        { name: "description", content: "Welcome to FDM!" },
    ]
}

// Loader
export async function loader({ request, params }: LoaderFunctionArgs) {
    // Get the Id and name of the farm
    const b_id_farm = params.b_id_farm
    if (!b_id_farm) {
        throw data("Farm ID is required", {
            status: 400,
            statusText: "Farm ID is required",
        })
    }
    const farm = await getFarm(fdm, b_id_farm)

    if (!farm) {
        throw data("Farm not found", {
            status: 404,
            statusText: "Farm not found",
        })
    }

    // Get the Mapbox token and style
    const mapboxToken = getMapboxToken()
    const mapboxStyle = getMapboxStyle()

    return {
        b_name_farm: farm.b_name_farm,
        mapboxToken: mapboxToken,
        mapboxStyle: mapboxStyle,
        fieldsAvailableUrl: process.env.AVAILABLE_FIELDS_URL,
    }
}

// Main
export default function Index() {
    const loaderData = useLoaderData<typeof loader>()

    const fieldsAvailableId = "fieldsAvailable"
    // const fields = loaderData.savedFields
    const viewState = getViewState(null)
    const fieldsAvailableStyle = getFieldsStyle(fieldsAvailableId)

    const fieldsSelectedId = "fieldsSelected"
    const fieldsSelectedStyle = getFieldsStyle(fieldsSelectedId)

    // Set selected fields
    const [selectedFieldsData, setSelectedFieldsData] = useState(
        generateFeatureClass(),
    )

    return (
        <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink>Maak een bedrijf</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden md:block" />
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink>
                                {loaderData.b_name_farm}
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden md:block" />
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink>Selecteer percelen</BreadcrumbLink>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>
            <main>
                <div className="space-y-6 p-10 pb-0">
                    <div className="flex items-center">
                        <div className="space-y-0.5">
                            <h2 className="text-2xl font-bold tracking-tight">
                                Kaart
                            </h2>
                            <p className="text-muted-foreground">
                                Zoom in en selecteer je percelen
                            </p>
                        </div>

                        <div className="ml-auto">
                            {/* <a href={`/farm/create/${loaderData.b_id_farm}/cultivations`} className="ml-auto">
                <Button>Doorgaan</Button>
              </a> */}
                        </div>
                    </div>
                    <Separator className="my-6" />
                </div>
                <div>
                    <ClientOnly
                        fallback={
                            <Skeleton className="h-full w-full rounded-xl" />
                        }
                    >
                        {() => (
                            <MapGL
                                {...viewState}
                                style={{
                                    height: "calc(100vh - 64px - 123px)",
                                    width: "100%",
                                }}
                                interactive={true}
                                mapStyle={loaderData.mapboxStyle}
                                mapboxAccessToken={loaderData.mapboxToken}
                                interactiveLayerIds={[fieldsAvailableId]}
                            >
                                <GeolocateControl />
                                <NavigationControl />

                                <FieldsSourceAvailable
                                    id={fieldsAvailableId}
                                    url={loaderData.fieldsAvailableUrl}
                                    zoomLevelFields={ZOOM_LEVEL_FIELDS}
                                >
                                    <Layer {...fieldsAvailableStyle} />
                                </FieldsSourceAvailable>

                                <FieldsSourceSelected
                                    id={fieldsSelectedId}
                                    availableLayerId={fieldsAvailableId}
                                    fieldsData={selectedFieldsData}
                                    setFieldsData={setSelectedFieldsData}
                                >
                                    <Layer {...fieldsSelectedStyle} />
                                </FieldsSourceSelected>

                                <div className="fields-panel grid gap-4 w-[350px]">
                                    <FieldsPanelSelection
                                        fields={selectedFieldsData}
                                    />
                                    <FieldsPanelZoom
                                        zoomLevelFields={ZOOM_LEVEL_FIELDS}
                                    />
                                    <FieldsPanelHover
                                        zoomLevelFields={ZOOM_LEVEL_FIELDS}
                                        layer={fieldsAvailableId}
                                        layerExclude={fieldsSelectedId}
                                    />
                                      <FieldsPanelHover
                                        zoomLevelFields={ZOOM_LEVEL_FIELDS}
                                        layer={fieldsSelectedId}
                                    />
                                </div>
                            </MapGL>
                        )}
                    </ClientOnly>
                </div>
            </main>
        </SidebarInset>
    )
}

// Action
export async function action({ request, params }: ActionFunctionArgs) {
    const formData = await request.formData()
    const b_id_farm = params.b_id_farm

    if (!b_id_farm) {
        throw data("Farm ID is required", {
            status: 400,
            statusText: "Farm ID is required",
        })
    }
    const selectedFields = JSON.parse(String(formData.get("selected_fields")))

    // Add fields to farm
    const b_ids = await Promise.all(
        selectedFields.features.map(async (field, index) => {
            const b_name = `Perceel ${index + 1}`
            const b_id_source = field.properties.b_id_source
            const b_lu_catalogue = `nl_${field.properties.b_lu_catalogue}` //TEMPORARY
            const currentYear = new Date().getFullYear()
            const defaultDate = new Date(currentYear, 0, 1)
            const b_acquiring_date = defaultDate
            const b_date_sowing = defaultDate
            const b_terminating_date = undefined
            const b_acquiring_method = "unknown"

            // Validate dates
            if (
                new Date(b_acquiring_date) > new Date() ||
                new Date(b_date_sowing) > new Date()
            ) {
                throw data("Future dates are not allowed", {
                    status: 400,
                    statusText: "Future dates are not allowed",
                })
            }
            if (new Date(b_date_sowing) < new Date(b_acquiring_date)) {
                throw data(
                    "Sowing should happen after field started to be managed",
                    {
                        status: 400,
                        statusText:
                            "Sowing should happen after field started to be managed",
                    },
                )
            }
            const fieldGeometry = wkx.Geometry.parseGeoJSON(field.geometry)
            const b_geometry = fieldGeometry.toWkt()

            try {
                const b_id = await addField(
                    fdm,
                    b_id_farm,
                    b_name,
                    b_id_source,
                    b_geometry,
                    b_acquiring_date,
                    b_acquiring_method,
                    b_terminating_date,
                )
                await addCultivation(
                    fdm,
                    b_lu_catalogue,
                    b_id,
                    b_date_sowing,
                    b_terminating_date,
                )

                if (process.env.NMI_API_KEY) {
                    const fieldCentroid = centroid(field.geometry)
                    const a_lon = fieldCentroid.geometry.coordinates[0]
                    const a_lat = fieldCentroid.geometry.coordinates[1]

                    const responseApi = await fetch(
                        `https://api.nmi-agro.nl/estimates?${new URLSearchParams(
                            {
                                a_lat: a_lat.toString(),
                                a_lon: a_lon.toString(),
                            },
                        )}`,
                        {
                            method: "GET",
                            headers: {
                                Authorization: `Bearer ${process.env.NMI_API_KEY}`,
                            },
                        },
                    )

                    if (!responseApi.ok) {
                        throw data(responseApi.statusText, {
                            status: responseApi.status,
                            statusText: responseApi.statusText,
                        })
                    }

                    const result = await responseApi.json()
                    const response = result.data

                    await addSoilAnalysis(
                        fdm,
                        defaultDate,
                        "NMI",
                        b_id,
                        30,
                        defaultDate,
                        {
                            a_p_al: response.a_p_al,
                            a_p_cc: response.a_p_cc,
                            a_som_loi: response.a_som_loi,
                            b_soiltype_agr: response.b_soiltype_agr,
                            b_gwl_class: response.b_gwl_class,
                        },
                    )
                }

                return b_id
            } catch (error) {
                console.error(`Failed to process field ${b_name}:`, error)
                throw data(`Failed to add field ${b_name}: ${error.message}`, {
                    status: 500,
                    statusText: `Failed to add field ${b_name}`,
                })
            }
        }),
    )

    return redirectWithSuccess(`/farm/create/${b_id_farm}/fields/${b_ids[0]}`, {
        message: "Percelen zijn toegevoegd! 🎉",
    })
}
