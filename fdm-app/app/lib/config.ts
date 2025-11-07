/**
 * @file This module is responsible for creating a client-safe configuration object.
 *
 * It reads public environment variables that have been safely passed from the server
 * to the client via the `window.__RUNTIME_CONFIG__` object. This ensures that only
 * non-secret, "public" environment variables are accessible in the browser.
 *
 * The module structures these variables into a strongly-typed `clientConfig` object,
 * providing a single, reliable source for client-side configuration.
 *
 * @packageDocumentation
 */
import type { ClientConfig, RuntimeConfig } from "~/types/config.d"

declare global {
    interface Window {
        __RUNTIME_CONFIG__?: RuntimeConfig
    }
}

/**
 * Initializes the runtime environment map by reading from `window.__RUNTIME_CONFIG__`
 * on the client, or from `process.env` on the server as a fallback.
 * @internal
 */
const initializeRuntimeEnvMap = (): RuntimeConfig => {
    // Client-side: Use the config object injected by the root loader.
    // biome-ignore lint/complexity/useOptionalChain: Required for checking window object existence.
    if (typeof window !== "undefined" && window.__RUNTIME_CONFIG__) {
        return window.__RUNTIME_CONFIG__
    }

    // Server-side: Construct the config from process.env (for contexts like route handlers).
    const env: Partial<RuntimeConfig> = {}
    const keysToProcess: Array<keyof RuntimeConfig> = [
        "PUBLIC_FDM_URL",
        "PUBLIC_FDM_NAME",
        "PUBLIC_FDM_PRIVACY_URL",
        "PUBLIC_FDM_DATASETS_URL",
        "PUBLIC_MAPBOX_TOKEN",
        "PUBLIC_SENTRY_DSN",
        "PUBLIC_SENTRY_ORG",
        "PUBLIC_SENTRY_PROJECT",
        "PUBLIC_SENTRY_TRACE_SAMPLE_RATE",
        "PUBLIC_SENTRY_REPLAY_SAMPLE_RATE",
        "PUBLIC_SENTRY_REPLAY_SAMPLE_RATE_ON_ERROR",
        "PUBLIC_SENTRY_PROFILE_SAMPLE_RATE",
        "PUBLIC_SENTRY_SECURITY_REPORT_URI",
        "PUBLIC_POSTHOG_KEY",
        "PUBLIC_POSTHOG_HOST",
    ]

    for (const key of keysToProcess) {
        if (typeof process !== "undefined" && process.env[key] !== undefined) {
            env[key] = process.env[key]
        } else if (import.meta.env[key] !== undefined) {
            env[key] = import.meta.env[key]
        }
    }

    return env as RuntimeConfig
}

const runtimeEnvMap: RuntimeConfig = initializeRuntimeEnvMap()

/**
 * Safely retrieves a configuration value from the runtime environment map.
 * @internal
 */
const getConfigValue = (
    key: keyof RuntimeConfig,
    defaultValue?: RuntimeConfig[keyof RuntimeConfig],
) => {
    const value = runtimeEnvMap[key]
    return typeof value !== "undefined" ? value : defaultValue
}

// Assemble the Sentry configuration object if all required variables are present.
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

// Assemble the PostHog configuration object if all required variables are present.
const posthogKey = getConfigValue("PUBLIC_POSTHOG_KEY")
const posthogHost = getConfigValue("PUBLIC_POSTHOG_HOST")
const posthogConfig =
    posthogKey && posthogHost && String(posthogKey).startsWith("phc_")
        ? { key: String(posthogKey), host: String(posthogHost) }
        : null

/**
 * The configuration object containing all public, client-safe environment variables.
 */
export const clientConfig: ClientConfig = {
    name: String(getConfigValue("PUBLIC_FDM_NAME", "FDM")),
    logo: "/fdm-high-resolution-logo-transparent.png",
    logomark: "/fdm-high-resolution-logo-transparent-no-text.png",
    url: String(getConfigValue("PUBLIC_FDM_URL")),
    privacy_url: String(getConfigValue("PUBLIC_FDM_PRIVACY_URL")),
    datasets_url: String(getConfigValue("PUBLIC_FDM_DATASETS_URL")),

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
