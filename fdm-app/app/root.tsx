import * as Sentry from "@sentry/react"
import mapBoxStyle from "mapbox-gl/dist/mapbox-gl.css?url"
import posthog from "posthog-js"
import { useEffect } from "react"
import {
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
    data,
    isRouteErrorResponse,
    redirect,
    useLoaderData,
    useLocation,
} from "react-router"
import type { LinksFunction, LoaderFunctionArgs } from "react-router"
import { getToast } from "remix-toast"
import { toast as notify } from "sonner"
import { Banner } from "~/components/custom/banner"
import { ErrorBlock } from "~/components/custom/error"
import { clientConfig } from "~/lib/config" // Import clientConfig
import { Toaster } from "~/components/ui/sonner"
import styles from "~/tailwind.css?url"
import type { Route } from "./+types/root"

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

/**
 * Renders the application layout with integrated toast notifications and error handling.
 *
 * This component retrieves loader data to display toast notifications for error, warning, success, and info types.
 * It sets up the HTML document structure, including meta tags, links for stylesheets and fonts, and renders
 * nested routes along with components for managing notifications, error boundaries, scroll restoration, and scripts.
 *
 * @returns The application's base layout as a React element.
 */
export function Layout() {
    const loaderData = useLoaderData<typeof loader>()
    const toast = loaderData?.toast
    const location = useLocation()

    // Capture pageviews if PostHog is configured
    // biome-ignore lint/correctness/useExhaustiveDependencies: This is a false positive: the useEffect should run whenever the location changes to capture new pageviews correctly
        useEffect(() => {
        if (clientConfig.analytics.posthog && typeof window !== "undefined") {
            posthog.capture("$pageview")
        }
    }, [location])

    // Hook to show the toasts
    useEffect(() => {
        if (toast && toast.type === "error") {
            notify.error(toast.message)
        }
        if (toast && toast.type === "warning") {
            notify.warning(toast.message)
        }
        if (toast && toast.type === "success") {
            notify.success(toast.message)
        }
        if (toast && toast.type === "info") {
            notify.info(toast.message)
        }
    }, [toast])

    return (
        <html lang="nl">
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
                <Banner />
                <Toaster />
                <ErrorBoundary error={null} params={{}} />
                <ScrollRestoration
                    getKey={(location) => {
                        // Use pathname for scroll restoration
                        return location.pathname
                    }}
                />
                <Scripts />
            </body>
        </html>
    )
}

export default function App() {
    return <Layout />
}

/**
 * Renders an error boundary that handles and displays error information based on the provided error.
 *
 * This component distinguishes between route error responses and generic errors:
 * - For route errors:
 *   - Redirects to the signin page if the error status is 401.
 *   - Renders a 404 error block for client errors with status 400, 403, or 404.
 *   - Logs other route errors to the error tracking service and renders an error block reflecting the specific status.
 * - For generic Error instances, it logs the error and renders a 500 error block with the error message and stack trace.
 * - If the error is null, no error UI is rendered.
 * - For any other cases, it logs the error and displays an error block with a 500 status and a generic message.
 *
 * @param error - The error encountered during route processing, either as a route error response or a generic Error.
 */
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
    const location = useLocation()
    const page = location.pathname
    const timestamp = new Date().toISOString()

    if (isRouteErrorResponse(error)) {
        // Redirect to signin page if authentication is not provided
        if (error.status === 401) {
            redirect("./signin")
        }

        const clientErrors = [400, 403, 404]
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
    if (error === null) {
        return null
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
