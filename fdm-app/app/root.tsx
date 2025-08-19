import mapBoxStyle from "mapbox-gl/dist/mapbox-gl.css?url"
import posthog from "posthog-js"
import { useEffect } from "react"
import type { LinksFunction, LoaderFunctionArgs } from "react-router"
import {
    data,
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
    useLoaderData,
    useLocation,
} from "react-router"
import { getToast } from "remix-toast"
import { toast as notify } from "sonner"
import { InlineErrorBoundary } from "@/app/components/custom/inline-error-boundary"
import { Banner } from "~/components/custom/banner"
import { Toaster } from "~/components/ui/sonner"
import { clientConfig } from "~/lib/config"
import { useChangelogStore } from "~/store/changelog"
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

        // Prepare runtime environment variables for the client
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
        // Fallback for runtimeEnv if process.env access fails or is not desired here for some reason
        const runtimeEnvFallback = {
            // Provide fallbacks or leave undefined if config.ts handles undefined from window object
        }
        return data({ toast: null, runtimeEnv: runtimeEnvFallback }, {})
    }
}

export function Layout() {
    const loaderData = useLoaderData<typeof loader>()
    const toast = loaderData?.toast
    const runtimeEnv = loaderData?.runtimeEnv // Get runtimeEnv from loader data
    const location = useLocation()

    // Capture pageviews if PostHog is configured
    // biome-ignore lint/correctness/useExhaustiveDependencies: This is a false positive: the useEffect should run whenever the location changes to capture new pageviews correctly
    useEffect(() => {
        if (clientConfig.analytics.posthog && typeof window !== "undefined") {
            posthog.capture("$pageview")
        }
    }, [location])

    // Initialize changelog store
    useEffect(() => {
        useChangelogStore.getState().initializeChangelog()
    }, [])

    // Hook to show the toasts
    useEffect(() => {
        if (toast && toast.type === "error") {
            notify.error(toast.message, {
                duration: 30000,
            })
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
                        return location.pathname
                    }}
                />
                {/* Inject runtime environment variables */}
                {runtimeEnv && (
                    <script
                        id="runtime-config"
                        type="application/json"
                        // biome-ignore lint/security/noDangerouslySetInnerHtml: This is safe because we are stringifying a JSON object
                        dangerouslySetInnerHTML={{
                            __html: JSON.stringify(runtimeEnv).replace(
                                /</g,
                                "\\u003c",
                            ),
                        }}
                    />
                )}
                <script
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: This is safe because we are stringifying a JSON object
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

export default function App() {
    return <Layout />
}

export function ErrorBoundary(props: Route.ErrorBoundaryProps) {
    return <InlineErrorBoundary {...props} />
}
