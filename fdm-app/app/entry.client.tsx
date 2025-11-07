/**
 * @file This file serves as the client-side entry point for the Remix application.
 *
 * It is responsible for the following key tasks:
 * 1.  **Hydration**: It takes the server-rendered HTML and "hydrates" it with client-side
 *     JavaScript, making the application interactive. This process is handled by `hydrateRoot`.
 * 2.  **Analytics Initialization**: It initializes third-party analytics and monitoring services
 *     that run in the browser:
 *     - **Sentry**: For client-side error tracking, performance monitoring (tracing), and user
 *       feedback collection. The configuration is loaded from `clientConfig`.
 *     - **PostHog**: For product analytics and session tracking. The configuration is also
 *       loaded from `clientConfig`.
 * 3.  **Strict Mode**: The application is wrapped in React's `<StrictMode>` to help identify
 *     potential problems in the code during development.
 * 4.  **PostHog Provider**: The entire application is wrapped in a `PostHogProvider` to make
 *     the PostHog client available throughout the component tree via hooks.
 *
 * @see https://remix.run/file-conventions/entry.client
 * @packageDocumentation
 */
import * as Sentry from "@sentry/react-router"
import posthog from "posthog-js"
import { PostHogProvider } from "posthog-js/react"
import { StrictMode, startTransition } from "react"
import { hydrateRoot } from "react-dom/client"
import { HydratedRouter } from "react-router/dom"
import { clientConfig } from "~/lib/config"

// Initialize Sentry for client-side error monitoring and user feedback.
if (clientConfig.analytics.sentry) {
    const sentryConfig = clientConfig.analytics.sentry
    Sentry.init({
        dsn: sentryConfig.dsn,
        environment: import.meta.env.NODE_ENV,
        integrations: [
            Sentry.reactRouterTracingIntegration(),
            Sentry.replayIntegration(),
            Sentry.feedbackIntegration({
                autoInject: false,
                colorScheme: "system",
                isNameRequired: true,
                isEmailRequired: true,
                enableScreenshot: true,
                showBranding: false,
                triggerLabel: "Geef feedback",
                formTitle: "Geef feedback",
                submitButtonLabel: "Verstuur",
                cancelButtonLabel: "Annuleer",
                confirmButtonLabel: "Bevestig",
                addScreenshotButtonLabel: "Voeg een screenshot toe",
                removeScreenshotButtonLabel: "Verwijder screenshot",
                nameLabel: "Naam",
                namePlaceholder: "Uw naam",
                emailLabel: "E-mailadres",
                emailPlaceholder: "Uw e-mailadres",
                isRequiredLabel: "(vereist)",
                messageLabel: "Beschrijving",
                messagePlaceholder:
                    "Wat is uw feedback? Gaat er iets mis of zou u iets toegevoegd willen zien?",
                successMessageText: "Bedankt voor uw feedback!",
                useSentryUser: {
                    name: "fullName",
                    email: "email",
                },
            }),
        ],
        tracesSampleRate: sentryConfig.trace_sample_rate,
        tracePropagationTargets: [window.location.hostname],
        replaysSessionSampleRate: sentryConfig.replay_sample_rate,
        replaysOnErrorSampleRate: sentryConfig.replay_sample_rate_on_error,
    })
}

// Initialize PostHog for product analytics.
const posthogConfig = clientConfig.analytics.posthog
if (posthogConfig) {
    try {
        posthog.init(posthogConfig.key, {
            api_host: posthogConfig.host,
            person_profiles: "always",
        })
    } catch (error) {
        console.error("Failed to initialize PostHog:", error)
    }
} else {
    console.warn("PostHog not initialized - missing or invalid configuration")
}

// Start the hydration process.
startTransition(() => {
    hydrateRoot(
        document,
        <StrictMode>
            <PostHogProvider client={posthog}>
                <HydratedRouter />
            </PostHogProvider>
        </StrictMode>,
    )
})
