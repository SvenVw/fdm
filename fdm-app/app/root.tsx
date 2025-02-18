import * as Sentry from "@sentry/react"

import { Toaster } from "@/components/ui/sonner"
import mapBoxStyle from "mapbox-gl/dist/mapbox-gl.css?url"
import { useEffect } from "react"
import {
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
    data,
    isRouteErrorResponse,
    useLoaderData,
    useLocation,
} from "react-router"
import type { LinksFunction, LoaderFunctionArgs } from "react-router"
import { getToast } from "remix-toast"
import { toast as notify } from "sonner"
import styles from "~/tailwind.css?url"
import type { Route } from "./+types/root"
import { ErrorBlock } from "./components/custom/error"

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
                <Outlet />
                <Toaster />
                <ErrorBoundary />
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
    const location = useLocation()
    const page = location.pathname
    const timestamp = new Date().toISOString()

    if (isRouteErrorResponse(error)) {
        const clientErrors = [400, 401, 403, 404]
        if (clientErrors.includes(error.status)) {
            return (
                <ErrorBlock
                    status={404} // Show 404 in case user is not authorized to access page
                    message={error.statusText}
                    stacktrace={error.data}
                    page={page}
                    timestamp={timestamp}
                />
            )
        }

        Sentry.captureException(error)
        return (
            <ErrorBlock
                status={error.status}
                message={error.statusText}
                stacktrace={error.data}
                page={page}
                timestamp={timestamp}
            />
        )
    }
    if (error instanceof Error) {
        Sentry.captureException(error)
        return (
            <ErrorBlock
                status={500}
                message={error.message}
                stacktrace={error.stack}
                page={page}
                timestamp={timestamp}
            />
        )
    }

    Sentry.captureException(error)
    return (
        <ErrorBlock
            status={500}
            message="Unknown Error"
            stacktrace={null}
            page={page}
            timestamp={timestamp}
        />
    )
}
