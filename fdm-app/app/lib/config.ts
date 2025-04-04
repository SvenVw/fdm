import type { ClientConfig } from "~/types/config.d"

// Export the client-safe config object
export const clientConfig: ClientConfig = {
    // Site name
    name: import.meta.env.VITE_FDM_NAME || "FDM",
    // Site logo
    logo: "/fdm-high-resolution-logo-transparent.png",
    logomark: "/fdm-high-resolution-logo-transparent-no-text.png",

    analytics: {
        sentry: {
            dsn: String(import.meta.env.VITE_SENTRY_DSN),
            organization: String(import.meta.env.VITE_SENTRY_ORG),
            project: String(import.meta.env.VITE_SENTRY_PROJECT),
            trace_sample_rate:
                Number(import.meta.env.VITE_SENTRY_TRACE_SAMPLE_RATE) || 1,
            replay_sample_rate:
                Number(import.meta.env.VITE_SENTRY_REPLAY_SAMPLE_RATE) || 0,
            replay_sample_rate_on_error:
                Number(
                    import.meta.env.VITE_SENTRY_REPLAY_SAMPLE_RATE_ON_ERROR,
                ) || 1,
            profile_sample_rate:
                Number(import.meta.env.VITE_SENTRY_PROFILE_SAMPLE_RATE) || 1,
            security_report_uri: String(
                import.meta.env.VITE_SENTRY_SECURITY_REPORT_URI,
            ),
        },
        posthog: {
            key: import.meta.env.VITE_PUBLIC_POSTHOG_KEY,
            host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
        },
    },
}
