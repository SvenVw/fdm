import * as Sentry from "@sentry/node"
import { nodeProfilingIntegration } from "@sentry/profiling-node"

const requiredEnvVars = [
    "VITE_SENTRY_DSN",
    "VITE_SENTRY_TRACE_SAMPLE_RATE",
    "VITE_SENTRY_PROFILE_SAMPLE_RATE",
]

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`)
    }
}

Sentry.init({
    dsn: String(process.env.VITE_SENTRY_DSN),
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: Number(process.env.VITE_SENTRY_TRACE_SAMPLE_RATE),
    profilesSampleRate: Number(process.env.VITE_SENTRY_PROFILE_SAMPLE_RATE),
})
