import config from "@/fdm.config"

// Export the full config for server-side use
export const serverConfig = config

// Create the client-safe config object
export const clientConfig: ClientConfig = {
    name: config.name,
    logo: config.logo,
    logomark: config.logomark,
    analytics: {
        sentry: config.analytics.sentry
            ? {
                  dsn: config.analytics.sentry.dsn,
                  organization: config.analytics.sentry.organization,
                  project: config.analytics.sentry.project,
                  trace_sample_rate: config.analytics.sentry.trace_sample_rate,
                  replay_sample_rate:
                      config.analytics.sentry.replay_sample_rate,
                  replay_sample_rate_on_error:
                      config.analytics.sentry.replay_sample_rate_on_error,
                  profile_sample_rate:
                      config.analytics.sentry.profile_sample_rate,
                  security_report_uri:
                      config.analytics.sentry.security_report_uri,
              }
            : null,
    },
}

export interface Config {
    name: string
    logo: string
    logomark: string
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
            dsn: string
            organization: string
            project: string
            auth_token: string
            trace_sample_rate: number
            replay_sample_rate: number
            replay_sample_rate_on_error: number
            profile_sample_rate: number
            security_report_uri: string
        } | null
    }
}

// Define the structure for client-safe configuration
interface ClientConfig {
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
    }
}
