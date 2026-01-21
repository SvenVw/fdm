import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useRemixForm } from "remix-hook-form"
import { dataWithError, redirectWithSuccess } from "remix-toast"
import { FarmTitle } from "~/components/blocks/farm/farm-title"
import { OrganizationSettingsForm } from "~/components/blocks/organization/form"
import { FormSchema } from "~/components/blocks/organization/schema"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { auth, getSession } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { handleActionError, handleLoaderError } from "~/lib/error"
import { extractFormValuesFromRequest } from "~/lib/form"
import type { Route } from "./+types/organization.new"

export const meta: Route.MetaFunction = () => {
    return [
        { title: `Organisatie aanmaken | ${clientConfig.name}` },
        {
            name: "description",
            content: "Voeg een nieuwe organisatie toe.",
        },
    ]
}

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
                        <OrganizationSettingsForm />
                    </CardContent>
                </Card>
            </div>
        </main>
    )
}

export async function action({ request }: Route.ActionArgs) {
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
        try {
            await auth.api.checkOrganizationSlug({
                headers: request.headers,
                body: {
                    slug: slug,
                },
            })
        } catch (e) {
            if ((e as any).body?.code === "SLUG_IS_TAKEN") {
                return dataWithError(
                    null,
                    "Naam voor organisatie is niet meer beschikbaar. Kies een andere naam",
                )
            }

            throw e
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
