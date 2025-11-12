/**
 * @file This file defines the `ErrorBlock` component, which is used as a full-page
 * display for handling and presenting application errors to the user.
 *
 * @packageDocumentation
 */
import { ArrowLeft, Copy, Home } from "lucide-react"
import { useEffect, useState } from "react"
import { NavLink } from "react-router"
import { Button } from "~/components/ui/button"

/**
 * Props for the `ErrorBlock` component.
 */
interface ErrorBlockProps {
    /** The HTTP status code of the error (e.g., 404, 500). */
    status: number | null
    /** A descriptive message for the error. */
    message: string | null
    /** An optional stack trace or additional error data. */
    stacktrace: string | null | undefined
    /** The URL of the page where the error occurred. */
    page: string
    /** The ISO timestamp of when the error was recorded. */
    timestamp: string
}

/**
 * A full-screen error component that provides user-friendly feedback and actions.
 *
 * This component adapts its content based on the error `status`.
 * - For a `404` status, it displays a "Page Not Found" message with navigation
 *   buttons to go back or to the homepage.
 * - For all other statuses, it displays a generic error message and provides a button
 *   to copy the detailed error information to the clipboard, which is useful for
 *   support and debugging.
 *
 * The detailed error information is displayed in a formatted `<pre>` block if available.
 */
export function ErrorBlock({
    status,
    message,
    stacktrace,
    page,
    timestamp,
}: ErrorBlockProps) {
    const [isCopied, setIsCopied] = useState(false)

    useEffect(() => {
        if (isCopied) {
            const timer = setTimeout(() => setIsCopied(false), 5000)
            return () => clearTimeout(timer)
        }
    }, [isCopied])

    const errorDetails = JSON.stringify(
        { status, message, stacktrace, page, timestamp },
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
            {message && (
                <div className="mt-8 w-full max-w-2xl">
                    <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                        Foutmelding:
                    </h2>
                    <pre className="bg-gray-200 dark:bg-gray-800 p-4 rounded-md overflow-x-auto text-sm text-gray-800 dark:text-gray-200">
                        {errorDetails}
                    </pre>
                </div>
            )}
            {status !== 404 && !message && (
                <p className="mt-8 text-gray-600 dark:text-gray-400">
                    Er zijn helaas geen details over de fout beschikbaar.
                </p>
            )}
        </div>
    )
}
