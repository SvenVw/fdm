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

    // Analytics
    analytics: {
        // Sentry
        sentry: {
            dsn: String(process.env.SENTRY_DSN),
        },
    },
}

export default config
