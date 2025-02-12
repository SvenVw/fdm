import {
    getMapboxStyle,
    getMapboxToken,
} from "@/components/custom/atlas/atlas-mapbox"
import { FieldsSourceNotClickable } from "@/components/custom/atlas/atlas-sources"
import { getFieldsStyle } from "@/components/custom/atlas/atlas-styles"
import { getViewState } from "@/components/custom/atlas/atlas-viewstate"
import { Combobox } from "@/components/custom/combobox"
import { LoadingSpinner } from "@/components/custom/loadingspinner"
import { Button } from "@/components/ui/button"
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { extractFormValuesFromRequest } from "@/lib/form"
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
import { Layer, Map as MapGL } from "react-map-gl"
import {
    type ActionFunctionArgs,
    type LoaderFunctionArgs,
    type MetaFunction,
    data,
} from "react-router"
import { useLoaderData } from "react-router"
import { RemixFormProvider, useRemixForm } from "remix-hook-form"
import { dataWithError, dataWithSuccess } from "remix-toast"
import { ClientOnly } from "remix-utils/client-only"
import wkx from "wkx"
import { z } from "zod"
import { fdm } from "../lib/fdm.server"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns/format"
import { cn } from "@/lib/utils"
import { nl } from "date-fns/locale/nl"
import { useEffect, useRef } from "react"
import { Form } from "react-hook-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: "FDM App" },
        { name: "description", content: "Welcome to FDM!" },
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
    b_lu_catalogue: z.string({
        required_error: "Hoofdgewas is verplicht",
    }),
    b_sowing_date: z.coerce.date({
        required_error: "Zaaidatum is verplicht",
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
 * Loader function for the field details page.
 * Fetches field data, soil analysis, cultivation options, and geojson data.
 * @param request - The incoming request object.
 * @param params - URL parameters containing `b_id_farm` (farm ID) and `b_id` (field ID).
 * @returns An object containing field details, cultivation options, and mapbox token.
 * Throws an error if farm ID, field ID, or field data is missing.
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
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

    // Get the field data
    const field = await getField(fdm, b_id)
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
        geometry: wkx.Geometry.parse(field.b_geometry).toGeoJSON(),
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
    const b_geojson = wkx.Geometry.parse(field.b_geometry).toGeoJSON()

    // Get soil analysis data
    const soilAnalysis = await getSoilAnalysis(fdm, b_id)

    // Get the available cultivations
    let cultivationOptions = []
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
    } catch (error) {
        console.error("Failed to fetch cultivations:", error)
        throw data("Failed to load cultivation options", {
            status: 500,
            statusText: "Failed to load cultivation options",
        })
    }

    // Get the cultivation
    const cultivations = await getCultivations(fdm, b_id)
    const b_lu_catalogue = cultivations[0]?.b_lu_catalogue

    // Get Mapbox token and Style
    const mapboxToken = getMapboxToken()
    const mapboxStyle = getMapboxStyle()

    return {
        b_id: b_id,
        b_id_farm: b_id_farm,
        b_name: field.b_name,
        b_lu_catalogue: b_lu_catalogue,
        b_sowing_date: cultivations[0]?.b_sowing_date,
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
            b_lu_catalogue: loaderData.b_lu_catalogue ?? "",
            b_sowing_date: loaderData.b_sowing_date ?? undefined,
            b_soiltype_agr: loaderData.b_soiltype_agr ?? undefined,
            b_gwl_class: loaderData.b_gwl_class ?? undefined,
            a_p_al: loaderData.a_p_al ?? undefined,
            a_p_cc: loaderData.a_p_cc ?? undefined,
            a_som_loi: loaderData.a_som_loi ?? undefined,
        },
    })

    return (
        <>
            <div className="flex-1 lg:max-w-3xl">
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
                                        <CardTitle>
                                            Perceel
                                            <p className="text-sm text-muted-foreground">
                                                {Math.round(
                                                    loaderData.b_area * 10,
                                                ) / 10}{" "}
                                                ha
                                            </p>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <FormField
                                            control={form.control}
                                            name="b_name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Naam</FormLabel>
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
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Hoofdgewas</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 items-center gap-4">
                                            <Combobox
                                                options={
                                                    loaderData.cultivationOptions
                                                }
                                                form={form}
                                                name={"b_lu_catalogue"}
                                                label={"Gewasnaam"}
                                                defaultValue={
                                                    loaderData.b_lu_catalogue
                                                }
                                            />

                                            <FormField
                                                control={form.control}
                                                name="b_sowing_date"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-col">
                                                        <FormLabel>
                                                            Zaaidatum
                                                        </FormLabel>
                                                        <Popover>
                                                            <PopoverTrigger
                                                                asChild
                                                            >
                                                                <FormControl>
                                                                    <Button
                                                                        variant={
                                                                            "outline"
                                                                        }
                                                                        className={cn(
                                                                            "w-[240px] pl-3 text-left font-normal",
                                                                            !field.value &&
                                                                                "text-muted-foreground",
                                                                        )}
                                                                    >
                                                                        {field.value ? (
                                                                            format(
                                                                                field.value,
                                                                                "yyyy-MM-dd",
                                                                            )
                                                                        ) : (
                                                                            <span>
                                                                                Kies
                                                                                een
                                                                                datum
                                                                            </span>
                                                                        )}
                                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                    </Button>
                                                                </FormControl>
                                                            </PopoverTrigger>
                                                            <PopoverContent
                                                                className="w-auto p-0"
                                                                align="start"
                                                            >
                                                                <Calendar
                                                                    locale={nl}
                                                                    mode="single"
                                                                    selected={
                                                                        field.value
                                                                    }
                                                                    onSelect={
                                                                        field.onChange
                                                                    }
                                                                    disabled={(
                                                                        date,
                                                                    ) =>
                                                                        date <
                                                                        new Date(
                                                                            "1970-01-01",
                                                                        )
                                                                    }
                                                                    initialFocus
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                        {/* <FormDescription>
                                                        Kan ook poot- of
                                                        aanplantdatum zijn
                                                    </FormDescription> */}
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Bodem</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <aside>
                <ClientOnly
                    fallback={<Skeleton className="h-full w-full rounded-xl" />}
                >
                    {() => (
                        <MapGL
                            {...viewState}
                            style={{
                                height: "100%",
                                width: "100%",
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
        </>
    )
}

/**
 * Action function for updating field details.
 * Handles form submission, updates field data in the database,
 * and manages soil analysis updates.
 * @param request - The incoming request object containing form data.
 * @param params - URL parameters containing `b_id` (field ID) and `b_id_farm` (farm ID).
 * @returns A success or error toast based on the outcome of the update operation.
 * Throws an error if field or farm ID is missing.
 */
export async function action({ request, params }: ActionFunctionArgs) {
    const b_id = params.b_id
    const b_id_farm = params.b_id_farm

    if (!b_id || !b_id_farm) {
        return dataWithError(null, "Missing field or farm ID.")
    }

    try {
        const formValues = await extractFormValuesFromRequest(
            request,
            FormSchema,
        )

        await updateField(
            fdm,
            b_id,
            formValues.b_name,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
        )

        const cultivations = await getCultivations(fdm, b_id)
        if (cultivations && cultivations.length > 0) {
            await updateCultivation(
                fdm,
                cultivations[0].b_lu,
                formValues.b_lu_catalogue,
                formValues.b_sowing_date,
                undefined,
            )
        } else {
            // Handle the case where there are no cultivations found (although there should always be at least one)
            console.error("No existing cultivation found for field ", b_id)
            return dataWithError(
                null,
                "Failed to update cultivation. No cultivation found for field.",
            )
        }

        const currentSoilAnalysis = await getSoilAnalysis(fdm, b_id)
        const soilPropertiesChanged =
            currentSoilAnalysis?.b_soiltype_agr !== formValues.b_soiltype_agr ||
            currentSoilAnalysis?.b_gwl_class !== formValues.b_gwl_class ||
            currentSoilAnalysis?.a_p_al !== formValues.a_p_al ||
            currentSoilAnalysis?.a_p_cc !== formValues.a_p_cc ||
            currentSoilAnalysis?.a_som_loi !== formValues.a_som_loi

        if (soilPropertiesChanged) {
            const currentYear = new Date().getFullYear()
            const defaultDate = new Date(currentYear, 0, 1)
            await addSoilAnalysis(
                fdm,
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
    } catch (error) {
        console.error("Failed to update field:", error)
        return dataWithError(
            null,
            `Er is iets misgegaan bij het bijwerken van het perceel: ${error instanceof Error ? error.message : "Unknown error"}`,
        )
    }
}
