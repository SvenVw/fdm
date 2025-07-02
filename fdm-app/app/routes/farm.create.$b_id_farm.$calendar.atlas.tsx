import {
    addCultivation,
    addField,
    addSoilAnalysis,
    getFarm,
} from "@svenvw/fdm-core"
import type { Feature, GeoJsonProperties, Polygon } from "geojson"
import { useCallback, useState } from "react"
import {
    Layer,
    Map as MapGL,
    type ViewState,
    type ViewStateChangeEvent,
} from "react-map-gl/mapbox"
import {
    type ActionFunctionArgs,
    data,
    type LoaderFunctionArgs,
    type MetaFunction,
    useLoaderData,
} from "react-router"
import { redirectWithSuccess } from "remix-toast"
import { ClientOnly } from "remix-utils/client-only"
import { ZOOM_LEVEL_FIELDS } from "~/components/blocks/atlas/atlas"
import { Controls } from "~/components/blocks/atlas/atlas-controls"
import { generateFeatureClass } from "~/components/blocks/atlas/atlas-functions"
import {
    FieldsPanelHover,
    FieldsPanelSelection,
    FieldsPanelZoom,
} from "~/components/blocks/atlas/atlas-panels"
import {
    FieldsSourceAvailable,
    FieldsSourceSelected,
} from "~/components/blocks/atlas/atlas-sources"
import { getFieldsStyle } from "~/components/blocks/atlas/atlas-styles"
import { getViewState } from "~/components/blocks/atlas/atlas-viewstate"
import { Header } from "~/components/blocks/header/base"
import { HeaderFarmCreate } from "~/components/blocks/header/create-farm"
import { Separator } from "~/components/ui/separator"
import { SidebarInset } from "~/components/ui/sidebar"
import { Skeleton } from "~/components/ui/skeleton"
import { getMapboxStyle, getMapboxToken } from "~/integrations/mapbox"
import { getNmiApiKey, getSoilParameterEstimates } from "~/integrations/nmi"
import { getSession } from "~/lib/auth.server"
import { getCalendar, getTimeframe } from "~/lib/calendar"
import { clientConfig } from "~/lib/config"
import { handleActionError, handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: `Kaart - Bedrijf toevoegen | ${clientConfig.name}` },
        {
            name: "description",
            content:
                "Bekijk en bewerk je percelen op een interactieve kaart. Pas perceelgrenzen aan en bekijk satellietbeelden.",
        },
    ]
}

/**
 * Retrieves farm details and map configurations for rendering the farm map.
 *
 * This loader function extracts the farm ID from route parameters, validates its presence, and uses the current session to fetch the corresponding farm details. It then retrieves the Mapbox token and style configuration, and returns these along with the farm's display name and a URL for available fields. Any errors encountered during processing are transformed using {~link handleLoaderError}.
 *
 * ~throws {Response} When the farm ID is missing, the specified farm is not found, or another error occurs during data retrieval.
 *
 * ~returns An object containing the farm name, Mapbox token, Mapbox style, and the URL for available fields.
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

        const farm = await getFarm(fdm, session.principal_id, b_id_farm)

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
            b_id_farm: farm.b_id_farm,
            b_name_farm: farm.b_name_farm,
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

    const fieldsAvailableId = "fieldsAvailable"
    // const fields = loaderData.savedFields
    const initialViewState = getViewState(null)
    const fieldsAvailableStyle = getFieldsStyle(fieldsAvailableId)

    const [viewState, setViewState] = useState<ViewState>(
        initialViewState as ViewState,
    )

    const onViewportChange = useCallback((event: ViewStateChangeEvent) => {
        setViewState(event.viewState)
    }, [])

    const fieldsSelectedId = "fieldsSelected"
    const fieldsSelectedStyle = getFieldsStyle(fieldsSelectedId)

    // Set selected fields
    const [selectedFieldsData, setSelectedFieldsData] = useState(
        generateFeatureClass(),
    )

    return (
        <SidebarInset>
            <Header action={undefined}>
                <HeaderFarmCreate b_name_farm={loaderData.b_name_farm} />
            </Header>
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
                                    height: "calc(100vh - 64px - 147px)",
                                    width: "100%",
                                }}
                                interactive={true}
                                mapStyle={loaderData.mapboxStyle}
                                mapboxAccessToken={loaderData.mapboxToken}
                                interactiveLayerIds={[
                                    fieldsAvailableId,
                                    fieldsSelectedId,
                                ]}
                                onMove={onViewportChange}
                            >
                                <Controls
                                    onViewportChange={({
                                        longitude,
                                        latitude,
                                        zoom,
                                    }) =>
                                        setViewState((currentViewState) => ({
                                            ...currentViewState,
                                            longitude,
                                            latitude,
                                            zoom,
                                            pitch: currentViewState.pitch,
                                            bearing: currentViewState.bearing,
                                        }))
                                    }
                                />

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

/**
 * Processes form submission for adding fields to a farm.
 *
 * This action extracts selected fields from the incoming form data, validates the presence
 * of the farm identifier, and establishes the user session. It adds each field to the specified farm,
 * creates the corresponding cultivation entry, and conditionally performs soil analysis if an API key is present.
 * Upon successful processing, it redirects to the farm fields page with a success message.
 *
 * ~returns A redirect response to the farm fields page with a success message.
 *
 * ~throws {Error} If the farm identifier is missing or if an operation (such as adding a field, cultivation,
 * or soil analysis) fails.
 */
