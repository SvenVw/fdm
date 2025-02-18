import * as Sentry from "@sentry/node"
import { nodeProfilingIntegration } from "@sentry/profiling-node"

Sentry.init({
    dsn: String(process.env.SENTRY_DSN),
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: Number(process.env.SENTRY_TRACE_SAMPLE_RATE),
    profilesSampleRate: Number(process.env.SENTRY_PROFILE_SAMPLE_RATE),
})
