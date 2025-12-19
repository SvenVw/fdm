import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useRef } from "react"
import { FormProvider } from "react-hook-form"
import { LoaderFunctionArgs, MetaFunction, redirect } from "react-router"
import { Form, useActionData, useLoaderData, useNavigation } from "react-router"
import { useRemixForm } from "remix-hook-form"
import { z } from "zod"
import { AuthCard } from "~/components/blocks/auth/auth-card"
import { AuthCodeField } from "~/components/blocks/auth/auth-code-field"
import { LoadingSpinner } from "~/components/custom/loadingspinner"
import { AuthLayout } from "~/components/blocks/auth/auth-layout"
import { Button } from "~/components/ui/button"
import { auth } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { serverConfig } from "~/lib/config.server"
import { handleLoaderError } from "~/lib/error"
import { extractFormValuesFromRequest } from "../lib/form"
import { FormSchema } from "../components/blocks/auth/auth-formschema"

export const meta: MetaFunction = () => {
    return [
        { title: `Verifieer code | ${clientConfig.name}` },
        {
            name: "description",
            content: `Vul de verificatiecode in om in te loggen bij ${clientConfig.name}.`,
        },
    ]
}

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const url = new URL(request.url)
        const code = url.searchParams.get("code") || ""
        const redirectTo = url.searchParams.get("redirectTo") || "/farm"

        // Check if user is already logged in
        const session = await auth.api.getSession({
            headers: request.headers,
        })
        if (session?.session) {
            return redirect("/farm")
        }

        return { code, redirectTo }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

export default function Verify() {
    const { code, redirectTo } = useLoaderData<typeof loader>()
    const actionData = useActionData<typeof action>()
    const navigation = useNavigation()
    const formRef = useRef<HTMLFormElement>(null)
    const isSubmitting = navigation.state === "submitting"

    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onSubmit",
        resolver: zodResolver(FormSchema),
        defaultValues: {
            code: "", // Start empty for animation
            redirectTo: redirectTo || "/farm",
        },
    })

    const hasAnimated = useRef(false)

    // Typing animation effect
    useEffect(() => {
        if (code && code.length === 8 && !hasAnimated.current) {
            hasAnimated.current = true
            const chars = code.toUpperCase().split("")
            let current = ""
            chars.forEach((char, index) => {
                setTimeout(() => {
                    current += char
                    form.setValue("code", current)
                }, index * 75) // 75ms delay between keystrokes
            })
        }
    }, [code, form])

    return (
        <AuthLayout>
            <AuthCard
                title="Verifieer je code"
                description="Vul de 8-cijferige code in die je per e-mail hebt ontvangen."
            >
                <FormProvider {...form}>
                    <Form
                        onSubmit={form.handleSubmit}
                        method="POST"
                        className="space-y-6"
                    >
                        <input type="hidden" {...form.register("redirectTo")} />
                        
                        <AuthCodeField 
                            control={form.control} 
                            serverError={actionData?.errors?.code} 
                             onComplete={() => {                  
                                // 1s delay so user sees the code is submitted
                                setTimeout(() => {
                                    formRef.current?.requestSubmit()
                                }, 1000)
                            }}
                        />

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <div className="flex items-center space-x-2">
                                    <LoadingSpinner />
                                    <span>Verifiëren...</span>
                                </div>
                            ) : (
                                "Verifiëren en aanmelden"
                            )}
                        </Button>
                    </Form>
                </FormProvider>
            </AuthCard>
        </AuthLayout>
    )
}


export async function action({ request }: LoaderFunctionArgs) {
    const formValues = await extractFormValuesFromRequest(request, FormSchema)
    const { code, redirectTo = "/farm" } = formValues

    try {
        // Construct a synthetic request to the better-auth verification endpoint
        // This triggers the full better-auth pipeline, including rate limiting
        const verifyUrl = new URL(
            "/api/auth/magic-link/verify",
            serverConfig.url,
        )
        verifyUrl.searchParams.set("token", code)
        verifyUrl.searchParams.set("callbackURL", redirectTo)

        const authRequest = new Request(verifyUrl, {
            method: "GET",
            headers: request.headers,
        })

        const response = await auth.handler(authRequest)

        if (response.status === 429) {
            return {
                errors: {
                    code: "Te veel pogingen. Probeer het later opnieuw.",
                },
            }
        }

        if (!response.ok) {
            try {
                const data = await response.clone().json()
                if (data?.error) {
                    return {
                        errors: {
                            code: "Deze code is niet geldig of is verlopen. Vraag een nieuwe code aan.",
                        },
                    }
                }
            } catch {
                console.error("Error parsing JSON")
            }
        }

        // Check if it's a redirect to an error page or back to signin with error
        // better-auth might redirect to /signin?error=... or /error?error=...
        if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get("Location")
            if (location) {
                const locationUrl = new URL(location, serverConfig.url)
                const error = locationUrl.searchParams.get("error")
                
                // If there is an error param, or if it redirects to /signin (which implies failure if we expected success)
                // Note: Success also redirects (to callbackURL), so we must distinguish.
                // We passed callbackURL as redirectTo.
                // If location matches redirectTo, it's success.
                // If location matches /signin or /error, it's failure.                
                if (error || locationUrl.pathname.includes("/error") || (locationUrl.pathname.includes("/signin") && locationUrl.searchParams.has("error"))) {
                     return {
                        errors: {
                            code: "Deze code is niet geldig of is verlopen. Vraag een nieuwe code aan.",
                        },
                    }
                }
            }
        }

        // If success (usually a redirect to callbackURL with set-cookie)
        // We just return the response to the browser
        return response

    } catch (error) {
        console.error("Verification error:", error)
        return {
            errors: {
                code: "Er is iets misgegaan. Probeer het opnieuw of vraag een nieuwe code aan.",
            },
        }
    }
}