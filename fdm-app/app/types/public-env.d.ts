interface RuntimeConfig {
    PUBLIC_FDM_URL?: string
    PUBLIC_FDM_NAME?: string
    PUBLIC_FDM_PRIVACY_URL?: string
    PUBLIC_MAPBOX_TOKEN?: string
    PUBLIC_SENTRY_DSN?: string
    PUBLIC_SENTRY_ORG?: string
    PUBLIC_SENTRY_PROJECT?: string
    PUBLIC_SENTRY_TRACE_SAMPLE_RATE?: string | number
    PUBLIC_SENTRY_REPLAY_SAMPLE_RATE?: string | number
    PUBLIC_SENTRY_REPLAY_SAMPLE_RATE_ON_ERROR?: string | number
    PUBLIC_SENTRY_PROFILE_SAMPLE_RATE?: string | number
    PUBLIC_SENTRY_SECURITY_REPORT_URI?: string
    PUBLIC_POSTHOG_KEY?: string
    PUBLIC_POSTHOG_HOST?: string
}

interface ImportMetaEnv extends RuntimeConfig {}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

declare global {
    interface Window {
        __RUNTIME_CONFIG__?: RuntimeConfig
    }
}
