import { ZOOM_LEVEL_FIELDS } from "@/components/custom/atlas/atlas"
import { generateFeatureClass } from "@/components/custom/atlas/atlas-functions"
import {
    getMapboxStyle,
    getMapboxToken,
} from "@/components/custom/atlas/atlas-mapbox"
import {
    FieldsPanelHover,
    FieldsPanelSelection,
    FieldsPanelZoom,
} from "@/components/custom/atlas/atlas-panels"
import {
    FieldsSourceAvailable,
    FieldsSourceNotClickable,
    FieldsSourceSelected,
} from "@/components/custom/atlas/atlas-sources"
import { getFieldsStyle } from "@/components/custom/atlas/atlas-styles"
import { getViewState } from "@/components/custom/atlas/atlas-viewstate"
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
import { getSession } from "@/lib/auth.server"
import { getCalendar, getTimeframe } from "@/lib/calendar"
import { handleActionError, handleLoaderError } from "@/lib/error"
import { useCalendarStore } from "@/store/calendar"
import {
    addCultivation,
    addField,
    getFarm,
    getFarms,
    getFields,
} from "@svenvw/fdm-core"
import { centroid } from "@turf/centroid"
import { useState } from "react"
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
    useLoaderData,
} from "react-router"
import { redirectWithSuccess } from "remix-toast"
import { ClientOnly } from "remix-utils/client-only"
import { fdm } from "../lib/fdm.server"
import FieldDetailsDialog from "@/components/custom/field/form"
import { FarmHeader } from "@/components/custom/farm/farm-header"
import { FeatureCollection } from "geojson"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: "FDM App" },
        { name: "description", content: "Welcome to FDM!" },
    ]
}

/**
 * Retrieves farm details and map configurations for rendering the farm map.
 *
 * This loader function extracts the farm ID from route parameters, validates its presence, and uses the current session to fetch the corresponding farm details. It then retrieves the Mapbox token and style configuration, and returns these along with the farm's display name and a URL for available fields. Any errors encountered during processing are transformed using {@link handleLoaderError}.
 *
 * @throws {Response} When the farm ID is missing, the specified farm is not found, or another error occurs during data retrieval.
 *
 * @returns An object containing the farm name, Mapbox token, Mapbox style, and the URL for available fields.
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        // Get the Id and name of the farm
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
        const timeframe = getTimeframe(params)

        // Get a list of possible farms of the user
        const farms = await getFarms(fdm, session.principal_id)
        const farmOptions = farms.map((farm) => {
            if (!farm?.b_id_farm || !farm?.b_name_farm) {
                throw new Error("Invalid farm data structure")
            }
            return {
                b_id_farm: farm.b_id_farm,
                b_name_farm: farm.b_name_farm,
            }
        })

        const farm = await getFarm(fdm, session.principal_id, b_id_farm)

        if (!farm) {
            throw data("Farm not found", {
                status: 404,
                statusText: "Farm not found",
            })
        }

        // Get the fields of the farm
        const fields = await getFields(
            fdm,
            session.principal_id,
            b_id_farm,
            timeframe,
        )
        const features = fields.map((field) => {
            const feature = {
                type: "Feature",
                properties: {
                    b_id: field.b_id,
                    b_name: field.b_name,
                    b_area: Math.round(field.b_area * 10) / 10,
                    b_lu_name: field.b_lu_name,
                    b_id_source: field.b_id_source,
                },
                geometry: field.b_geometry,
            }
            return feature
        })

        const featureCollection: FeatureCollection = {
            type: "FeatureCollection",
            features: features,
        }

        // Get the Mapbox token and style
        const mapboxToken = getMapboxToken()
        const mapboxStyle = getMapboxStyle()

        return {
            farmOptions: farmOptions,
            b_id_farm: b_id_farm,
            b_name_farm: farm.b_name_farm,
            featureCollection: featureCollection,
            mapboxToken: mapboxToken,
            mapboxStyle: mapboxStyle,
            fieldsAvailableUrl: process.env.AVAILABLE_FIELDS_URL,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

// Main
export default function Index() {
    const loaderData = useLoaderData<typeof loader>()
    const calendar = useCalendarStore((state) => state.calendar)

    const fieldsSavedId = "fieldsSaved"
    const fieldsSaved = loaderData.featureCollection
    const viewState = getViewState(fieldsSaved)
    const fieldsSavedStyle = getFieldsStyle(fieldsSavedId)

    const fieldsAvailableId = "fieldsAvailable"
    const fieldsAvailableStyle = getFieldsStyle(fieldsAvailableId)

    const [open, setOpen] = useState(false)
    const [selectedField, setSelectedField] = useState<any | null>(null)

    const handleSelectField = (feature: any) => {
        setSelectedField(feature)
        setOpen(true)
    }

    return (
        <SidebarInset>
            <FarmHeader
                farmOptions={loaderData.farmOptions}
                b_id_farm={loaderData.b_id_farm}
                fieldOptions={undefined}
                b_id={undefined}
                action={{
                    to: `/farm/${loaderData.b_id_farm}/${calendar}/field/`,
                    label: "Terug naar percelen",
                }}
            />
            <main>
                <div className="space-y-6 p-10 pb-0">
                    <div className="flex items-center">
                        <div className="space-y-0.5">
                            <h2 className="text-2xl font-bold tracking-tight">
                                Nieuw perceel
                            </h2>
                            <p className="text-muted-foreground">
                                Zoom in en voeg een nieuw perceel toe
                            </p>
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
                                interactiveLayerIds={[
                                    fieldsAvailableId,
                                    fieldsSavedId,
                                ]}
                                onClick={(evt) => {
                                    if (!evt.features) return
                                    const features = evt.features.filter(
                                        (f) => f.source === fieldsAvailableId,
                                    )
                                    if (features.length > 0) {
                                        handleSelectField(features[0])
                                    }
                                }}
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

                                <FieldsSourceNotClickable
                                    id={fieldsSavedId}
                                    fieldsData={fieldsSaved}
                                >
                                    <Layer {...fieldsSavedStyle} />
                                </FieldsSourceNotClickable>

                                <div className="fields-panel grid gap-4 w-[350px]">
                                    <FieldsPanelZoom
                                        zoomLevelFields={ZOOM_LEVEL_FIELDS}
                                    />
                                    <FieldsPanelHover
                                        zoomLevelFields={ZOOM_LEVEL_FIELDS}
                                        layer={fieldsAvailableId}
                                        layerExclude={fieldsSavedId}
                                    />
                                </div>
                            </MapGL>
                        )}
                    </ClientOnly>
                </div>
            </main>
            {selectedField && (
                <FieldDetailsDialog
                    open={open}
                    setOpen={setOpen}
                    field={selectedField}                
                />
            )}
        </SidebarInset>
    )
}

export async function action({ request, params }: ActionFunctionArgs) {
    //todo: implement add field
    throw new Error("Not implemented")
}
