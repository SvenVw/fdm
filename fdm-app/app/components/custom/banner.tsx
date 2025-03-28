import { useEffect, useState } from "react"
import posthog from "posthog-js"
import { CookieIcon } from "lucide-react"
import { Button } from "../ui/button"

export function cookieConsentGiven() {
    if (!localStorage.getItem("cookie_consent")) {
        return "undecided"
    }
    return localStorage.getItem("cookie_consent") as "yes" | "no" | "undecided"
}

export function Banner() {
    const [consentGiven, setConsentGiven] = useState<
        "yes" | "no" | "undecided"
    >("undecided")

    useEffect(() => {
        setConsentGiven(cookieConsentGiven())
    }, [])

    useEffect(() => {
        if (consentGiven !== "undecided") {
            posthog.set_config({
                persistence:
                    consentGiven === "yes" ? "localStorage+cookie" : "memory",
            })
        }
    }, [consentGiven])

    const handleAcceptCookies = () => {
        localStorage.setItem("cookie_consent", "yes")
        setConsentGiven("yes")
    }

    const handleDeclineCookies = () => {
        localStorage.setItem("cookie_consent", "no")
        setConsentGiven("no")
    }

    return (
        <div>
            {consentGiven === "undecided" && (
                <div className="fixed z-[200] bottom-0 left-0 right-0 sm:left-4 sm:bottom-4 w-full sm:max-w-md duration-700 transition-[opacity,transform] translate-y-0 opacity-100">
                    <div className="dark:bg-card bg-background rounded-md m-3 border border-border shadow-lg">
                        <div className="grid gap-2">
                            <div className="border-b border-border h-14 flex items-center justify-between p-4">
                                <h1 className="text-lg font-medium">
                                    Cookies op FDM
                                </h1>
                                <CookieIcon className="h-[1.2rem] w-[1.2rem]" />
                            </div>
                            <div className="p-4">
                                <p className="text-sm font-normal text-start">
                                    Wij gebruiken cookies enkel om FDM te verbeteren,
                                    zodat we weten wat er goed en fout gaat.
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
                                        className="text-xs underline"
                                    >
                                        Meer over cookies.
                                    </a>
                                </p>
                            </div>
                            <div className="flex gap-2 p-4 py-5 border-t border-border dark:bg-background/20">
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
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
