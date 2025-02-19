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
    dsn: "https://b5651581a95af60620e34f9830be9d63@o4508840388001793.ingest.de.sentry.io/4508840410284112",
    integrations: [
        Sentry.browserTracingIntegration(),
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
        }),
    ],
    beforeSend(event, hint) {
        if (event.exception && event.event_id) {
            Sentry.showReportDialog({ eventId: event.event_id, lang: "nl" })
        }
        return event
    },

    tracesSampleRate: 1,

    tracePropagationTargets: ["localhost"],

    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1,
})

startTransition(() => {
    hydrateRoot(
        document,
        <StrictMode>
            <HydratedRouter />
        </StrictMode>,
    )
})
