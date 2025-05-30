import { zodResolver } from "@hookform/resolvers/zod"
import { Check, Cookie, Info, MoveDown } from "lucide-react"
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router"
import { Form, NavLink, redirect } from "react-router"
import type { MetaFunction } from "react-router"
import { useSearchParams } from "react-router"
import { RemixFormProvider, useRemixForm } from "remix-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert"
import { Button } from "~/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { signIn } from "~/lib/auth-client"
import { auth } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { handleLoaderError, handleActionError } from "~/lib/error"
import { cn } from "~/lib/utils"
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormMessage,
} from "~/components/ui/form"
import { Input } from "~/components/ui/input"
import { LoadingSpinner } from "~/components/custom/loadingspinner"
import { extractFormValuesFromRequest } from "../lib/form"

export const meta: MetaFunction = () => {
    return [
        { title: `Aanmelden | ${clientConfig.name}` },
        {
            name: "description",
            content: `Meld je aan bij ${clientConfig.name} om toegang te krijgen tot je dashboard en je bedrijfsgegevens te beheren.`,
        },
    ]
}


/**
 * Checks for an existing user session and redirects authenticated users.
 *
 * This asynchronous loader function retrieves the user session from the request headers
 * via the authentication API. If a valid session exists, the function redirects the user
 * to the "/farm" route; otherwise, it returns an empty object. Any errors during session
 * retrieval are processed by {@link handleLoaderError} and thrown.
 *
 * @param request - The HTTP request object whose headers are used to retrieve the session.
 *
 * @returns A redirect response to "/farm" if a session exists, or an empty object otherwise.
 *
 * @throws {Error} If session retrieval fails, the error processed by {@link handleLoaderError} is thrown.
 */
export async function loader({ request }: LoaderFunctionArgs) {
    try {
        // Get the session
        const session = await auth.api.getSession({
            headers: request.headers,
        })

        // If user has an session redirect to app
        if (session?.session) {
            return redirect("/farm")
        }

        // Return user information from loader
        return {}
    } catch (error) {
        throw handleLoaderError(error)
    }
}

/**
 * Renders the invalid token page when a magic link has expired or is invalid.
 *
 * This component displays a message informing the user that their sign-in link is no longer valid,
 * explaining the 5-minute validity and single-use nature of magic links. It provides a button to
 * navigate back to the main sign-in page.
 *
 * @returns A React element representing the invalid token page.
 */
export default function SignIn() {
    const openCookieSettings = () => {
        if (typeof window !== "undefined" && window.openCookieSettings) {
            window.openCookieSettings()
        }
    }
    const onOpenCookieSettings = () => {
        openCookieSettings()
    }

    return (
        <div>
            <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
                <div className="flex h-screen items-center justify-center py-12">
                    <div className="mx-auto grid w-[350px] gap-6">
                        <div className="flex items-center justify-center gap-2">
                            <div className="flex aspect-square size-16 items-center justify-center rounded-lg bg-[#122023]">
                                <img
                                    className="size-12"
                                    src={clientConfig.logomark}
                                    alt={clientConfig.name}
                                />
                            </div>
                            <div className="flex flex-col gap-0.5 leading-none">
                                <span className="font-semibold text-4xl">
                                    {clientConfig.name}
                                </span>
                            </div>
                        </div>


                        <Card>
                            <CardHeader>
                                <CardTitle>Aanmeldlink is niet meer geldig</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Helaas is de aanmeldlink niet meer geldig. De link is slechts 5 minuten geldig en kan maar één keer gebruikt worden.
                                </p>
                            </CardContent>
                            <CardFooter className="flex justify-center">
                                <Button
                                    asChild
                                    variant="default"
                                    className="w-full"
                                >
                                    <NavLink to="/signin">
                                        Terug naar aanmelden
                                    </NavLink>
                                </Button>

                            </CardFooter>
                        </Card>
    
                    </div>
                </div>
                <div className="hidden bg-muted lg:block">
                    <img
                        src="https://images.unsplash.com/photo-1722086853375-8b4d97ca666a?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                        alt='Photo by <a href="https://unsplash.com/@ries_bosch?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Ries Bosch</a> on <a href="https://unsplash.com/photos/a-sheep-is-standing-in-a-grassy-field-jNAsTN4qPu4?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>'
                        width="1920"
                        height="1080"
                        loading="lazy"
                        className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                    />
                </div>
            </div>
            <div className="fixed bottom-3 left-3 z-50">
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs flex items-center gap-1 opacity-70 hover:opacity-100 bg-card/80 hover:bg-card border border-border"
                    onClick={onOpenCookieSettings}
                >
                    <Cookie className="h-3 w-3" />
                    <span>Cookie instellingen</span>
                </Button>
            </div>
        </div>
    )
}
