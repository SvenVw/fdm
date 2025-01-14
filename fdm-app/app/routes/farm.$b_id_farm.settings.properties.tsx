import { FormSchema } from "@/components/custom/fertilizer-applications";
import { LoadingSpinner } from "@/components/custom/loadingspinner";
import { Button } from "@/components/ui/button";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fdm } from "@/lib/fdm.server";
import { zodResolver } from "@hookform/resolvers/zod";
import { getFarm } from "@svenvw/fdm-core";
import { useEffect } from "react";
import { Form } from "react-hook-form";
import { data, LoaderFunctionArgs, useLoaderData } from "react-router";
import { RemixFormProvider, useRemixForm } from "remix-hook-form";
import { z } from "zod";

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

export default function FarmSettingsPropertiesBlock() {
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

    useEffect(() => {
        form.reset({
            b_name_farm: loaderData.farm.b_name_farm,
            b_businessid_farm: loaderData.farm.b_businessid_farm ? loaderData.farm.b_businessid_farm : "",
            b_address_farm: loaderData.farm.b_address_farm ? loaderData.farm.b_address_farm : "",
            b_postalcode_farm: loaderData.farm.b_postalcode_farm ? loaderData.farm.b_postalcode_farm : "",
        });
    }, [loaderData])

    return (
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
                                                placeholder="bv. Nieuwe Kanaal 7 
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
    )
}