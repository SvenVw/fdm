import { ActionFunctionArgs, data, Form, LoaderFunctionArgs, useLoaderData } from "react-router";
import { getFarm} from "@svenvw/fdm-core";
import { fdm } from "@/lib/fdm.server";

// Components
import { Separator } from "@/components/ui/separator";
import { RemixFormProvider, useRemixForm } from "remix-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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

export default function FarmSettingsAccessBlock() {
    const loaderData = useLoaderData<typeof loader>()

    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
        defaultValues: {
           
        },
    })

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Toegang</h3>
                <p className="text-sm text-muted-foreground">
                    Helaas, je hebt geen rechten om de toegang to dit bedrijf te beheren
                </p>
            </div>
            <Separator />
            {/* <div className="flex flex-col space-y-1"> */}
            <RemixFormProvider {...form}>
                <Form id="formFarmAccess" onSubmit={form.handleSubmit} method="POST">
                    <fieldset disabled={form.formState.isSubmitting}>
                        <div className="grid grid-cols-2 w-full items-center gap-4">
                           
                        </div >
                    </fieldset>
                    <br />
                    <div className="ml-auto">
                        {/* <Button
                            type="submit"
                            disabled={form.formState.isSubmitting}
                            className="m-auto"
                        >
                            {form.formState.isSubmitting && <LoadingSpinner />}
                            Bijwerken
                        </Button> */}
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

        return dataWithSuccess(
            `access is updated`,
            { message: `Toegang voor ${formValues.b_name_farm} is bijgewerkt! 🎉` }
        );
    } catch (error) {
        console.error("Failed to update farm:", error);
        return dataWithError(
            null,
            `Er is iets misgegaan bij het bijwerken van de toegang: ${error instanceof Error ? error.message : 'Onbekende fout'}`
        );
    }
}


// Form Schema
const FormSchema = z.object({
})
