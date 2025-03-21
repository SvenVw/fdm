export const config: Config = {
    // Site name
    name: "FDM",
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

    // Sentry
    sentry: {
        dsn: String(process.env.SENTRY_DSN),
    },
}

interface Config {
    name: string
    favicon: string
    logo: string
    auth: {
        fdm_session_secret: string
        better_auth_secret: string
        google?: {
            clientId: string
            clientSecret: string
        } | null
        microsoft?: {
            clientId: string
            clientSecret: string
        } | null
    }
    database: {
        password: string
        user: string
        database: string
        host: string
        port: number
    }
    sentry?: {
        dsn: string
    } | null
}
