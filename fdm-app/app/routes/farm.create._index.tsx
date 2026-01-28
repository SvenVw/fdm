import { zodResolver } from "@hookform/resolvers/zod"
import {
    addDerogation,
    addFarm,
    addFertilizer,
    enableCultivationCatalogue,
    enableFertilizerCatalogue,
    getFertilizersFromCatalogue,
} from "@svenvw/fdm-core"
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
import { Spinner } from "~/components/ui/spinner"
import { Button } from "~/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { Checkbox } from "~/components/ui/checkbox"
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
import { SidebarInset } from "~/components/ui/sidebar"
import { getSession } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { handleActionError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { extractFormValuesFromRequest } from "~/lib/form"
import { getCalendarSelection } from "../lib/calendar"

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
            error: (issue) =>
                issue.input === undefined
                    ? "Naam van bedrijf is verplicht"
                    : undefined,
        })
        .min(3, {
            error: "Naam van bedrijf moet minimaal 3 karakters bevatten",
        }),
    year: z.coerce.number({
        error: (issue) =>
            issue.input === undefined
                ? "Jaar is verplicht"
                : "Jaar moet een getal zijn",
    }),
    has_derogation: z.coerce.boolean().prefault(false),
    derogation_start_year: z.coerce
        .number()
        .min(2006, {
            error: "Startjaar moet minimaal 2006 zijn",
        })
        .max(2025, {
            error: "Startjaar mag maximaal 2025 zijn",
        })
        .optional(),
})

// Loader
export async function loader({ request }: LoaderFunctionArgs) {
    const yearSelection = getCalendarSelection()

    return {
        year: new Date().getFullYear(),
        yearSelection: yearSelection,
    }
}

/**
 * Default component for the Add Farm page.
 * Renders the farm form and passes the validation schema to the Farm component.
 * @returns The JSX element representing the add farm page.
 */
export default function AddFarmPage() {
    const { year, yearSelection } = useLoaderData<typeof loader>()

    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
        defaultValues: {
            b_name_farm: "",
            year: year,
            has_derogation: false,
            derogation_start_year: 2025,
        },
    })

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
                                                <div className="rounded-lg border p-4 space-y-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="has_derogation"
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-row items-center justify-between">
                                                                <div className="space-y-0.5">
                                                                    <FormLabel className="text-base">
                                                                        Derogatie
                                                                    </FormLabel>
                                                                    <FormDescription>
                                                                        Heeft
                                                                        dit
                                                                        bedrijf
                                                                        derogatie?
                                                                    </FormDescription>
                                                                </div>
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={
                                                                            field.value
                                                                        }
                                                                        onCheckedChange={
                                                                            field.onChange
                                                                        }
                                                                    />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                    {form.watch(
                                                        "has_derogation",
                                                    ) && (
                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="derogation_start_year"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem>
                                                                    <FormLabel>
                                                                        Startjaar
                                                                        derogatie
                                                                    </FormLabel>
                                                                    <Select
                                                                        onValueChange={
                                                                            field.onChange
                                                                        }
                                                                        defaultValue={String(
                                                                            field.value,
                                                                        )}
                                                                    >
                                                                        <FormControl>
                                                                            <SelectTrigger>
                                                                                <SelectValue placeholder="Selecteer een jaar" />
                                                                            </SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent>
                                                                            {Array.from(
                                                                                {
                                                                                    length:
                                                                                        2025 -
                                                                                        2006 +
                                                                                        1,
                                                                                },
                                                                                (
                                                                                    _,
                                                                                    i,
                                                                                ) =>
                                                                                    2006 +
                                                                                    i,
                                                                            ).map(
                                                                                (
                                                                                    year,
                                                                                ) => (
                                                                                    <SelectItem
                                                                                        key={
                                                                                            year
                                                                                        }
                                                                                        value={String(
                                                                                            year,
                                                                                        )}
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
                                                    )}
                                                </div>
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
                                                                    {yearSelection.map(
                                                                        (
                                                                            yearOption: string,
                                                                        ) => (
                                                                            <SelectItem
                                                                                key={
                                                                                    yearOption
                                                                                }
                                                                                value={
                                                                                    yearOption
                                                                                }
                                                                            >
                                                                                {
                                                                                    yearOption
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
                                                    <Spinner />
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
        const { b_name_farm, year, has_derogation, derogation_start_year } =
            formValues

        const b_id_farm = await addFarm(
            fdm,
            session.principal_id,
            b_name_farm,
            null,
            null,
            null,
        )
        if (has_derogation && derogation_start_year) {
            const years = Array.from(
                { length: 2025 - derogation_start_year + 1 },
                (_, i) => derogation_start_year + i,
            )
            await Promise.all(
                years.map((year) =>
                    addDerogation(fdm, session.principal_id, b_id_farm, year),
                ),
            )
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
