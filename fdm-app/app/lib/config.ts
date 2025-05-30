import type { ClientConfig } from "~/types/config.d"
import type { RuntimeConfig } from "~/types/public-env.d" // Import the new RuntimeConfig

// Define a map that holds the runtime environment variables,
// falling back to import.meta.env for local development/build time.
const runtimeEnvMap: RuntimeConfig = (() => {
    if (typeof window !== "undefined" && window.__RUNTIME_CONFIG__) {
        return window.__RUNTIME_CONFIG__
    }
    // Fallback to import.meta.env for local development or if not injected
    // We cast to any here to avoid strict type issues with direct indexing,
    // as ImportMetaEnv is augmented globally.
    return import.meta.env as any as RuntimeConfig
})()

// Helper to get config value from the runtimeEnvMap
const getConfigValue = (
    key: keyof RuntimeConfig,
    defaultValue?: RuntimeConfig[keyof RuntimeConfig],
) => {
    const value = runtimeEnvMap[key]
    return typeof value !== "undefined" ? value : defaultValue
}

// Read Sentry config
const sentryDsn = getConfigValue("PUBLIC_SENTRY_DSN")
const sentryOrg = getConfigValue("PUBLIC_SENTRY_ORG")
const sentryProject = getConfigValue("PUBLIC_SENTRY_PROJECT")

const sentryConfig =
    sentryDsn && sentryOrg && sentryProject
        ? {
              dsn: String(sentryDsn),
              organization: String(sentryOrg),
              project: String(sentryProject),
              trace_sample_rate: Number(
                  getConfigValue("PUBLIC_SENTRY_TRACE_SAMPLE_RATE", 1),
              ),
              replay_sample_rate: Number(
                  getConfigValue("PUBLIC_SENTRY_REPLAY_SAMPLE_RATE", 0),
              ),
              replay_sample_rate_on_error: Number(
                  getConfigValue(
                      "PUBLIC_SENTRY_REPLAY_SAMPLE_RATE_ON_ERROR",
                      1,
                  ),
              ),
              profile_sample_rate: Number(
                  getConfigValue("PUBLIC_SENTRY_PROFILE_SAMPLE_RATE", 1),
              ),
              security_report_uri: String(
                  getConfigValue("PUBLIC_SENTRY_SECURITY_REPORT_URI", ""),
              ),
          }
        : null

// Read PostHog config
const posthogKey = getConfigValue("PUBLIC_POSTHOG_KEY")
const posthogHost = getConfigValue("PUBLIC_POSTHOG_HOST")
const posthogConfig =
    posthogKey && posthogHost && String(posthogKey).startsWith("phc_")
        ? { key: String(posthogKey), host: String(posthogHost) }
        : null

// Export the client-safe config object
export const clientConfig: ClientConfig = {
    name: String(getConfigValue("PUBLIC_FDM_NAME", "FDM")),
    logo: "/fdm-high-resolution-logo-transparent.png", // Assuming static
    logomark: "/fdm-high-resolution-logo-transparent-no-text.png", // Assuming static
    url: String(getConfigValue("PUBLIC_FDM_URL")),
    privacy_url: String(getConfigValue("PUBLIC_FDM_PRIVACY_URL")),

    analytics: {
        sentry: sentryConfig,
        posthog: posthogConfig,
    },
    integrations: {
        mapbox: {
            token: String(getConfigValue("PUBLIC_MAPBOX_TOKEN")),
        },
    },
}
