import { zodResolver } from "@hookform/resolvers/zod"
import {
    type ActionFunctionArgs,
    Form,
    type LoaderFunctionArgs,
    type MetaFunction,
} from "react-router"
import { dataWithError, redirectWithSuccess } from "remix-toast"
import { z } from "zod"
import { useRemixForm, RemixFormProvider } from "remix-hook-form"
import { LoadingSpinner } from "~/components/custom/loadingspinner"
import { Button } from "~/components/ui/button"
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "~/components/ui/form"
import { Input } from "~/components/ui/input"
import { getSession } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { handleActionError, handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { SidebarTrigger } from "../components/ui/sidebar"
import { Separator } from "../components/ui/separator"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "~/components/ui/breadcrumb"
import { FarmTitle } from "~/components/custom/farm/farm-title"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { useEffect } from "react"
import { Textarea } from "~/components/ui/textarea"
import { extractFormValuesFromRequest } from "~/lib/form"
import {
    checkOrganizationSlugForAvailability,
    createOrganization,
} from "@svenvw/fdm-core"

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
            required_error: "Naam van de organisatie is verplicht",
        })
        .min(3, {
            message:
                "Naam van de organisatie moet minimaal 3 karakters bevatten",
        }),
    slug: z
        .string({
            required_error: "ID de organisatie is verplicht",
        })
        .refine(isValidSlug, {
            message:
                "ID moet minimaal 3 karakters bevatten, enkel kleine letters, cijfers of '-'",
        }),
    description: z.string({}).optional(),
})

export async function loader({ request }: LoaderFunctionArgs) {
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
                const slug = convertToSlug(value.name)
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
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink href="/organization">
                                Organisaties
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink href="/organization">
                                Nieuw
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>
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
                                                <LoadingSpinner />
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
        const session = await getSession(request)
        const user_id = session.user.id

        // Get the form values
        const formValues = await extractFormValuesFromRequest(
            request,
            FormSchema,
        )
        const name = formValues.name
        const slug = formValues.slug
        const description = formValues.description || ""

        // Check if slug is available
        const slugIsAvailable = await checkOrganizationSlugForAvailability(
            fdm,
            slug,
        )
        if (!slugIsAvailable) {
            return dataWithError(
                null,
                "Naam voor organisatie is niet meer beschikbaar. Kies een andere naam",
            )
        }

        // Create the organization
        await createOrganization(fdm, user_id, name, slug, description)

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
