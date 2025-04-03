import { Button } from "@/components/ui/button"
import { Cookie, CookieIcon, X } from "lucide-react"
import posthog from "posthog-js"
import { useEffect, useState } from "react"

type ConsentType = "yes" | "no" | "undecided"

export function cookieConsentGiven(): ConsentType {
    if (typeof window === "undefined" || !window.localStorage) {
        return "undecided"
    }
    if (!localStorage.getItem("cookie_consent")) {
        return "undecided"
    }
    const consent = localStorage.getItem("cookie_consent")
    return consent === "yes" || consent === "no" ? consent : "undecided"
}

export function resetCookieConsent(): ConsentType {
    if (typeof window === "undefined" || !window.localStorage) {
        return "undecided"
    }
    localStorage.removeItem("cookie_consent")
    return "undecided"
}

export function Banner() {
    const [consentGiven, setConsentGiven] = useState<
        "yes" | "no" | "undecided"
    >("undecided")
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        setConsentGiven(cookieConsentGiven())
        setIsVisible(cookieConsentGiven() === "undecided")
    }, [])

    useEffect(() => {
        if (consentGiven !== "undecided") {
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
        if (typeof window === "undefined" || !window.localStorage) {
            return
        }
        localStorage.setItem("cookie_consent", "yes")
        setConsentGiven("yes")
        setIsVisible(false)
    }

    const handleDeclineCookies = () => {
        if (typeof window === "undefined" || !window.localStorage) {
            return
        }
        localStorage.setItem("cookie_consent", "no")
        setConsentGiven("no")
        setIsVisible(false)
    }

    const handleResetCookies = () => {
        setConsentGiven(resetCookieConsent())
        setIsVisible(true)
    }

    // Function to be called from outside the component to show the banner
    useEffect(() => {
        // Create a custom event to open cookie settings
        const handleOpenCookieSettings = () => {
            setIsVisible(true)
        }

        window.addEventListener("openCookieSettings", handleOpenCookieSettings)

        return () => {
            window.removeEventListener(
                "openCookieSettings",
                handleOpenCookieSettings,
            )
        }
    }, [])

    // Export a function to trigger the cookie settings banner
    // Set up the global function in an effect with cleanup
    useEffect(() => {
        if (typeof window !== "undefined") {
            window.openCookieSettings = () => {
                window.dispatchEvent(new Event("openCookieSettings"))
            }

            // Cleanup function to remove the method when component unmounts
            return () => {
                window.openCookieSettings = undefined
            }
        }
    }, [])
    const handleCloseBanner = () => {
        setIsVisible(false)
    }

    return (
        <div>
            {isVisible && (
                <div className="fixed z-[200] bottom-0 left-0 right-0 sm:left-4 sm:bottom-4 w-full sm:max-w-md duration-700 transition-[opacity,transform] translate-y-0 opacity-100">
                    <div className="dark:bg-card bg-background rounded-md m-3 border border-border shadow-lg">
                        <div className="grid gap-2">
                            <div className="border-b border-border h-14 flex items-center justify-between p-4">
                                <h1 className="text-lg font-medium">
                                    Cookies op FDM
                                </h1>
                                <div className="flex gap-2">
                                    <Cookie className="h-[1.2rem] w-[1.2rem]" />
                                    {(consentGiven === "yes" ||
                                        consentGiven === "no") && (
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
                                    Wij gebruiken cookies enkel om FDM te
                                    verbeteren, zodat we weten wat er goed en
                                    fout gaat.
                                    <br />
                                    Geen zorgen, we gebruiken ze niet voor
                                    advertenties en ook niet om je online te
                                    volgen.
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
                                        href="/privacy"
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
            )}
        </div>
    )
}
