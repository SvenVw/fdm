export interface ServerConfig {
    name: string
    url: string
    privacy_url: string
    auth: {
        fdm_session_secret: string
        better_auth_secret: string
        google?:
            | {
                  clientId: string
                  clientSecret: string
              }
            | undefined
        microsoft?:
            | {
                  clientId: string
                  clientSecret: string
              }
            | undefined
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
    mail?: {
        postmark: {
            key: string
            sender_address: string
            sender_name: string
        }
    }
}

// Define the structure for client-safe configuration
export interface ClientConfig {
    name: string
    logo: string
    logomark: string
    url: string
    privacy_url: string
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
    integrations: {
        mapbox: {
            token: string
        }
    }
}
