/**
 * @file This file defines the root component of the Remix application.
 *
 * It serves as the main layout or "shell" for the entire application, containing the `<html>`,
 * `<head>`, and `<body>` tags. It is responsible for:
 * 1.  **Global Styles**: Linking the main stylesheet (`tailwind.css`), Mapbox GL styles, and custom fonts.
 * 2.  **Server-Side Data Loading**: The `loader` function fetches data required for the initial render,
 *     such as toast messages from the session and environment variables that need to be exposed to the client.
 * 3.  **Client-Side Environment**: It safely injects server-side environment variables into the client's
 *     `window` object for use in browser-side code.
 * 4.  **Root Layout (`Layout`)**: Renders the basic HTML structure, including `<Meta>`, `<Links>`, `<Scripts>`,
 *     and the main `<Outlet>` where nested routes are rendered.
 * 5.  **Client-Side Effects**: It includes `useEffect` hooks to handle toast notifications, initialize the
 *     changelog store, and trigger PostHog pageviews on route changes.
 * 6.  **Global Error Handling**: The `ErrorBoundary` component serves as a catch-all for unhandled
 *     errors that occur during rendering, providing a graceful user experience and reporting the
 *     error to Sentry. It also handles specific HTTP status codes, like redirecting on 401 Unauthorized.
 *
 * @packageDocumentation
 */
import * as Sentry from "@sentry/react-router"
import mapBoxStyle from "mapbox-gl/dist/mapbox-gl.css?url"
import posthog from "posthog-js"
import { useEffect } from "react"
import type { LinksFunction, LoaderFunctionArgs } from "react-router"
import {
    data,
    isRouteErrorResponse,
    Links,
    Meta,
    Outlet,
    redirect,
    Scripts,
    ScrollRestoration,
    useLoaderData,
    useLocation,
} from "react-router"
import { getToast } from "remix-toast"
import { toast as notify } from "sonner"
import { Banner } from "~/components/custom/banner"
import { ErrorBlock } from "~/components/custom/error"
import { Toaster } from "~/components/ui/sonner"
import { clientConfig } from "~/lib/config"
import { useChangelogStore } from "~/store/changelog"
import styles from "~/tailwind.css?url"
import type { Route } from "./+types/root"

/**
 * Defines the global links for the application, including stylesheets and font preconnects.
 */
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

/**
 * The root loader function. It runs on the server before the page is rendered.
 * Its primary roles are to handle session-based toast messages and to pass
 * public environment variables from the server to the client.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
    try {
        const { toast, headers } = await getToast(request)

        // Expose public environment variables to the client-side.
        const runtimeEnv = {
            PUBLIC_FDM_URL: process.env.PUBLIC_FDM_URL,
            PUBLIC_FDM_NAME: process.env.PUBLIC_FDM_NAME,
            PUBLIC_FDM_PRIVACY_URL: process.env.PUBLIC_FDM_PRIVACY_URL,
            PUBLIC_FDM_DATASETS_URL: process.env.PUBLIC_FDM_DATASETS_URL,
            PUBLIC_MAPBOX_TOKEN: process.env.PUBLIC_MAPBOX_TOKEN,
            PUBLIC_SENTRY_DSN: process.env.PUBLIC_SENTRY_DSN,
            PUBLIC_SENTRY_ORG: process.env.PUBLIC_SENTRY_ORG,
            PUBLIC_SENTRY_PROJECT: process.env.PUBLIC_SENTRY_PROJECT,
            PUBLIC_SENTRY_TRACE_SAMPLE_RATE:
                process.env.PUBLIC_SENTRY_TRACE_SAMPLE_RATE,
            PUBLIC_SENTRY_REPLAY_SAMPLE_RATE:
                process.env.PUBLIC_SENTRY_REPLAY_SAMPLE_RATE,
            PUBLIC_SENTRY_REPLAY_SAMPLE_RATE_ON_ERROR:
                process.env.PUBLIC_SENTRY_REPLAY_SAMPLE_RATE_ON_ERROR,
            PUBLIC_SENTRY_PROFILE_SAMPLE_RATE:
                process.env.PUBLIC_SENTRY_PROFILE_SAMPLE_RATE,
            PUBLIC_SENTRY_SECURITY_REPORT_URI:
                process.env.PUBLIC_SENTRY_SECURITY_REPORT_URI,
            PUBLIC_POSTHOG_KEY: process.env.PUBLIC_POSTHOG_KEY,
            PUBLIC_POSTHOG_HOST: process.env.PUBLIC_POSTHOG_HOST,
        }

        return data({ toast, runtimeEnv }, { headers })
    } catch (error) {
        console.error("Failed to get toast or runtimeEnv:", error)
        return data({ toast: null, runtimeEnv: {} }, {})
    }
}

/**
 * The root layout component for the entire application.
 * It sets up the main HTML structure and includes client-side logic for analytics and notifications.
 */