export async function action({ request, params }: ActionFunctionArgs) {
    try {
        const formData = await request.formData()
        const b_id_farm = params.b_id_farm

        if (!b_id_farm) {
            throw new Error("missing: b_id_farm")
        }

        // Get the session
        const session = await getSession(request)

        // Get timeframe from calendar store
        const calendar = getCalendar(params)
        const timeframe = getTimeframe(params)

        const nmiApiKey = getNmiApiKey()

        const selectedFields = JSON.parse(
            String(formData.get("selected_fields")),
        )

        // Add fields to farm
        await Promise.all(
            selectedFields.features.map(
                async (
                    field: Feature<Polygon, GeoJsonProperties>,
                    index: number,
                ) => {
                    if (!field.properties) {
                        throw new Error("missing: field.properties")
                    }
                    const b_name = `Perceel ${index + 1}`
                    const b_id_source = field.properties.b_id_source
                    const b_lu_catalogue = `nl_${field.properties.b_lu_catalogue}` //TEMPORARY
                    const b_geometry = field.geometry
                    const currentYear = new Date().getFullYear()
                    const defaultDate = timeframe.start
                        ? timeframe.start
                        : `${currentYear}-01-01`
                    const b_start = defaultDate
                    const b_lu_start = defaultDate
                    const b_lu_end = undefined
                    const b_end = undefined
                    const b_acquiring_method = "unknown"

                    const b_id = await addField(
                        fdm,
                        session.principal_id,
                        b_id_farm,
                        b_name,
                        b_id_source,
                        b_geometry,
                        b_start,
                        b_acquiring_method,
                        b_end,
                    )
                    await addCultivation(
                        fdm,
                        session.principal_id,
                        b_lu_catalogue,
                        b_id,
                        b_lu_start,
                        b_lu_end,
                    )

                    if (nmiApiKey) {
                        const estimates = await getSoilParameterEstimates(
                            field,
                            nmiApiKey,
                        )

                        await addSoilAnalysis(
                            fdm,
                            session.principal_id,
                            undefined,
                            estimates.a_source,
                            b_id,
                            estimates.a_depth_lower,
                            undefined,
                            estimates,
                        )
                    }

                    return b_id
                },
            ),
        )

        return redirectWithSuccess(
            `/farm/create/${b_id_farm}/${calendar}/fields`,
            {
                message: "Percelen zijn toegevoegd! 🎉",
            },
        )
    } catch (error) {
        throw handleActionError(error)
    }
}
