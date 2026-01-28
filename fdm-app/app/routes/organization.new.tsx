import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { type ActionFunctionArgs, Form, type MetaFunction } from "react-router"
import { RemixFormProvider, useRemixForm } from "remix-hook-form"
import { dataWithError, redirectWithSuccess } from "remix-toast"
import { z } from "zod"
import { FarmTitle } from "~/components/blocks/farm/farm-title"
import { Button } from "~/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
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
import { Spinner } from "~/components/ui/spinner"
import { Textarea } from "~/components/ui/textarea"
import { auth, getSession } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { handleActionError, handleLoaderError } from "~/lib/error"
import { extractFormValuesFromRequest } from "~/lib/form"

export const meta: MetaFunction = () => {
    return [
        { title: `Organisatie aanmaken | ${clientConfig.name}` },
        {
            name: "description",
            content: "Voeg een nieuwe organisatie toe.",
        },
    ]
}

const FormSchema = z.object({
    name: z
        .string({
            error: (issue) =>
                issue.input === undefined
                    ? "Naam van de organisatie is verplicht"
                    : undefined,
        })
        .min(3, {
            error: "Naam van de organisatie moet minimaal 3 karakters bevatten",
        }),
    slug: z
        .string({
            error: (issue) =>
                issue.input === undefined
                    ? "ID de organisatie is verplicht"
                    : undefined,
        })
        .refine(isValidSlug, {
            error: "ID moet minimaal 3 karakters bevatten, enkel kleine letters, cijfers of '-'",
        }),
    description: z.string({}).optional(),
})

export async function loader() {
    try {
        return {}
    } catch (error) {
        throw handleLoaderError(error)
    }
}

export default function AddOrganizationPage() {
    const form = useRemixForm({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
        defaultValues: {
            name: undefined,
            slug: undefined,
            description: undefined,
        },
    })

    // Function to convert text to a slug
    const convertToSlug = (text: string) => {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9-]+/g, "-") // Replace non-alphanumeric with -
            .replace(/--+/g, "-") // Replace multiple - with single -
            .replace(/^-|-$/g, "") // Trim - from start and end
    }

    // Update slug when name changes
    // biome-ignore lint/correctness/useExhaustiveDependencies: convertToSlug changes on every re-render and should not be used as a hook dependency
    useEffect(() => {
        const subscription = form.watch((value, { name }) => {
            if (name === "name") {
                const slug = convertToSlug(value.name ?? "")
                form.setValue("slug", slug, {
                    shouldDirty: true,
                    shouldValidate: true,
                })
            }
        })
        return () => subscription.unsubscribe()
    }, [form.watch, form.setValue])

    return (
        <main className="container">
            <div className="max-w-3xl mx-auto px-4">
                <div className="mb-8">
                    <FarmTitle
                        title={"Organisatie aanmaken"}
                        description={
                            "Start een organisatie om met anderen samen te werken, gebruikers uit te nodigen en gegevens te delen."
                        }
                    />
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Organisatiegegevens</CardTitle>
                        <CardDescription>
                            Voer de gegevens van je organisatie in.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <RemixFormProvider {...form}>
                            <Form method="post">
                                <fieldset
                                    disabled={form.formState.isSubmitting}
                                >
                                    <div className="space-y-4">
                                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                                            <FormField
                                                control={form.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Naam organisatie
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
                                                name="slug"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            ID organisatie
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                type="text"
                                                                readOnly
                                                                required
                                                                className="text-muted-foreground"
                                                            />
                                                        </FormControl>
                                                        <FormDescription />
                                                        {/* <FormMessage /> */}
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="description"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Beschrijving
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Een korte toelichting op je organisatie zodat andere gebruikers er meer te weten over komen."
                                                            className="resize-none"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormDescription />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <Button
                                            type="submit"
                                            disabled={
                                                form.formState.isSubmitting
                                            }
                                            className="m-auto"
                                        >
                                            {form.formState.isSubmitting && (
                                                <Spinner />
                                            )}
                                            Aanmaken
                                        </Button>
                                    </div>
                                </fieldset>
                            </Form>
                        </RemixFormProvider>
                    </CardContent>
                </Card>
            </div>
        </main>
    )
}

export async function action({ request }: ActionFunctionArgs) {
    try {
        // Get the session
        await getSession(request)

        // Get the form values
        const formValues = await extractFormValuesFromRequest(
            request,
            FormSchema,
        )
        const name = formValues.name
        const slug = formValues.slug
        const description = formValues.description || ""

        // Check if slug is available
        const { status } = await auth.api.checkOrganizationSlug({
            headers: request.headers,
            body: {
                slug: slug,
            },
        })

        if (!status) {
            return dataWithError(
                null,
                "Naam voor organisatie is niet meer beschikbaar. Kies een andere naam",
            )
        }

        // Create the organization
        await auth.api.createOrganization({
            headers: request.headers,
            body: {
                name,
                slug,
                metadata: {
                    description,
                },
            },
        })

        return redirectWithSuccess(`/organization/${formValues.slug}`, {
            message: `Organisatie ${formValues.name} is aangemaakt! 🎉`,
        })
    } catch (error) {
        throw handleActionError(error)
    }
}

function isValidSlug(slug: string): boolean {
    // Slug must be lowercase
    if (slug.toLowerCase() !== slug) {
        return false
    }

    // Slug must be at least 3 characters long
    if (slug.length < 3) {
        return false
    }

    // Slug should only contain lowercase letters, numbers, and hyphens
    return /^[a-z0-9-]+$/.test(slug)
}
