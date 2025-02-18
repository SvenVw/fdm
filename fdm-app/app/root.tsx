import { Toaster } from "@/components/ui/sonner"
import { useEffect, useState } from "react"
import {
    Links,
    Meta,
    NavLink,
    Outlet,
    Scripts,
    ScrollRestoration,
    data,
    isRouteErrorResponse,
    useLoaderData,
} from "react-router"
import type { LinksFunction, LoaderFunctionArgs } from "react-router"
import { getToast } from "remix-toast"
import { toast as notify } from "sonner"

import mapBoxStyle from "mapbox-gl/dist/mapbox-gl.css?url"
import styles from "~/tailwind.css?url"
import type { Route } from "./+types/root"
import { Button } from "./components/ui/button"
import { AlertCircle, Copy, Home } from "lucide-react"

export const links: LinksFunction = () => [
    { rel: "stylesheet", href: styles },
    { rel: "stylesheet", href: mapBoxStyle },
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
    },
    {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
    },
]

export const loader = async ({ request }: LoaderFunctionArgs) => {
    try {
        const { toast, headers } = await getToast(request)
        return data({ toast }, { headers })
    } catch (error) {
        console.error("Failed to get toast:", error)
        return data({ toast: null }, {})
    }
}

export function Layout() {
    const loaderData = useLoaderData<typeof loader>()
    const toast = loaderData?.toast

    // Hook to show the toasts
    useEffect(() => {
        if (toast && toast.type === "error") {
            notify.error(toast.message)
        }
        if (toast && toast.type === "success") {
            notify.success(toast.message)
        }
    }, [toast])

    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <Meta />
                <Links />
            </head>
            <body>
                <ErrorBoundary>
                    <Outlet />
                    <Toaster />
                </ErrorBoundary>
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    )
}

export default function App() {
    return <Outlet />
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
    const [isCopied, setIsCopied] = useState(false)

    useEffect(() => {
        if (isCopied) {
            const timer = setTimeout(() => setIsCopied(false), 5000)
            return () => clearTimeout(timer)
        }
    }, [isCopied])

    const copyStackTrace = () => {
        navigator.clipboard.writeText(
            JSON.stringify(
                {
                    status: error?.status,
                    statusText: error?.statusText,
                    stacktrace: error?.data,
                    page: window.location.href,
                    timestamp: new Date().toISOString(),
                },
                null,
                2,
            ),
        )
        setIsCopied(true)
    }

    console.error(error)
    if (isRouteErrorResponse(error)) {
        if (error.status === 500) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4">
                    <div className="mb-8 overflow-hidden rounded-lg w-full max-w-md">
                        <img
                            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/giphy-zaMc9sEWI1lqXlXSKSKR164AvQCUjf.webp"
                            alt="A red tractor doing a wheelie"
                            className="w-full rounded-lg"
                        />
                    </div>
                    <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                        Oeps, er lijkt iets mis te zijn.
                    </h1>
                    <p className="text-xl mb-8 text-center text-gray-600 dark:text-gray-400">
                        Er is onverwachts wat fout gegaan. Probeer eerst
                        opnieuw. Als het niet opnieuw lukt, kopieer dan de
                        foutmelding en neem contact op met Ondersteuning.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button asChild>
                            <NavLink to="/">
                                <Home className="mr-2 h-4 w-4" /> Terug naar de
                                hoofdpagina
                            </NavLink>
                        </Button>
                        <Button
                            variant="outline"
                            onClick={copyStackTrace}
                            disabled={!error?.data}
                        >
                            <Copy className="mr-2 h-4 w-4" />
                            {isCopied ? "Gekopieerd!" : "Kopieer foutmelding"}
                        </Button>
                    </div>
                    {error?.data ? (
                        <div className="mt-8 w-full max-w-2xl">
                            <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                                Foutmelding:
                            </h2>
                            <pre className="bg-gray-200 dark:bg-gray-800 p-4 rounded-md overflow-x-auto text-sm text-gray-800 dark:text-gray-200">
                                {JSON.stringify(
                                    {
                                        status: error?.status,
                                        statusText: error?.statusText,
                                        stacktrace: error?.data,
                                        page: window.location.href,
                                        timestamp: new Date().toISOString(),
                                    },
                                    null,
                                    2,
                                )}
                            </pre>
                        </div>
                    ) : (
                        <p className="mt-8 text-gray-600 dark:text-gray-400">
                            Er zijn helaas geen details over de fout
                            beschikbaar.
                        </p>
                    )}
                </div>
            )
                    {error?.data ? (
                        <div className="mt-8 w-full max-w-2xl">
                            <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                                Foutmelding:
                            </h2>
                            <pre className="bg-gray-200 dark:bg-gray-800 p-4 rounded-md overflow-x-auto text-sm text-gray-800 dark:text-gray-200">
                                {error.data}
                            </pre>
                        </div>
                    ) : (
                        <p className="mt-8 text-gray-600 dark:text-gray-400">
                            Er zijn helaas geen details over de fout
                            beschikbaar.
                        </p>
                    )}
                </div>
            )
        }

        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <h1 className="text-3xl font-bold text-red-500">
                    {error.status} {error.statusText}
                </h1>
                <p className="mt-4 text-gray-600">
                    {error.data ||
                        "Something went wrong. Please try again later."}
                </p>
                {error.status === 404 && (
                    <NavLink to="/" className="mt-4 text-blue-500 underline">
                        Go back to the homepage
                    </NavLink>
                )}
            </div>
        )
    }
    if (error instanceof Error) {
        return (
            <div>
                <h1>Error</h1>
                <p>{error.message}</p>
                <p>The stack trace is:</p>
                <pre>{error.stack}</pre>
            </div>
        )
    }
    return (
        <div>
            <h1>Unknown Error</h1>
        </div>
    )
}
