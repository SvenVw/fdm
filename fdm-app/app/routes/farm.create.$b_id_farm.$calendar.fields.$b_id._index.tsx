import { zodResolver } from "@hookform/resolvers/zod"
import {
    getCultivations,
    getCultivationsFromCatalogue,
    getCurrentSoilData,
    getField,
    getSoilParametersDescription,
    updateCultivation,
    updateField,
} from "@svenvw/fdm-core"
import type { FeatureCollection } from "geojson"
import { Plus } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Layer, Map as MapGL } from "react-map-gl"
import { Form } from "react-router"
import {
    type ActionFunctionArgs,
    type LoaderFunctionArgs,
    type MetaFunction,
    NavLink,
    data,
} from "react-router"
import { useLoaderData } from "react-router"
import { RemixFormProvider, useRemixForm } from "remix-hook-form"
import { dataWithSuccess } from "remix-toast"
import { z } from "zod"
import { getMapboxStyle, getMapboxToken } from "~/integrations/mapbox"
import { FieldsSourceNotClickable } from "~/components/custom/atlas/atlas-sources"
import { getFieldsStyle } from "~/components/custom/atlas/atlas-styles"
import { getViewState } from "~/components/custom/atlas/atlas-viewstate"
import { Combobox } from "~/components/custom/combobox"
import { LoadingSpinner } from "~/components/custom/loadingspinner"
import { SoilDataCards } from "~/components/custom/soil/cards"
import { Button } from "~/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "~/components/ui/form"
import { Input } from "~/components/ui/input"
import { Separator } from "~/components/ui/separator"
import { Skeleton } from "~/components/ui/skeleton"
import { getSession } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { handleActionError, handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { extractFormValuesFromRequest } from "~/lib/form"
import { getTimeframe } from "../lib/calendar"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: `${clientConfig.name} App` },
        { name: "description", content: `Welcome to ${clientConfig.name}!` },
    ]
}

// Form Schema
const FormSchema = z.object({
    b_name: z
        .string({
            required_error: "Naam van perceel is verplicht",
        })
        .min(3, {
            message: "Naam van perceel moet minimaal 3 karakters bevatten",
        }),
    b_area: z.coerce.number({
        required_error: "Oppervlakte van perceel is verplicht",
    }),
    b_lu_catalogue: z.string({
        required_error: "Hoofdgewas is verplicht",
    }),
})

/**
 * Retrieves and prepares data for rendering the field details page.
 *
 * This loader validates the presence of the required farm and field IDs extracted from the URL parameters,
 * obtains the session information, and uses it to fetch the associated field data. It constructs a GeoJSON
 * FeatureCollection based on the field's geometry and retrieves additional details such as soil analysis,
 * cultivation options filtered from the catalogue, and Mapbox configuration (token and style).
 *
 * @param request - The incoming HTTP request.
 * @param params - URL parameters with 'b_id_farm' as the farm ID and 'b_id' as the field ID.
 * @returns An object containing field properties, soil analysis, cultivation details, a GeoJSON FeatureCollection,
 *   and Mapbox configuration needed for the field details page.
 * @throws {Error} When required identifiers (farm ID, field ID), field data, or field geometry are missing.
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        // Get the Id of the farm
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

        // Get the session
        const session = await getSession(request)

        const timeframe = await getTimeframe(params)

        // Get the field data
        const field = await getField(fdm, session.principal_id, b_id)
        if (!field) {
            throw data("Field not found", {
                status: 404,
                statusText: "Field not found",
            })
        }
        const feature: GeoJSON.Feature = {
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
        const featureCollection: FeatureCollection = {
            type: "FeatureCollection",
            features: [feature],
        }

        // Get the geojson
        if (!field.b_geometry) {
            throw data("Field geometry is required", {
                status: 400,
                statusText: "Field geometry is required",
            })
        }

        // Get soil analysis data
        const currentSoilData = await getCurrentSoilData(
            fdm,
            session.principal_id,
            b_id,
            timeframe,
        )
        const soilParameterDescription = getSoilParametersDescription()

        // Get the available cultivations
        let cultivationOptions = []
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

        // Get the cultivation
        const cultivations = await getCultivations(
            fdm,
            session.principal_id,
            b_id,
            timeframe,
        )
        const b_lu_catalogue = cultivations[0]?.b_lu_catalogue

        // Get Mapbox token and Style
        const mapboxToken = getMapboxToken()
        const mapboxStyle = getMapboxStyle()

        return {
            b_id: b_id,
            b_id_farm: b_id_farm,
            b_name: field.b_name,
            b_lu_catalogue: b_lu_catalogue,
            b_lu_start: cultivations[0]?.b_lu_start,
            currentSoilData: currentSoilData,
            soilParameterDescription: soilParameterDescription,
            b_area: field.b_area,
            featureCollection: featureCollection,
            cultivationOptions: cultivationOptions,
            mapboxToken: mapboxToken,
            mapboxStyle: mapboxStyle,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

/**
 * Component for displaying and updating field details.
 * Renders a form with field information, including name, crop, soil type, and soil analysis data.
 * @returns The JSX element representing the field details page.
 */
