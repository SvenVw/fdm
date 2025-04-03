import { getMapboxStyle, getMapboxToken } from "@/app/integrations/mapbox"
import { FieldsSourceNotClickable } from "~/components/custom/atlas/atlas-sources"
import { getFieldsStyle } from "~/components/custom/atlas/atlas-styles"
import { getViewState } from "~/components/custom/atlas/atlas-viewstate"
import { Combobox } from "~/components/custom/combobox"
import { LoadingSpinner } from "~/components/custom/loadingspinner"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "~/components/ui/form"
import { Input } from "~/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"
import { Skeleton } from "~/components/ui/skeleton"
import { getSession } from "~/lib/auth.server"
import { handleActionError, handleLoaderError } from "~/lib/error"
import { extractFormValuesFromRequest } from "~/lib/form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
    addSoilAnalysis,
    getCultivations,
    getCultivationsFromCatalogue,
    getField,
    getSoilAnalysis,
    updateCultivation,
    updateField,
} from "@svenvw/fdm-core"
import type { FeatureCollection } from "geojson"
import { Form } from "react-hook-form"
import { Layer, Map as MapGL } from "react-map-gl"
import {
    type ActionFunctionArgs,
    type LoaderFunctionArgs,
    type MetaFunction,
    data,
} from "react-router"
import { useLoaderData } from "react-router"
import { RemixFormProvider, useRemixForm } from "remix-hook-form"
import { dataWithSuccess } from "remix-toast"
import { ClientOnly } from "remix-utils/client-only"
import { z } from "zod"
import { fdm } from "~/lib/fdm.server"
import { useEffect } from "react"
import { clientConfig } from "~/lib/config"

