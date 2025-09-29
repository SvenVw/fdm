import { Copy, Home, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"
import { NavLink } from "react-router"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert"

/**
 * Displays an error block with tailored messaging and navigation options.
 * It can be used as a full-screen error or within a component.
 *
 * @param status - HTTP status code of the error or null.
 * @param message - Detailed error message, or null if not available.
 * @param stacktrace - Optional stack trace providing additional error context.
 * @param page - The page where the error occurred.
 * @param timestamp - The timestamp when the error was recorded.
 * @param actions - Optional array of action buttons to display. Each action should have a `label`, `onClick` function, and an optional `icon`.
 */
export function ErrorBlock({
    status,
    message,
    stacktrace,
    page,
    timestamp,
    actions,
}: {
    status: number | null
    message: string | null
    stacktrace: string | null | undefined
    page: string
    timestamp: string
    actions?: { label: string; onClick: () => void; icon?: React.ReactNode; variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" }[]
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

    const isNetworkError = status === 502 || status === 503 || status === 504 || !status;

    const defaultActions = [];

    if (isNetworkError) {
        defaultActions.push({
            label: "Pagina herladen",
            onClick: () => window.location.reload(),
            icon: <RefreshCw className="mr-2 h-4 w-4" />,
            variant: "default" as const,
        });
    }

    defaultActions.push(
        {
            label: "Terug naar de hoofdpagina",
            onClick: () => {
                window.location.href = "/"
            },
            icon: <Home className="mr-2 h-4 w-4" />,
            variant: "outline" as const,
        },
        {
            label: isCopied ? "Gekopieerd!" : "Kopieer foutmelding",
            onClick: () => {
                navigator.clipboard.writeText(errorDetails)
                setIsCopied(true)
            },
            icon: <Copy className="mr-2 h-4 w-4" />,
            variant: "ghost" as const,
        },
    );

    const currentActions = actions || defaultActions;

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <Card className="w-full max-w-md overflow-hidden"> {/* Added overflow-hidden to Card */}
                <CardHeader className="text-center">
                    <div className="relative w-full h-24 mb-4"> {/* Removed overflow-hidden from inner div */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 text-6xl animate-tractor-drive">
                            🚜
                        </div>
                    </div>
                    <CardTitle>
                        {status === 404
                            ? "Oeps, deze pagina bestaat niet."
                            : "Er ging iets mis."}
                    </CardTitle>
                    <CardDescription>
                        {status === 404
                            ? "Het lijkt erop dat de pagina die je zoekt niet bestaat. Geen zorgen, we helpen je graag verder!"
                            : "Er is een onverwachte fout opgetreden. Probeer het opnieuw of neem contact op met ondersteuning als het probleem aanhoudt."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    <div className="flex flex-wrap justify-center gap-4">
                        {currentActions.map((action, index) => (
                            <Button key={`${action.label}-${index}`} onClick={action.onClick} variant={action.variant}>
                                {action.icon}
                                {action.label}
                            </Button>
                        ))}
                    </div>

                    {message && (
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="error-details">
                                <AccordionTrigger>Foutmelding details</AccordionTrigger>
                                <AccordionContent>
                                    <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto text-sm text-gray-800 dark:text-gray-200">
                                        {errorDetails}
                                    </pre>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
