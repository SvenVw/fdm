import type { ServerConfig } from "~/types/config.d"

// Export the full config for server-side use
export const serverConfig: ServerConfig = {
    name: String(process.env.VITE_FDM_NAME),
    url: String(process.env.VITE_FDM_URL),

    // Authentication
    auth: {
        fdm_session_secret: String(process.env.FDM_SESSION_SECRET),
        better_auth_secret: String(process.env.BETTER_AUTH_SECRET),
        google: {
            clientId: String(process.env.GOOGLE_CLIENT_ID),
            clientSecret: String(process.env.GOOGLE_CLIENT_SECRET),
        },
        microsoft: {
            clientId: String(process.env.MS_CLIENT_ID),
            clientSecret: String(process.env.MS_CLIENT_SECRET),
        },
    },

    // Database
    database: {
        password: String(process.env.POSTGRES_PASSWORD),
        user: String(process.env.POSTGRES_USER),
        database: String(process.env.POSTGRES_DB),
        host: String(process.env.POSTGRES_HOST),
        port: Number(process.env.POSTGRES_PORT),
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
            auth_token: String(process.env.SENTRY_AUTH_TOKEN),
        },
    },

    // Mail
    mail: {
        // Postmark
        postmark: {
            key: String(process.env.POSTMARK_API_KEY),
            sender_address: String(process.env.POSTMARK_SENDER_ADDRESS),
            sender_name: String(process.env.POSTMARK_SENDER_NAME),
        },
    },
}
