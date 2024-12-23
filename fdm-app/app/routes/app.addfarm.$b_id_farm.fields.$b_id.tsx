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
import { getCultivationsFromCatalogue, getField } from "@svenvw/fdm-core";
import { Combobox } from "@/components/custom/combobox";

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: "FDM App" },
        { name: "description", content: "Welcome to FDM!" },
    ];
};

// Form Schema
const soilTypeOptions = ['moerige_klei', 'rivierklei', 'dekzand', 'zeeklei', 'dalgrond', 'veen', 'loess', 'duinzand', 'maasklei']
const gwlClassOptions = ['II', 'IV', 'IIIb', 'V', 'VI', 'VII', 'Vb', '-|', 'Va', 'III', 'VIII', 'sVI', 'I', 'IIb', 'sVII', 'IVu', 'bVII', 'sV', 'sVb', 'bVI', 'IIIa']
const FormSchema = z.object({
    b_name: z.string({
        required_error: "Naam van perceel is verplicht",
    }).min(3, {
        message: "Naam van perceel moet minimaal 3 karakters bevatten",
    }),
    b_soiltype_agr: z.enum(soilTypeOptions, {
        errorMap: () => ({ message: "Selecteer een grondsoort uit de lijst" })
    }),
    b_gwl_class: z.enum(gwlClassOptions, {
        errorMap: () => ({ message: "Selecteer een grondwatertrap uit de lijst" })
    }),
    a_p_al: z.number({
        required_error: "Fosfaat PAL is verplicht",
    }).gte(1, {
        message: "Fosfaat PAL moet minimaal 1 zijn",
    }).lte(250, {
        message: "Fosfaat PAL mag maximaal 250 zijn",
    }),
    a_p_cc: z.number({
        required_error: "Fosfaat PAE is verplicht",
    }).gte(0.1, {
        message: "Fosfaat PAE moet minimaal 0.1 zijn",
    }).lte(100, {
        message: "Fosfaat PAE moet mag maximaal 100 zijn",
    }),
    a_som_loi: z.number({
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
    // console.log(b_geojson)

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

    // Get Mapbox token
    const mapboxToken = String(process.env.MAPBOX_TOKEN)
    if (!mapboxToken) {
        throw data("MAPBOX_TOKEN environment variable is not set", { status: 500, statusText: "MAPBOX_TOKEN environment variable is not set" });
    }

    return {
        b_id: b_id,
        b_id_farm: b_id_farm,
        b_name: field.b_name,
        b_soiltype_agr: field.b_soiltype_agr,
        b_gwl_class: field.b_gwl_class,
        a_p_al: field.a_p_al,
        a_p_cc: field.a_p_cc,
        a_som_loi: field.a_som_loi,
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
            b_soiltype_agr: loaderData.b_soiltype_agr ?? "",
            b_gwl_class: loaderData.b_gwl_class ?? "",
            a_p_al: loaderData.a_p_al ?? "",
            a_p_cc: loaderData.a_p_cc ?? "",
            a_som_loi: loaderData.a_som_loi ?? "",
        },
    })

    return (
        <>
            <div className="flex-1 lg:max-w-3xl">
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-medium">{loaderData.b_name}</h3>
                        <p className="text-sm text-muted-foreground">
                            {Math.round(loaderData.b_area * 10) / 10} ha
                        </p>
                    </div>

                    <RemixFormProvider {...form}>
                        <Form id="formField" onSubmit={form.handleSubmit} method="POST">
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

                                        />
                                    </div>
                                    <div className="flex flex-col space-y-1.5">
                                        <FormField
                                            control={form.control}
                                            name="b_soiltype_agr"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Grondsoort</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Selecteer een grondsoort" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="moerige_klei">Moerige klei</SelectItem>
                                                            <SelectItem value="rivierklei">Rivierklei</SelectItem>
                                                            <SelectItem value="dekzand">Dekzand</SelectItem>
                                                            <SelectItem value="zeeklei|">Zeeklei</SelectItem>
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
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                            name="a_p_wa"
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
                        </Form>
                    </RemixFormProvider>
                </div>
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
