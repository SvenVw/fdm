import { ArrowLeft, Copy, Home } from "lucide-react"
import { Button } from "../ui/button"
import { NavLink } from "react-router"
import { useEffect, useState } from "react"

export function ErrorBlock({
    status,
    message,
    stacktrace,
    page,
    timestamp,
}: {
    status: number | null
    message: string | null
    stacktrace: string | null | undefined
    page: string
    timestamp: string
}) {
    const [isCopied, setIsCopied] = useState(false)

    useEffect(() => {
        if (isCopied) {
            const timer = setTimeout(() => setIsCopied(false), 5000)
            return () => clearTimeout(timer)
        }
    }, [isCopied])

    const errorDetails = JSON.stringify(
        {
            status,
            message,
            stacktrace,
            page,
            timestamp,
        },
        null,
        2,
    )
    const copyStackTrace = () => {
        navigator.clipboard.writeText(errorDetails)
        setIsCopied(true)
    }
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4">
            <div className="mb-8 overflow-hidden rounded-lg w-full max-w-md">
                <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/giphy-zaMc9sEWI1lqXlXSKSKR164AvQCUjf.webp"
                    alt="A red tractor doing a wheelie"
                    className="w-full rounded-lg"
                />
            </div>
            <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                {status === 404
                    ? "Aii, deze pagina bestaat niet."
                    : "Oeps, er lijkt iets mis te zijn."}
            </h1>
            <p className="text-xl mb-8 text-center text-gray-600 dark:text-gray-400">
                {status === 404
                    ? "Het lijkt erop dat de pagina die je zoekt niet bestaat."
                    : "Er is onverwachts wat fout gegaan. Probeer eerst opnieuw. Als het niet opnieuw lukt, kopieer dan de foutmelding en neem contact op met Ondersteuning."}
            </p>

            {status === 404 ? (
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button asChild>
                        <NavLink to="/">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Terug naar
                            vorige pagina
                        </NavLink>
                    </Button>
                    <Button variant="outline" asChild>
                        <NavLink to="/">
                            <Home className="mr-2 h-4 w-4" /> Terug naar de
                            hoofdpagina
                        </NavLink>
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button asChild>
                        <NavLink to="/">
                            <Home className="mr-2 h-4 w-4" /> Terug naar de
                            hoofdpagina
                        </NavLink>
                    </Button>
                    <Button variant="outline" onClick={copyStackTrace}>
                        <Copy className="mr-2 h-4 w-4" />
                        {isCopied ? "Gekopieerd!" : "Kopieer foutmelding"}
                    </Button>
                </div>
            )}
            {message ? (
                <div className="mt-8 w-full max-w-2xl">
                    <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                        Foutmelding:
                    </h2>
                    <pre className="bg-gray-200 dark:bg-gray-800 p-4 rounded-md overflow-x-auto text-sm text-gray-800 dark:text-gray-200">
                        {errorDetails}
                    </pre>
                </div>
            ) : (
                <p className="mt-8 text-gray-600 dark:text-gray-400">
                    Er zijn helaas geen details over de fout beschikbaar.
                </p>
            )}
        </div>
    )
}
