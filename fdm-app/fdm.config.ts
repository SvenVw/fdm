import type { Config } from "~/lib/config"

const config: Config = {
    // Site name
    name: process.env.FDM_NAME || "FDM",
    // Site logo
    favicon: "/favicon.ico",
    logo: "/logo.svg",

    // Authentication
    auth: {
        fdm_session_secret: String(process.env.FDM_SESSION_SECRET),
        better_auth_secret: String(process.env.BETTER_AUTH_SECRET),
        google: {
            clientId: String(process.env.GOOGLE_CLIENT_ID),
            clientSecret: String(process.env.GOOGLE_CLIENT_SECRET),
        },
        microsoft: {
            clientId: String(process.env.MICROSOFT_CLIENT_ID),
            clientSecret: String(process.env.MICROSOFT_CLIENT_SECRET),
        },
    },

    // Database
    database: {
        password: String(process.env.DB_PASSWORD),
        user: String(process.env.DB_USER),
        database: String(process.env.DB_DATABASE),
        host: String(process.env.DB_HOST),
        port: Number(process.env.DB_PORT),
    },

    // Integrations
    integrations: {
        mapbox: {
            token: String(process.env.MAPBOX_TOKEN),
        },
        nmi: {
            api_key: String(process.env.NMI_API_KEY),
        },
    },

    // Analytics
    analytics: {
        // Sentry
        sentry: {
            dsn: String(process.env.SENTRY_DSN),
            organization: String(process.env.VITE_SENTRY_ORG),
            project: String(process.env.VITE_SENTRY_PROJECT),
            auth_token: String(process.env.SENTRY_AUTH_TOKEN),
            trace_sample_rate:
                Number(process.env.VITE_SENTRY_TRACE_SAMPLE_RATE) || 1,
            replay_sample_rate:
                Number(process.env.VITE_SENTRY_REPLAY_SAMPLE_RATE) || 0,
            replay_sample_rate_on_error:
                Number(process.env.VITE_SENTRY_REPLAY_SAMPLE_RATE_ON_ERROR) ||
                1,
            profile_sample_rate:
                Number(process.env.VITE_SENTRY_PROFILE_SAMPLE_RATE) || 1,
            security_report_uri: String(
                process.env.VITE_SENTRY_SECURITY_REPORT_URI,
            ),
        },
    },
}

export default config
