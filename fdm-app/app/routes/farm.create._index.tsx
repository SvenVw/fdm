import { zodResolver } from "@hookform/resolvers/zod"
import {
    addFarm,
    addDerogation,
    addFertilizer,
    enableCultivationCatalogue,
    enableFertilizerCatalogue,
    getFertilizersFromCatalogue,
} from "@svenvw/fdm-core";
import type {
    ActionFunctionArgs,
    LoaderFunctionArgs,
    MetaFunction,
} from "react-router"
import { Form, useLoaderData } from "react-router"
import { RemixFormProvider, useRemixForm } from "remix-hook-form"
import { redirectWithSuccess } from "remix-toast"
import { z } from "zod"
import { Header } from "~/components/blocks/header/base"
import { HeaderFarmCreate } from "~/components/blocks/header/create-farm"
import { LoadingSpinner } from "~/components/custom/loadingspinner"
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
import { Checkbox } from "~/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"
import { SidebarInset } from "~/components/ui/sidebar"
import { getSession } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { handleActionError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { extractFormValuesFromRequest } from "~/lib/form"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: `Bedrijf toevoegen | ${clientConfig.name}` },
        {
            name: "description",
            content: "Voeg een nieuw bedrijf toe.",
        },
    ]
}

const FormSchema = z.object({
    b_name_farm: z
        .string({
            required_error: "Naam van bedrijf is verplicht",
        })
        .min(3, {
            message: "Naam van bedrijf moet minimaal 3 karakters bevatten",
        }),
    year: z.coerce.number({
        required_error: "Jaar is verplicht",
        invalid_type_error: "Jaar moet een getal zijn",
    }),
    has_derogation: z.boolean().default(false),
    derogation_start_year: z.number().optional(),

// Loader
export async function loader({ request }: LoaderFunctionArgs) {
    return {
        b_name_farm: null,
        year: new Date().getFullYear(),
    }
}

/**
 * Default component for the Add Farm page.
 * Renders the farm form and passes the validation schema to the Farm component.
 * @returns The JSX element representing the add farm page.
 */
export default function AddFarmPage() {
    const loaderData = useLoaderData<typeof loader>()

    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
        defaultValues: {
            b_name_farm: loaderData.b_name_farm ?? "",
            year: loaderData.year,
        },
    })

    const currentYear = new Date().getFullYear()
    const years = Array.from(
        { length: currentYear - 2020 + 1 },
        (_, i) => currentYear - i,
    )

    return (
        <SidebarInset>
            <Header action={undefined}>
                <HeaderFarmCreate b_name_farm={undefined} />
            </Header>
            <main>
                <div className="flex h-screen items-center justify-center">
                    <Card className="w-[350px]">
                        <RemixFormProvider {...form}>
                            <Form
                                id="formFarm"
                                onSubmit={form.handleSubmit}
                                method="POST"
                            >
                                <fieldset
                                    disabled={form.formState.isSubmitting}
                                >
                                    <CardHeader>
                                        <CardTitle>Bedrijf</CardTitle>
                                        <CardDescription>
                                            Wat voor soort bedrijf heb je?
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid w-full items-center gap-4">
                                            <div className="flex flex-col space-y-1.5">
                                                <FormField
                                                    control={form.control}
                                                    name="b_name_farm"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Bedrijfsnaam                                                             
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Bv. Jansen V.O.F."
                                                                    aria-required="true"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormDescription />
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="has_derogation"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                            <div className="space-y-0.5">
                                                                <FormLabel className="text-base">
                                                                    Derogatie
                                                                </FormLabel>
                                                                <FormDescription>
                                                                    Heeft dit bedrijf derogatie?
                                                                </FormDescription>
                                                            </div>
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value}
                                                                    onCheckedChange={field.onChange}
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                                {form.watch("has_derogation") && (
                                                    <FormField
                                                        control={form.control}
                                                        name="derogation_start_year"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Startjaar derogatie</FormLabel>
                                                                <Select onValueChange={field.onChange} defaultValue={String(new Date().getFullYear())}>
                                                                    <FormControl>
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder="Selecteer een jaar" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        {Array.from({ length: 2025 - 2006 + 1 }, (_, i) => 2006 + i).map(year => (
                                                                            <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                )}
                                            </div>
                                            <div className="flex flex-col space-y-1.5">
                                                <FormField
                                                    control={form.control}
                                                    name="year"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Voor welk jaar
                                                                wil je percelen
                                                                invullen
                                                            </FormLabel>
                                                            <Select
                                                                onValueChange={
                                                                    field.onChange
                                                                }
                                                                defaultValue={field.value.toString()}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Selecteer een jaar" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {years.map(
                                                                        (
                                                                            year,
                                                                        ) => (
                                                                            <SelectItem
                                                                                key={
                                                                                    year
                                                                                }
                                                                                value={year.toString()}
                                                                            >
                                                                                {
                                                                                    year
                                                                                }
                                                                            </SelectItem>
                                                                        ),
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-between">
                                        <Button
                                            variant="outline"
                                            type="button"
                                            onClick={() =>
                                                window.history.back()
                                            }
                                        >
                                            Terug
                                        </Button>
                                        <Button type="submit">
                                            {form.formState.isSubmitting ? (
                                                <div className="flex items-center space-x-2">
                                                    <LoadingSpinner />
                                                    <span>Opslaan...</span>
                                                </div>
                                            ) : (
                                                "Volgende"
                                            )}
                                        </Button>
                                    </CardFooter>
                                </fieldset>
                            </Form>
                        </RemixFormProvider>
                    </Card>
                </div>
            </main>
        </SidebarInset>
    )
}

/**
 * Handles the submission of the add farm form by creating a new farm and attaching default fertilizers.
 *
 * This function retrieves the user session from the request, extracts and validates form data using a predefined schema,
 * and creates a new farm with the provided name. It then fetches available fertilizers from a catalogue and associates them
 * with the newly created farm. On success, it returns a redirect response to the farm's atlas page with a confirmation message.
 *
 * @param request - The incoming request containing form data and session details.
 * @returns A redirect response to the newly created farm's atlas page.
 * @throws {Error} Throws an error if the form processing, farm creation, or fertilizer attachment fails.
 */
export async function action({ request }: ActionFunctionArgs) {
    try {
        // Get the session
        const session = await getSession(request)

        const formValues = await extractFormValuesFromRequest(
            request,
            FormSchema,
        )
        const { b_name_farm, has_derogation, derogation_start_year } = formValues;
        const { b_name_farm, year } = formValues

        const b_id_farm = await addFarm(
            fdm,
            session.principal_id,
            b_name_farm,
            null,
            null,
            null,
        );

        if (has_derogation && derogation_start_year) {
            for (let year = derogation_start_year; year <= 2025; year++) {
                await addDerogation(fdm, session.principal_id, b_id_farm, year);
            }
        }
        await enableFertilizerCatalogue(
            fdm,
            session.principal_id,
            b_id_farm,
            "baat",
        )
        // Enable catalogue with custom user fertilizers
        await enableFertilizerCatalogue(
            fdm,
            session.principal_id,
            b_id_farm,
            b_id_farm,
        )
        await enableCultivationCatalogue(
            fdm,
            session.principal_id,
            b_id_farm,
            "brp",
        )
        const fertilizers = await getFertilizersFromCatalogue(
            fdm,
            session.principal_id,
            b_id_farm,
        )
        await Promise.all(
            fertilizers.map((fertilizer) =>
                addFertilizer(
                    fdm,
                    session.principal_id,
                    fertilizer.p_id_catalogue,
                    b_id_farm,
                    null,
                    null,
                ),
            ),
        )

        return redirectWithSuccess(`./${b_id_farm}/${year}`, {
            message: "Bedrijf is toegevoegd! 🎉 Selecteer nu de importmethode.",
        })
    } catch (error) {
        throw handleActionError(error)
    }
}
