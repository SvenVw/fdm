/**
 * @file This file defines the `Banner` component and related utility functions for handling
 * cookie consent.
 *
 * The component displays a cookie consent banner to users who have not yet made a choice.
 * It allows users to accept or decline analytics cookies and stores their preference in
 * `localStorage`. Based on the user's consent, it configures the persistence strategy
 * for the PostHog analytics library.
 *
 * @packageDocumentation
 */
import { Cookie, X } from "lucide-react"
import posthog from "posthog-js"
import { useEffect, useState } from "react"
import { Button } from "~/components/ui/button"
import { clientConfig } from "~/lib/config"

type ConsentType = "yes" | "no" | "undecided"

/**
 * Checks the user's cookie consent status from `localStorage`.
 * @returns The consent status: "yes", "no", or "undecided".
 */
export function cookieConsentGiven(): ConsentType {
    if (typeof window === "undefined" || !window.localStorage) {
        return "undecided"
    }
    const consent = localStorage.getItem("cookie_consent")
    return consent === "yes" || consent === "no" ? consent : "undecided"
}

/**
 * Resets the user's cookie consent by removing the item from `localStorage`.
 * @returns "undecided" to reflect the new status.
 */
export function resetCookieConsent(): ConsentType {
    if (typeof window === "undefined" || !window.localStorage) {
        return "undecided"
    }
    localStorage.removeItem("cookie_consent")
    return "undecided"
}

/**
 * A banner component for managing user cookie consent for analytics.
 *
 * This component is displayed to new users and allows them to accept or decline
 * cookies for analytics purposes (specifically for PostHog). The user's choice
 * is persisted in `localStorage`. The banner can also be re-opened via a global
 * `window.openCookieSettings` function.
 */
export function Banner() {
    const [consentGiven, setConsentGiven] = useState<ConsentType>("undecided")
    const [isVisible, setIsVisible] = useState(false)

    // On component mount, check the initial consent status and show the banner if needed.
    useEffect(() => {
        const initialConsent = cookieConsentGiven()
        setConsentGiven(initialConsent)
        setIsVisible(initialConsent === "undecided")
    }, [])

    // Configure PostHog persistence based on the user's consent.
    useEffect(() => {
        if (clientConfig.analytics.posthog && consentGiven !== "undecided") {
            try {
                posthog.set_config({
                    persistence:
                        consentGiven === "yes"
                            ? "localStorage+cookie"
                            : "memory",
                })
            } catch (error) {
                console.error("Failed to configure PostHog:", error)
            }
        }
    }, [consentGiven])

    const handleAcceptCookies = () => {
        if (typeof window !== "undefined" && window.localStorage) {
            localStorage.setItem("cookie_consent", "yes")
            setConsentGiven("yes")
            setIsVisible(false)
        }
    }

    const handleDeclineCookies = () => {
        if (typeof window !== "undefined" && window.localStorage) {
            localStorage.setItem("cookie_consent", "no")
            setConsentGiven("no")
            setIsVisible(false)
        }
    }

    const handleResetCookies = () => {
        setConsentGiven(resetCookieConsent())
        setIsVisible(true)
    }

    // Set up a global event listener and function to allow other parts of the app
    // to programmatically open the cookie consent banner.
    useEffect(() => {
        const handleOpenCookieSettings = () => setIsVisible(true)
        window.addEventListener("openCookieSettings", handleOpenCookieSettings)
        if (typeof window !== "undefined") {
            window.openCookieSettings = () => {
                window.dispatchEvent(new Event("openCookieSettings"))
            }
        }

        return () => {
            window.removeEventListener(
                "openCookieSettings",
                handleOpenCookieSettings,
            )
            if (typeof window !== "undefined") {
                window.openCookieSettings = undefined
            }
        }
    }, [])

    const handleCloseBanner = () => {
        setIsVisible(false)
    }

    if (!isVisible) {
        return null
    }

    return (
        <div className="fixed z-200 bottom-0 left-0 right-0 sm:left-4 sm:bottom-4 w-full sm:max-w-md duration-700 transition-[opacity,transform] translate-y-0 opacity-100">
            <div className="dark:bg-card bg-background rounded-md m-3 border border-border shadow-lg">
                <div className="grid gap-2">
                    <div className="border-b border-border h-14 flex items-center justify-between p-4">
                        <h1 className="text-lg font-medium">{`Cookies op ${clientConfig.name}`}</h1>
                        <div className="flex gap-2">
                            <Cookie className="h-[1.2rem] w-[1.2rem]" />
                            {consentGiven !== "undecided" && (
                                <X
                                    aria-label="Sluiten"
                                    className="h-[1.2rem] w-[1.2rem] cursor-pointer"
                                    onClick={handleCloseBanner}
                                />
                            )}
                        </div>
                    </div>
                    <div className="p-4">
                        <p className="text-sm font-normal text-start">
                            {`Wij gebruiken cookies enkel om ${clientConfig.name} te verbeteren, zodat we weten wat er goed en fout gaat.`}
                            <br />
                            Geen zorgen, we gebruiken ze niet voor advertenties
                            en ook niet om je online te volgen.
                            <br />
                            <br />
                            <span className="text-xs">
                                Klik op "
                                <span className="font-medium opacity-80">
                                    Accepteren
                                </span>
                                " om cookies toe te staan.
                            </span>
                            <br />
                            <a
                                href={clientConfig.privacy_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Naar privacybeleid (opent in nieuw tabblad)"
                                className="text-xs underline"
                            >
                                Meer over cookies.
                            </a>
                        </p>
                    </div>
                    <div className="flex gap-2 p-4 py-5 border-t border-border dark:bg-background/20">
                        {consentGiven === "yes" ? (
                            <Button
                                onClick={handleResetCookies}
                                className="w-full"
                                variant="outline"
                            >
                                Reset keuze: Geaccepteerd
                            </Button>
                        ) : consentGiven === "no" ? (
                            <Button
                                onClick={handleResetCookies}
                                className="w-full"
                                variant="outline"
                            >
                                Reset keuze: Geweigerd
                            </Button>
                        ) : (
                            <>
                                <Button
                                    onClick={handleAcceptCookies}
                                    className="w-full"
                                >
                                    Accepteren
                                </Button>
                                <Button
                                    onClick={handleDeclineCookies}
                                    className="w-full"
                                    variant="secondary"
                                >
                                    Weigeren
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
