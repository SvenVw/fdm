import config from "@/fdm.config"

// Export the full config for server-side use
export const serverConfig = config

// Create the client-safe config object
export const clientConfig: ClientConfig = {
    name: config.name,
    favicon: config.favicon,
    logo: config.logo,
    analytics: {
        sentry: config.analytics.sentry
            ? { dsn: config.analytics.sentry.dsn }
            : null,
    },
}

export interface Config {
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
    analytics: {
        sentry?: {
            dsn: string
        } | null
    }
}

// Define the structure for client-safe configuration
interface ClientConfig {
    name: string
    favicon: string
    logo: string
    analytics: {
        sentry?: {
            dsn: string
        } | null
    }
}
