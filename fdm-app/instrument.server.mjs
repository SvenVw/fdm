import * as Sentry from "@sentry/node"
import { nodeProfilingIntegration } from "@sentry/profiling-node"

Sentry.init({
    dsn: String(process.env.VITE_SENTRY_DSN),
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: Number(process.env.VITE_SENTRY_TRACE_SAMPLE_RATE),
    profilesSampleRate: Number(process.env.VITE_SENTRY_PROFILE_SAMPLE_RATE),
})
