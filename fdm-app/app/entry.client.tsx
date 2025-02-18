/**
 * By default, Remix will handle hydrating your app on the client for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.client
 */

import * as Sentry from "@sentry/react"
import { StrictMode, startTransition } from "react"
import { hydrateRoot } from "react-dom/client"
import { HydratedRouter } from "react-router/dom"

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
    ],

    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE),

    tracePropagationTargets: ["localhost", process.env.FDM_APP_URL],

    replaysSessionSampleRate: Number(process.env.SENTRY_REPLAY_SAMPLE_RATE),
    replaysOnErrorSampleRate: Number(process.env.SENTRY_REPLAY_SAMPLE_RATE_ON_ERROR),
})

startTransition(() => {
    hydrateRoot(
        document,
        <StrictMode>
            <HydratedRouter />
        </StrictMode>,
    )
})
