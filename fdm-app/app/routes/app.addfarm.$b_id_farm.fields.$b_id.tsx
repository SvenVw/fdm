import { type MetaFunction, type LoaderFunctionArgs, data, Form } from "react-router";
import { useLoaderData } from "react-router";
import { RemixFormProvider, useRemixForm } from "remix-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import wkx from 'wkx'

// Components
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/custom/loadingspinner";
import { FieldMap } from "@/components/blocks/field-map";
import { Input } from "@/components/ui/input";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// FDM
import { fdm } from "../lib/fdm.server";
import { getCultivationsFromCatalogue, getField, fdmSchema, getSoilAnalysis, getCultivation, getCultivations } from "@svenvw/fdm-core";
import { Combobox } from "@/components/custom/combobox";

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: "FDM App" },
        { name: "description", content: "Welcome to FDM!" },
    ];
};

// Form Schema
const FormSchema = z.object({
    b_name: z.string({
        required_error: "Naam van perceel is verplicht",
    }).min(3, {
        message: "Naam van perceel moet minimaal 3 karakters bevatten",
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
    a_p_al: z.coerce.number({
        required_error: "Fosfaat PAL is verplicht",
    }).gte(1, {
        message: "Fosfaat PAL moet minimaal 1 zijn",
    }).lte(250, {
        message: "Fosfaat PAL mag maximaal 250 zijn",
    }),
    a_p_cc: z.coerce.number({
        required_error: "Fosfaat PAE is verplicht",
    }).gte(0.1, {
        message: "Fosfaat PAE moet minimaal 0.1 zijn",
    }).lte(100, {
        message: "Fosfaat PAE moet mag maximaal 100 zijn",
    }),
    a_som_loi: z.coerce.number({
        required_error: "Organische stofgehalte is verplicht",
    }).gte(0.5, {
        message: "Organische stofgehalte moet minimaal 0.5 zijn",
    }).lte(75, {
        message: "Organische stofgehalte mag maximaal 75 zijn",
    })
})

// Loader
export async function loader({
    request, params
}: LoaderFunctionArgs) {

    // Get the Id of the farm
    const b_id_farm = params.b_id_farm
    if (!b_id_farm) {
        throw data("Farm ID is required", { status: 400, statusText: "Farm ID is required" });
    }

    // Get the field id
    const b_id = params.b_id
    if (!b_id) {
        throw data("Field ID is required", { status: 400, statusText: "Field ID is required" });
    }

    // Get the field data
    const field = await getField(fdm, b_id)
    if (!field) {
        throw data("Field not found", { status: 404, statusText: "Field not found" });
    }

    // Get the geojson
    if (!field.b_geometry) {
        throw data("Field geometry is required", { status: 400, statusText: "Field geometry is required" });
    }
    const b_geojson = wkx.Geometry.parse(field.b_geometry).toGeoJSON()

    // Get soil analysis data
    const soilAnalysis = await getSoilAnalysis(fdm, b_id)

    // Get the available cultivations
    let cultivationOptions = [];
    try {
        const cultivationsCatalogue = await getCultivationsFromCatalogue(fdm)
        cultivationOptions = cultivationsCatalogue
            .filter(cultivation => cultivation?.b_lu_catalogue && cultivation?.b_lu_name)
            .map(cultivation => ({
                value: cultivation.b_lu_catalogue,
                label: `${cultivation.b_lu_name} (${cultivation.b_lu_catalogue.split('_')[1]})`
            }));
    } catch (error) {
        console.error('Failed to fetch cultivations:', error);
        throw data(
            'Failed to load cultivation options',
            { status: 500, statusText: 'Failed to load cultivation options' }
        );
    }

    // Get the cultivation
    const cultivations = await getCultivations(fdm, b_id)
    const b_lu_catalogue = cultivations[0]?.b_lu_catalogue

    // Get Mapbox token
    const mapboxToken = String(process.env.MAPBOX_TOKEN)
    if (!mapboxToken) {
        throw data("MAPBOX_TOKEN environment variable is not set", { status: 500, statusText: "MAPBOX_TOKEN environment variable is not set" });
    }

    return {
        b_id: b_id,
        b_id_farm: b_id_farm,
        b_name: field.b_name,
        b_lu_catalogue: b_lu_catalogue,
        b_soiltype_agr: soilAnalysis?.b_soiltype_agr,
        b_gwl_class: soilAnalysis?.b_gwl_class,
        a_p_al: soilAnalysis?.a_p_al,
        a_p_cc: soilAnalysis?.a_p_cc,
        a_som_loi: soilAnalysis?.a_som_loi,
        b_area: field.b_area,
        b_geojson: b_geojson,
        cultivationOptions: cultivationOptions,
        mapboxToken: mapboxToken
    }
}

// Main
export default function Index() {
    const loaderData = useLoaderData<typeof loader>();

    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
        defaultValues: {
            b_name: loaderData.b_name ?? "",
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
                    <Form id="formField" onSubmit={form.handleSubmit} method="POST">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium">{loaderData.b_name}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {Math.round(loaderData.b_area * 10) / 10} ha
                                </p>
                            </div>

                            <fieldset
                                disabled={form.formState.isSubmitting}
                            >
                                <div className="grid grid-cols-2 w-full items-center gap-4">
                                    <div className="flex flex-col space-y-1.5 col-span-2">
                                        <FormField
                                            control={form.control}
                                            name="b_name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Perceelsnaam</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} type="text" required />
                                                    </FormControl>
                                                    <FormDescription />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="flex flex-col space-y-1.5">
                                        <Combobox
                                            options={loaderData.cultivationOptions}
                                            form={form}
                                            name={"b_lu"}
                                            label={"Hoofdgewas"}
                                            defaultValue={loaderData.b_lu_catalogue}
                                        />
                                    </div>
                                    <div className="flex flex-col space-y-1.5">
                                        <FormField
                                            control={form.control}
                                            name="b_soiltype_agr"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Grondsoort</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Selecteer een grondsoort" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="moerige_klei">Moerige klei</SelectItem>
                                                            <SelectItem value="rivierklei">Rivierklei</SelectItem>
                                                            <SelectItem value="dekzand">Dekzand</SelectItem>
                                                            <SelectItem value="zeeklei">Zeeklei</SelectItem>
                                                            <SelectItem value="dalgrond">Dalgrond</SelectItem>
                                                            <SelectItem value="veen">Veen</SelectItem>
                                                            <SelectItem value="loess">Löss</SelectItem>
                                                            <SelectItem value="duinzand">Duinzand</SelectItem>
                                                            <SelectItem value="maasklei">Maasklei</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormDescription />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="flex flex-col space-y-1.5">
                                        <FormField
                                            control={form.control}
                                            name="b_gwl_class"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Grondwatertrap</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Selecteer een grondwatrap" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="-">-</SelectItem>
                                                            <SelectItem value="I">Gt I</SelectItem>
                                                            <SelectItem value="II">Gt II</SelectItem>
                                                            <SelectItem value="IIb">Gt IIb</SelectItem>
                                                            <SelectItem value="III">Gt III</SelectItem>
                                                            <SelectItem value="IIIa">Gt IIIa</SelectItem>
                                                            <SelectItem value="IIIb">Gt IIIb</SelectItem>
                                                            <SelectItem value="IV">Gt IV</SelectItem>
                                                            <SelectItem value="IVu">Gt IVu</SelectItem>
                                                            <SelectItem value="sV">Gt sV</SelectItem>
                                                            <SelectItem value="sVb">Gt sVb</SelectItem>
                                                            <SelectItem value="V">Gt V</SelectItem>
                                                            <SelectItem value="Va">Gt Va</SelectItem>
                                                            <SelectItem value="Vb">Gt Vb</SelectItem>
                                                            <SelectItem value="sVI">Gt sVI</SelectItem>
                                                            <SelectItem value="bVI">Gt bVI</SelectItem>
                                                            <SelectItem value="VI">Gt VI</SelectItem>
                                                            <SelectItem value="sVII">Gt sVII</SelectItem>
                                                            <SelectItem value="bVII">Gt bVII</SelectItem>
                                                            <SelectItem value="VII">Gt VII</SelectItem>
                                                            <SelectItem value="VIII">Gt VIII</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormDescription />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="flex flex-col space-y-1.5">
                                        <FormField
                                            control={form.control}
                                            name="a_p_al"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Fosfaat PAL </FormLabel>
                                                    <FormControl>
                                                        <Input {...field} type="number" step="0.01" required />
                                                    </FormControl>
                                                    <FormDescription />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="flex flex-col space-y-1.5">
                                        <FormField
                                            control={form.control}
                                            name="a_p_cc"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Fosfaat PAE </FormLabel>
                                                    <FormControl>
                                                        <Input {...field} type="number" step="0.01" required />
                                                    </FormControl>
                                                    <FormDescription />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="flex flex-col space-y-1.5">
                                        <FormField
                                            control={form.control}
                                            name="a_som_loi"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Organische stofgehalte </FormLabel>
                                                    <FormControl>
                                                        <Input {...field} type="number" step="0.01" required />
                                                    </FormControl>
                                                    <FormDescription />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </fieldset>
                            <div className="ml-auto">
                                <Button
                                    type="submit"
                                    disabled={form.formState.isSubmitting}
                                    className="m-auto"
                                >
                                    {form.formState.isSubmitting && <LoadingSpinner />}
                                    Bijwerken
                                </Button>
                            </div>
                        </div>
                    </Form>
                </RemixFormProvider>
            </div >
            <aside>
                <FieldMap
                    b_geojson={loaderData.b_geojson}
                    mapboxToken={loaderData.mapboxToken}
                />
            </aside>
        </>
    );
}