export function Layout() {
    const loaderData = useLoaderData<typeof loader>()
    const toast = loaderData?.toast
    const runtimeEnv = loaderData?.runtimeEnv
    const location = useLocation()

    // biome-ignore lint/correctness/useExhaustiveDependencies: This effect should re-run on every location change to capture new pageviews.
    useEffect(() => {
        // Track page views with PostHog on client-side navigation.
        if (clientConfig.analytics.posthog && typeof window !== "undefined") {
            posthog.capture("$pageview")
        }
    }, [location])

    // Initialize the changelog state on initial client load.
    useEffect(() => {
        useChangelogStore.getState().initializeChangelog()
    }, [])

    // Display toast notifications passed from server-side actions/loaders.
    useEffect(() => {
        if (toast) {
            switch (toast.type) {
                case "error":
                    notify.error(toast.message, { duration: 30000 })
                    break
                case "warning":
                    notify.warning(toast.message)
                    break
                case "success":
                    notify.success(toast.message)
                    break
                case "info":
                    notify.info(toast.message)
                    break
            }
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
                <ScrollRestoration getKey={(location) => location.pathname} />

                {/* Inject server-side environment variables into a script tag for client-side access. */}
                {runtimeEnv && (
                    <script
                        id="runtime-config"
                        type="application/json"
                        // biome-ignore lint/security/noDangerouslySetInnerHtml: This is safe as we are stringifying a JSON object and escaping characters.
                        dangerouslySetInnerHTML={{
                            __html: JSON.stringify(runtimeEnv).replace(
                                /</g,
                                "\\u003c",
                            ),
                        }}
                    />
                )}
                {/* Script to parse the injected config and attach it to the window object. */}
                <script
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: This is a static, safe script.
                    dangerouslySetInnerHTML={{
                        __html: `
                            try {
                                const configScript = document.getElementById('runtime-config');
                                window.__RUNTIME_CONFIG__ = configScript ? JSON.parse(configScript.textContent) : {};
                            } catch (e) {
                                console.warn('Failed to parse runtime config:', e);
                                window.__RUNTIME_CONFIG__ = {};
                            }
                        `,
                    }}
                />
                <Scripts />
            </body>
        </html>
    )
}

/**
 * The main application component.
 */
export default function App() {
    return <Layout />
}

/**
 * The root error boundary for the application.
 * This component catches errors thrown during rendering, data loading, or actions
 * and displays an appropriate error page. It also handles specific HTTP error statuses.
 */
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
    const location = useLocation()
    const page = location.pathname
    const timestamp = new Date().toISOString()

    if (isRouteErrorResponse(error)) {
        // If the user is not authenticated, redirect them to the sign-in page,
        // preserving the URL they were trying to access.
        if (error.status === 401) {
            const currentPath =
                location.pathname + location.search + location.hash
            const signInUrl = `./signin?redirectTo=${encodeURIComponent(currentPath)}`
            throw redirect(signInUrl)
        }

        // For common client errors (like Not Found), show a standard 404 page.
        const clientErrors = [400, 403, 404]
        if (clientErrors.includes(error.status)) {
            return (
                <ErrorBlock
                    status={404}
                    message={error.statusText}
                    stacktrace={error.data}
                    page={page}
                    timestamp={timestamp}
                />
            )
        }

        // For all other server errors, report to Sentry and show a generic error page.
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

    // Handle standard JavaScript Error objects.
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

    // Fallback for any other type of thrown value.
    if (error !== null) {
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

    // If error is null, render nothing.
    return null
}
