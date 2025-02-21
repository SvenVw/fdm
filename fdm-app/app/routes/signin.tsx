import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router"
import { redirect } from "react-router"

// Components
import { Button } from "@/components/ui/button"
import { Check, MoveDown } from "lucide-react"

import { signIn } from "@/lib/auth-client"
import { auth } from "@/lib/auth.server"
// Services
import { cn } from "@/lib/utils"

export async function loader({ request }: LoaderFunctionArgs) {
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
}

export default function SignIn() {
    return (
        <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
            <div className="flex h-screen items-center justify-center py-12">
                <div className="mx-auto grid w-[350px] gap-6">
                    <div className="grid gap-2 text-center">
                        {/* <img src="logo.png" alt="Logo FDM"/> */}
                        <h1 className="text-3xl font-bold">FDM</h1>
                        <p className="text-balance text-muted-foreground">
                            Maak een account aan en krijg toegang tot:
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
                    </div>
                    <div
                        className={cn(
                            "w-full gap-2 flex items-center",
                            "justify-between flex-col",
                        )}
                    >
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
                                    console.error(
                                        "Social sign-in failed:",
                                        error,
                                    )
                                }
                            }}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="0.98em"
                                height="1em"
                                viewBox="0 0 256 262"
                            >
                                <path
                                    fill="#4285F4"
                                    d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                                ></path>

                                <path
                                    fill="#34A853"
                                    d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                                ></path>

                                <path
                                    fill="#FBBC05"
                                    d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
                                ></path>

                                <path
                                    fill="#EB4335"
                                    d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                                ></path>
                            </svg>
                            Sign in with Google
                        </Button>
                    </div>
                    <div
                        className={cn(
                            "w-full gap-2 flex items-center",
                            "justify-between flex-col",
                        )}
                    >
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
                                    console.error(
                                        "Social sign-in failed:",
                                        error,
                                    )
                                }
                            }}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="1em"
                                height="1em"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    fill="currentColor"
                                    d="M2 3h9v9H2zm9 19H2v-9h9zM21 3v9h-9V3zm0 19h-9v-9h9z"
                                ></path>
                            </svg>
                            Sign in with Microsoft
                        </Button>
                    </div>
                    <div className="mt-4 text-center text-sm">
                        Door verder te gaan, gaat u akkoord met het{" "}
                        <a href="/privacy" className="underline">
                            Privacybeleid
                        </a>
                    </div>
                    <div className="mb-4 text-center text-sm">
                        <Button variant={"outline"}>
                            Lees meer over FDM <MoveDown />
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
                    className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                />
            </div>
        </div>
    )
}
