import { Check, Cookie, Info, MoveDown } from "lucide-react"
import type { LoaderFunctionArgs } from "react-router"
import { redirect } from "react-router"
import type { MetaFunction } from "react-router"
import { toast } from "sonner"
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
import { handleLoaderError } from "~/lib/error"
import { cn } from "~/lib/utils"

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
 * Renders the sign-in page with social authentication options.
 *
 * This component displays a structured interface for user sign-in. It provides social sign-in buttons for Microsoft and Google,
 * along with information about service benefits and a link to the privacy policy. If a social sign-in attempt fails, a toast notification
 * is displayed and the error is logged to the console.
 *
 * @returns A React element representing the sign-in page.
 */
export default function SignIn() {
    const handleSignInError = (provider: string, error: unknown) => {
        toast(
            `Er is helaas iets misgegaan bij het aanmelden met ${provider}. Probeer het opnieuw.`,
        )
        console.error("Social sign-in failed:", error)
    }
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
                        {/* End logo and title fix */}
                        <p className="text-center text-muted-foreground">
                            {`Maak een account aan bij ${clientConfig.name} en krijg toegang tot:`}
                        </p>
                        <div className="space-y-5">
                            <div>
                                <div
                                    key="nutrientenbalans"
                                    className="mb-4 grid grid-cols-[25px_1fr] space-x-2 items-start pb-4 last:mb-0 last:pb-0"
                                >
                                    <span>
                                        <Check />{" "}
                                    </span>
                                    <div className="space-y-1">
                                        <p className="text-sm text-left font-medium leading-none">
                                            Nutriëntenbalans
                                        </p>
                                        <p className="text-sm text-left text-muted-foreground">
                                            Aanvoer en afvoer van nutriënten op
                                            bedrijfsniveau
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div
                                    key="osbalans"
                                    className="mb-4 grid grid-cols-[25px_1fr] space-x-2 items-start pb-4 last:mb-0 last:pb-0"
                                >
                                    <span>
                                        <Check />{" "}
                                    </span>
                                    <div className="space-y-1">
                                        <p className="text-sm text-left font-medium leading-none">
                                            OS Balans
                                        </p>
                                        <p className="text-sm text-left text-muted-foreground">
                                            Opbouw van organische stof per
                                            perceel
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div
                                    key="baat"
                                    className="mb-4 grid grid-cols-[25px_1fr] space-x-2 items-start pb-4 last:mb-0 last:pb-0"
                                >
                                    <span>
                                        <Check />{" "}
                                    </span>
                                    <div className="space-y-1">
                                        <p className="text-sm text-left font-medium leading-none">
                                            Meststofkeuzeadviestool
                                        </p>
                                        <p className="text-sm text-left text-muted-foreground">
                                            Integraal bemestingsadvies dat
                                            rekening houdt met productie en
                                            milieu
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Alert className="mb-4">
                            <Info className="h-4 w-4" />
                            <AlertTitle>
                                <p className="text-sm text-left font-medium leading-none">
                                    Let op!
                                </p>
                            </AlertTitle>
                            <AlertDescription>
                                <p className="text-sm text-left text-muted-foreground">
                                    {`${clientConfig.name} is nog in ontwikkeling. Functionaliteiten
                                kunnen nog ontbreken of veranderen.`}
                                </p>
                            </AlertDescription>
                        </Alert>
                        <Card>
                            <CardHeader>
                                <CardTitle>Aanmelden</CardTitle>
                                <CardDescription>
                                    Kies een van de onderstaande opties om aan
                                    te melden.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid w-full items-center gap-4">
                                    <div className="flex flex-col space-y-1.5">
                                        <Button
                                            variant={"outline"}
                                            className={cn("w-full gap-2")}
                                            onClick={async () => {
                                                try {
                                                    await signIn.social({
                                                        provider: "microsoft",
                                                        callbackURL: "/farm",
                                                    })
                                                } catch (error) {
                                                    handleSignInError(
                                                        "Microsoft",
                                                        error,
                                                    )
                                                }
                                            }}
                                        >
                                            <svg
                                                role="img"
                                                aria-label="Microsoft logo"
                                                width="1024"
                                                height="1024"
                                                viewBox="0 0 1024 1024"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    d="M44.522 44.5217H489.739V489.739H44.522V44.5217Z"
                                                    fill="#F35325"
                                                />
                                                <path
                                                    d="M534.261 44.5217H979.478V489.739H534.261V44.5217Z"
                                                    fill="#81BC06"
                                                />
                                                <path
                                                    d="M44.522 534.261H489.739V979.478H44.522V534.261Z"
                                                    fill="#05A6F0"
                                                />
                                                <path
                                                    d="M534.261 534.261H979.478V979.478H534.261V534.261Z"
                                                    fill="#FFBA08"
                                                />
                                            </svg>
                                            Aanmelden met Microsoft
                                        </Button>
                                    </div>
                                    <div className="flex flex-col space-y-1.5">
                                        <Button
                                            variant={"outline"}
                                            className={cn("w-full gap-2")}
                                            onClick={async () => {
                                                try {
                                                    await signIn.social({
                                                        provider: "google",
                                                        callbackURL: "/farm",
                                                    })
                                                } catch (error) {
                                                    handleSignInError(
                                                        "Google",
                                                        error,
                                                    )
                                                }
                                            }}
                                        >
                                            <svg
                                                role="img"
                                                aria-label="Google logo"
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="0.98em"
                                                height="1em"
                                                viewBox="0 0 256 262"
                                            >
                                                <path
                                                    fill="#4285F4"
                                                    d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                                                />

                                                <path
                                                    fill="#34A853"
                                                    d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                                                />

                                                <path
                                                    fill="#FBBC05"
                                                    d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
                                                />

                                                <path
                                                    fill="#EB4335"
                                                    d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                                                />
                                            </svg>
                                            Aanmelden met Google
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-center">
                                <p className="text-sm font-medium text-muted-foreground text-center">
                                    Door verder te gaan, gaat u akkoord met het{" "}
                                    <a
                                        href="/privacy"
                                        aria-label="Lees ons privacybeleid"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    >
                                        Privacybeleid
                                    </a>
                                </p>
                            </CardFooter>
                        </Card>
                        <div className="mb-4 text-center text-sm">
                            <Button variant={"outline"}>
                                {`Lees meer over ${clientConfig.name}`} <MoveDown />
                            </Button>
                        </div>
                    </div>
                    
                </div>
                <div className="hidden bg-muted lg:block">
                    <img
                        src="https://images.unsplash.com/photo-1717702576954-c07131c54169?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                        alt=""
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
    );
}
