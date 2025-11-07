/**
 * @file This file provides a page to inform the user that their magic link token is invalid or has expired.
 * @copyright 2023 Batavi
 * @license MIT
 */
import { Cookie } from "lucide-react"
import type { LoaderFunctionArgs, MetaFunction } from "react-router"
import { NavLink, redirect } from "react-router"
import { Button } from "~/components/ui/button"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { auth } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"
export const meta: MetaFunction = () => {
    return [
        { title: `Aanmelden | ${clientConfig.name}` },
        {
            name: "description",
            content: `Meld je aan bij ${clientConfig.name} om toegang te krijgen tot je dashboard en je bedrijfsgegevens te beheren.`,
        },
    ]
}

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
 * Renders a page informing the user that their sign-in token is invalid.
 *
 * This component is displayed when a user tries to use an expired or invalid
 * magic link. It explains why the link might not be valid and provides a
 * button to return to the main sign-in page.
 *
 * @returns The JSX for the invalid token page.
 */
export default function SignIn() {
    const openCookieSettings = () => {
        if (window?.openCookieSettings) {
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
                                <CardTitle>
                                    Aanmeldlink is niet meer geldig
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Helaas is de aanmeldlink niet meer geldig.
                                    De link is slechts 15 minuten geldig en kan
                                    maar één keer gebruikt worden.
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
