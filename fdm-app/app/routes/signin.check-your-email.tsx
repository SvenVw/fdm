import { Cookie } from "lucide-react"
import type { LoaderFunctionArgs, MetaFunction } from "react-router"
import { NavLink, redirect } from "react-router"
import { Button } from "~/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
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
 * Renders the sign-in page, informing the user to check their email.
 *
 * This component displays a message to the user confirming that a temporary sign-in link has been sent to their email address.
 * It also provides a brief explanation about the link's validity and a button to navigate back to the main sign-in page.
 *
 * @returns A React element representing the sign-in page.
 */
export default function SignIn() {
    // Function to open cookie settings if available in the window object
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
                                <CardTitle>
                                    Controleer je e-mail inbox
                                </CardTitle>
                                <CardDescription>
                                    Een tijdelijke aanmeldlink is naar je
                                    e-mailadres gestuurd.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    De aanmeldlink is 5 minuten geldig en kan
                                    maar één keer worden gebruikt.
                                </p>
                            </CardContent>
                            <CardFooter className="flex justify-center">
                                <Button
                                    asChild
                                    variant="secondary"
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
                        src="https://images.unsplash.com/photo-1662127245625-a72f1ad7e6ca?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                        alt='Photo by <a href="https://unsplash.com/@datingjungle?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Datingjungle</a> on <a href="https://unsplash.com/photos/a-river-running-through-a-green-landscape-IXYb976ga5E?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>'
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
