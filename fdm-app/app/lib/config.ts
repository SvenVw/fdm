import type { ClientConfig } from "~/types/config.d"

// Read Sentry config from environment variables
const sentryDsn = import.meta.env.VITE_SENTRY_DSN
const sentryOrg = import.meta.env.VITE_SENTRY_ORG
const sentryProject = import.meta.env.VITE_SENTRY_PROJECT

// Conditionally create Sentry config object
const sentryConfig =
    sentryDsn && sentryOrg && sentryProject
        ? {
              dsn: String(sentryDsn),
              organization: String(sentryOrg),
              project: String(sentryProject),
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
          }
        : null

// Read PostHog config from environment variables
const posthogKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY
const posthogHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST
const posthogConfig =
    posthogKey && posthogHost && posthogKey.startsWith("phc_")
        ? { key: posthogKey, host: posthogHost }
        : null

// Export the client-safe config object
export const clientConfig: ClientConfig = {
    // Site name
    name: import.meta.env.VITE_FDM_NAME || "FDM",
    // Site logo
    logo: "/fdm-high-resolution-logo-transparent.png",
    logomark: "/fdm-high-resolution-logo-transparent-no-text.png",
    url: import.meta.env.VITE_FDM_URL,

    analytics: {
        sentry: sentryConfig,
        posthog: posthogConfig,
    },
}
