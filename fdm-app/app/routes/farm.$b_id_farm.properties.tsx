import { ActionFunctionArgs, data, Form, LoaderFunctionArgs, useLoaderData } from "react-router";
import { getFarm, updateFarm } from "@svenvw/fdm-core";
import { fdm } from "../lib/fdm.server";
import validator from 'validator';
const { isPostalCode } = validator

// Components
import { Separator } from "@/components/ui/separator";
import { RemixFormProvider, useRemixForm } from "remix-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/custom/loadingspinner";
import { dataWithError, dataWithSuccess } from "remix-toast";
import { extractFormValuesFromRequest } from "@/lib/form";

// Blocks

export async function loader({
    request, params
}: LoaderFunctionArgs) {

    // Get the farm id
    const b_id_farm = params.b_id_farm
    if (!b_id_farm) {
        throw data("Farm ID is required", { status: 400, statusText: "Farm ID is required" });
    }

    // Get details of farm
    const farm = await getFarm(fdm, b_id_farm)
    if (!farm) {
        throw data("Farm is not found", { status: 404, statusText: "Farm is not found" });
    }

    // Return user information from loader
    return {
        farm: farm,
    }
}

export default function FarmPropertiesBlock() {
    const loaderData = useLoaderData<typeof loader>()

    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
        defaultValues: {
            b_name_farm: loaderData.farm.b_name_farm,
            b_businessid_farm: loaderData.farm.b_businessid_farm ? loaderData.farm.b_businessid_farm : "",
            b_address_farm: loaderData.farm.b_address_farm ? loaderData.farm.b_address_farm : "",
            b_postalcode_farm: loaderData.farm.b_postalcode_farm ? loaderData.farm.b_postalcode_farm : "",
        },
    })

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Gegevens</h3>
                <p className="text-sm text-muted-foreground">
                    Werk de gegevens bij van dit bedrijf
                </p>
            </div>
            <Separator />
            {/* <div className="flex flex-col space-y-1"> */}
            <RemixFormProvider {...form}>
                <Form id="formFarmProperties" onSubmit={form.handleSubmit} method="POST">
                    <fieldset disabled={form.formState.isSubmitting}>
                        <div className="grid grid-cols-2 w-full items-center gap-4">
                            <div className="flex flex-col space-y-1.5 col-span-2">
                                <FormField
                                    control={form.control}
                                    name="b_name_farm"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bedrijfsnaam</FormLabel>
                                            <FormControl>
                                                <Input placeholder="bv. De Vries V.O.F." {...field} required />
                                            </FormControl>
                                            <FormDescription />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex flex-col space-y-1.5 col-span-1">
                                <FormField
                                    control={form.control}
                                    name="b_businessid_farm"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Kvk nummer</FormLabel>
                                            <FormControl>
                                                <Input placeholder="bv. 9102 1934" {...field} />
                                            </FormControl>
                                            <FormDescription >
                                                Het Kamer van Koophandel nummer waarmee dit bedrijf is ingeschreven
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex flex-col space-y-1.5 col-span-2">
                                <FormField
                                    control={form.control}
                                    name="b_address_farm"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Adres</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Nieuwe Kanaal 7 
Wageningen"
                                                    className="resize-none"
                                                    autoComplete="address"
                                                    rows={3}
                                                    maxLength={300}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription >

                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex flex-col space-y-1.5 col-span-1">
                                <FormField
                                    control={form.control}
                                    name="b_postalcode_farm"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Postcode</FormLabel>
                                            <FormControl>
                                                <Input placeholder="bv. 1234 AB" {...field} autoComplete="postal-code" maxLength={300} />
                                            </FormControl>
                                            <FormDescription />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div >
                    </fieldset>
                    <br />
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

                </Form>
            </RemixFormProvider>
        </div >

    )
}

export async function action({ request, params }: ActionFunctionArgs) {
    const b_id_farm = params.b_id_farm;


    if (!b_id_farm) {
        return dataWithError(null, "Missing farm ID.");
    }

    try {
        const formValues = await extractFormValuesFromRequest(request, FormSchema);

        await updateFarm(
            fdm,
            b_id_farm,
            formValues.b_name_farm,
            formValues.b_businessid_farm,
            formValues.b_address_farm,
            formValues.b_postalcode_farm
        );
       
        return dataWithSuccess(
            `farm is updated`,
            { message: `${formValues.b_name_farm} is bijgewerkt! 🎉` }
        );
    } catch (error) {
        console.error("Failed to update farm:", error);
        return dataWithError(
            null,
            `Er is iets misgegaan bij het bijwerken van de bedriijfgegevens: ${error instanceof Error ? error.message : 'Onbekende fout'}`
        );
    }
}


// Form Schema
const FormSchema = z.object({
    b_name_farm: z.string().min(3, {
        message: "Minimaal 3 karakters",
    }).min(3, {
        message: "Naam van bedrijf moet minimaal 3 karakters bevatten",
    }),
    b_businessid_farm: z.string().optional(),
    b_address_farm: z.string().optional(),
    b_postalcode_farm: z.string().refine(value => isPostalCode(value, 'NL'), {
        message: "Ongeldige postcode",
    }).optional()
})
