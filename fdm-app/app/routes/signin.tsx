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
                        <h1 className="text-3xl font-bold">MINAS2</h1>
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
                            variant={"default"}
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
                                width="1em"
                                height="1em"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    fill="currentColor"
                                    d="M11.99 13.9v-3.72h9.36c.14.63.25 1.22.25 2.05c0 5.71-3.83 9.77-9.6 9.77c-5.52 0-10-4.48-10-10S6.48 2 12 2c2.7 0 4.96.99 6.69 2.61l-2.84 2.76c-.72-.68-1.98-1.48-3.85-1.48c-3.31 0-6.01 2.75-6.01 6.12s2.7 6.12 6.01 6.12c3.83 0 5.24-2.65 5.5-4.22h-5.51z"
                                />
                            </svg>
                            Sign in with Google
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
                            Lees meer over MINAS2 <MoveDown />
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