export default function Index() {
    const loaderData = useLoaderData<typeof loader>()
    const viewState = getViewState(loaderData.featureCollection)
    const id = "fieldsSaved"
    const fields = loaderData.featureCollection
    const fieldsSavedStyle = getFieldsStyle(id)

    const form = useRemixForm({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
        defaultValues: {
            b_name: loaderData.b_name ?? "",
            b_area: Math.round(loaderData.b_area * 10) / 10,
            b_lu_catalogue: loaderData.b_lu_catalogue ?? "",
        },
    })

    useEffect(() => {
        form.reset({
            b_name: loaderData.b_name ?? "",
            b_area: Math.round(loaderData.b_area * 10) / 10,
            b_lu_catalogue: loaderData.b_lu_catalogue ?? "",
        })
    }, [loaderData, form.reset])

    //ref to check if map is rendered
    const mapContainerRef = useRef<HTMLDivElement>(null)
    const [mapIsLoaded, setMapIsLoaded] = useState(false)

    useEffect(() => {
        if (mapContainerRef.current) {
            setMapIsLoaded(true)
        }
    }, [])

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-4 gap-6">
                <div className="col-span-2">
                    <RemixFormProvider {...form}>
                        <Form id="formField" method="post">
                            <fieldset disabled={form.formState.isSubmitting}>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Perceel</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4">
                                            <FormField
                                                control={form.control}
                                                name="b_name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Naam
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                type="text"
                                                                required
                                                            />
                                                        </FormControl>
                                                        <FormDescription />
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="b_area"
                                                disabled={true}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Oppervlak (ha)
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                type="text"
                                                                required
                                                            />
                                                        </FormControl>
                                                        <FormDescription />
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <div className="col-span-2 items-center gap-4">
                                                <Combobox
                                                    options={
                                                        loaderData.cultivationOptions
                                                    }
                                                    form={form}
                                                    name={"b_lu_catalogue"}
                                                    label={"Hoofdgewas"}
                                                    defaultValue={
                                                        loaderData.b_lu_catalogue
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <div className="ml-auto">
                                            <Button
                                                type="submit"
                                                disabled={
                                                    form.formState.isSubmitting
                                                }
                                                className="m-auto"
                                            >
                                                {form.formState
                                                    .isSubmitting && (
                                                    <LoadingSpinner />
                                                )}
                                                Bijwerken
                                            </Button>
                                        </div>
                                    </CardFooter>
                                </Card>
                            </fieldset>
                        </Form>
                    </RemixFormProvider>
                </div>
                <div className="col-span-2">
                    <div ref={mapContainerRef} className="h-[300px] w-full">
                        {mapIsLoaded ? (
                            <MapGL
                                {...viewState}
                                style={{
                                    height: "100%",
                                    width: "100%",
                                    borderRadius: "0.75rem",
                                }}
                                interactive={false}
                                mapStyle={loaderData.mapboxStyle}
                                mapboxAccessToken={loaderData.mapboxToken}
                                interactiveLayerIds={[id]}
                            >
                                <FieldsSourceNotClickable
                                    id={id}
                                    fieldsData={fields}
                                >
                                    <Layer {...fieldsSavedStyle} />
                                </FieldsSourceNotClickable>
                            </MapGL>
                        ) : (
                            <Skeleton className="h-full w-full rounded-xl" />
                        )}
                    </div>
                </div>
            </div>
            <div className="col-span-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Bodem</CardTitle>
                        <CardDescription>
                            Voeg een bodemanalyse toe voor dit perceel of bekijk
                            de schatting door NMI.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Button asChild>
                                    <NavLink to="./new_analysis">
                                        <Plus />
                                        Bodemanalyse toevoegen
                                    </NavLink>
                                </Button>
                            </div>

                            <Separator />
                            <div className="">
                                <SoilDataCards
                                    currentSoilData={loaderData.currentSoilData}
                                    soilParameterDescription={
                                        loaderData.soilParameterDescription
                                    }
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

/**
 * Processes the form submission to update field details.
 *
 * This function validates that the necessary URL parameters for the field and farm IDs are present.
 * It extracts form data and session information from the incoming request, updates the field record,
 * and, if applicable, updates the related cultivation data. If the submitted soil properties differ from
 * the existing values, a new soil analysis entry is added.
 *
 * @param request - The HTTP request containing form submission and session data.
 * @param params - An object with URL parameters including the field ID (b_id) and farm ID (b_id_farm).
 * @returns A payload with a success message upon successful update.
 * @throws {Error} If either the field ID or farm ID is missing.
 */
export async function action({ request, params }: ActionFunctionArgs) {
    try {
        const b_id = params.b_id
        if (!b_id) {
            throw new Error("missing: b_id")
        }
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw new Error("missing: b_id_farm")
        }

        // Get the session
        const session = await getSession(request)

        const timeframe = getTimeframe(params)

        const formValues = await extractFormValuesFromRequest(
            request,
            FormSchema,
        )

        await updateField(
            fdm,
            session.principal_id,
            b_id,
            formValues.b_name,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
        )

        const cultivations = await getCultivations(
            fdm,
            session.principal_id,
            b_id,
            timeframe,
        )
        if (cultivations && cultivations.length > 0) {
            await updateCultivation(
                fdm,
                session.principal_id,
                cultivations[0].b_lu,
                formValues.b_lu_catalogue,
                undefined,
                undefined,
            )

            return dataWithSuccess("fields have been updated", {
                message: `${formValues.b_name} is bijgewerkt! 🎉`,
            })
        }
    } catch (error) {
        throw handleActionError(error)
    }
}
