export interface ServerConfig {
    auth: {
        fdm_session_secret: string
        better_auth_secret: string
        google?: {
            clientSecret: string
        } | null
        microsoft?: {
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
    integrations: {
        mapbox: {
            token: string
        }
        nmi?: {
            api_key: string
        }
    }
    analytics: {
        sentry?: {
            auth_token: string
        } | null
    }
}

// Define the structure for client-safe configuration
export interface ClientConfig {
    name: string
    logo: string
    logomark: string
    analytics: {
        sentry?: {
            dsn: string
            organization: string
            project: string
            trace_sample_rate: number
            replay_sample_rate: number
            replay_sample_rate_on_error: number
            profile_sample_rate: number
            security_report_uri: string
        } | null
        posthog?: {
            key: string
            host: string
        } | null
    }
}