// Meta
export const meta: MetaFunction = () => {
    return [
        {
            title: `Perceel bewerken - Bedrijf toevoegen | ${clientConfig.name}`,
        },
        {
            name: "description",
            content:
                "Bekijk en bewerk de details van een nieuw toe te voegen perceel, inclusief bodemgegevens en gewassen.",
        },
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
    // b_soiltype_agr: z.enum(fdmSchema.soilTypes, {
    //     errorMap: () => ({ message: "Selecteer een grondsoort uit de lijst" })
    // }),
    // b_gwl_class: z.enum(fdmSchema.gwlClasses, {
    //     errorMap: () => ({ message: "Selecteer een grondwatertrap uit de lijst" })
    // }),
    b_soiltype_agr: z.string({
        required_error: "Grondsoort is verplicht",
    }),
    b_gwl_class: z.string({
        required_error: "Grondwatertrap is verplicht",
    }),
    a_p_al: z.coerce
        .number({
            required_error: "Fosfaat PAL is verplicht",
        })
        .gte(1, {
            message: "Fosfaat PAL moet minimaal 1 zijn",
        })
        .lte(250, {
            message: "Fosfaat PAL mag maximaal 250 zijn",
        }),
    a_p_cc: z.coerce
        .number({
            required_error: "Fosfaat PAE is verplicht",
        })
        .gte(0.1, {
            message: "Fosfaat PAE moet minimaal 0.1 zijn",
        })
        .lte(100, {
            message: "Fosfaat PAE moet mag maximaal 100 zijn",
        }),
    a_som_loi: z.coerce
        .number({
            required_error: "Organische stofgehalte is verplicht",
        })
        .gte(0.5, {
            message: "Organische stofgehalte moet minimaal 0.5 zijn",
        })
        .lte(75, {
            message: "Organische stofgehalte mag maximaal 75 zijn",
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
        const soilAnalysis = await getSoilAnalysis(
            fdm,
            session.principal_id,
            b_id,
        )

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
            b_soiltype_agr: soilAnalysis?.b_soiltype_agr,
            b_gwl_class: soilAnalysis?.b_gwl_class,
            a_p_al: soilAnalysis?.a_p_al,
            a_p_cc: soilAnalysis?.a_p_cc,
            a_som_loi: soilAnalysis?.a_som_loi,
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

    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
        defaultValues: {
            b_name: loaderData.b_name ?? "",
            b_area: Math.round(loaderData.b_area * 10) / 10,
            b_lu_catalogue: loaderData.b_lu_catalogue ?? "",
            b_soiltype_agr: loaderData.b_soiltype_agr ?? undefined,
            b_gwl_class: loaderData.b_gwl_class ?? undefined,
            a_p_al: loaderData.a_p_al ?? undefined,
            a_p_cc: loaderData.a_p_cc ?? undefined,
            a_som_loi: loaderData.a_som_loi ?? undefined,
        },
    })

    useEffect(() => {
        form.reset({
            b_name: loaderData.b_name ?? "",
            b_area: Math.round(loaderData.b_area * 10) / 10,
            b_lu_catalogue: loaderData.b_lu_catalogue ?? "",
            b_soiltype_agr: loaderData.b_soiltype_agr ?? undefined,
            b_gwl_class: loaderData.b_gwl_class ?? undefined,
            a_p_al: loaderData.a_p_al ?? undefined,
            a_p_cc: loaderData.a_p_cc ?? undefined,
            a_som_loi: loaderData.a_som_loi ?? undefined,
        })
    }, [loaderData, form.reset])

    return (
        <div className="grid md:grid-cols-3 gap-4 p-4">
            <div className="w-full md:col-span-2">
                <RemixFormProvider {...form}>
                    <Form
                        id="formField"
                        onSubmit={form.handleSubmit}
                        method="post"
                    >
                        <fieldset disabled={form.formState.isSubmitting}>
                            <div className="space-y-6">
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
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Gewas</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 items-center gap-4">
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
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Bodem</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4">
                                            <FormField
                                                control={form.control}
                                                name="b_soiltype_agr"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Grondsoort
                                                        </FormLabel>
                                                        <Select
                                                            onValueChange={
                                                                field.onChange
                                                            }
                                                            value={field.value}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Selecteer een grondsoort" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="moerige_klei">
                                                                    Moerige klei
                                                                </SelectItem>
                                                                <SelectItem value="rivierklei">
                                                                    Rivierklei
                                                                </SelectItem>
                                                                <SelectItem value="dekzand">
                                                                    Dekzand
                                                                </SelectItem>
                                                                <SelectItem value="zeeklei">
                                                                    Zeeklei
                                                                </SelectItem>
                                                                <SelectItem value="dalgrond">
                                                                    Dalgrond
                                                                </SelectItem>
                                                                <SelectItem value="veen">
                                                                    Veen
                                                                </SelectItem>
                                                                <SelectItem value="loess">
                                                                    Löss
                                                                </SelectItem>
                                                                <SelectItem value="duinzand">
                                                                    Duinzand
                                                                </SelectItem>
                                                                <SelectItem value="maasklei">
                                                                    Maasklei
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormDescription />
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="b_gwl_class"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Grondwatertrap
                                                        </FormLabel>
                                                        <Select
                                                            onValueChange={
                                                                field.onChange
                                                            }
                                                            value={field.value}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Selecteer een grondwatrap" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="-">
                                                                    -
                                                                </SelectItem>
                                                                <SelectItem value="I">
                                                                    Gt I
                                                                </SelectItem>
                                                                <SelectItem value="II">
                                                                    Gt II
                                                                </SelectItem>
                                                                <SelectItem value="IIb">
                                                                    Gt IIb
                                                                </SelectItem>
                                                                <SelectItem value="III">
                                                                    Gt III
                                                                </SelectItem>
                                                                <SelectItem value="IIIa">
                                                                    Gt IIIa
                                                                </SelectItem>
                                                                <SelectItem value="IIIb">
                                                                    Gt IIIb
                                                                </SelectItem>
                                                                <SelectItem value="IV">
                                                                    Gt IV
                                                                </SelectItem>
                                                                <SelectItem value="IVu">
                                                                    Gt IVu
                                                                </SelectItem>
                                                                <SelectItem value="sV">
                                                                    Gt sV
                                                                </SelectItem>
                                                                <SelectItem value="sVb">
                                                                    Gt sVb
                                                                </SelectItem>
                                                                <SelectItem value="V">
                                                                    Gt V
                                                                </SelectItem>
                                                                <SelectItem value="Va">
                                                                    Gt Va
                                                                </SelectItem>
                                                                <SelectItem value="Vb">
                                                                    Gt Vb
                                                                </SelectItem>
                                                                <SelectItem value="sVI">
                                                                    Gt sVI
                                                                </SelectItem>
                                                                <SelectItem value="bVI">
                                                                    Gt bVI
                                                                </SelectItem>
                                                                <SelectItem value="VI">
                                                                    Gt VI
                                                                </SelectItem>
                                                                <SelectItem value="sVII">
                                                                    Gt sVII
                                                                </SelectItem>
                                                                <SelectItem value="bVII">
                                                                    Gt bVII
                                                                </SelectItem>
                                                                <SelectItem value="VII">
                                                                    Gt VII
                                                                </SelectItem>
                                                                <SelectItem value="VIII">
                                                                    Gt VIII
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormDescription />
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="a_p_al"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Fosfaat PAL{" "}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                type="number"
                                                                step="0.01"
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
                                                name="a_p_cc"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Fosfaat PAE{" "}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                type="number"
                                                                step="0.01"
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
                                                name="a_som_loi"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Organische
                                                            stofgehalte{" "}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                type="number"
                                                                step="0.01"
                                                                required
                                                            />
                                                        </FormControl>
                                                        <FormDescription />
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="ml-auto">
                                    <Button
                                        type="submit"
                                        disabled={form.formState.isSubmitting}
                                        className="m-auto"
                                    >
                                        {form.formState.isSubmitting && (
                                            <LoadingSpinner />
                                        )}
                                        Bijwerken
                                    </Button>
                                </div>
                            </div>
                        </fieldset>
                    </Form>
                </RemixFormProvider>
            </div>
            <div className="w-full md:sticky md:top-4">
                <aside className="h-[400px] md:h-[600px] lg:h-[800px] w-full">
                    <ClientOnly
                        fallback={
                            <Skeleton className="h-full w-full rounded-xl" />
                        }
                    >
                        {() => (
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
                        )}
                    </ClientOnly>
                </aside>
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

            const currentSoilAnalysis = await getSoilAnalysis(
                fdm,
                session.principal_id,
                b_id,
            )
            const soilPropertiesChanged =
                currentSoilAnalysis?.b_soiltype_agr !==
                    formValues.b_soiltype_agr ||
                currentSoilAnalysis?.b_gwl_class !== formValues.b_gwl_class ||
                currentSoilAnalysis?.a_p_al !== formValues.a_p_al ||
                currentSoilAnalysis?.a_p_cc !== formValues.a_p_cc ||
                currentSoilAnalysis?.a_som_loi !== formValues.a_som_loi

            if (soilPropertiesChanged) {
                const currentYear = new Date().getFullYear()
                const defaultDate = new Date(currentYear, 0, 1)
                await addSoilAnalysis(
                    fdm,
                    session.principal_id,
                    defaultDate,
                    "user",
                    b_id,
                    30,
                    defaultDate,
                    {
                        a_p_al: formValues.a_p_al,
                        a_p_cc: formValues.a_p_cc,
                        a_som_loi: formValues.a_som_loi,
                        b_soiltype_agr: formValues.b_soiltype_agr,
                        b_gwl_class: formValues.b_gwl_class,
                    },
                )
            }

            return dataWithSuccess("fields have been updated", {
                message: `${formValues.b_name} is bijgewerkt! 🎉`,
            })
        }
    } catch (error) {
        throw handleActionError(error)
    }
}
