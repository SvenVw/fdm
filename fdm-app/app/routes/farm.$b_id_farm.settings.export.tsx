import { getFarm } from "@svenvw/fdm-core"
import { format } from "date-fns"
import { Download, FileJson, Info, ExternalLink } from "lucide-react"
import { useState } from "react"
import {
    Link,
    type LoaderFunctionArgs,
    type MetaFunction,
    data,
    useLoaderData,
} from "react-router"
import { toast } from "sonner"
import { Button } from "~/components/ui/button"
import { Separator } from "~/components/ui/separator"
import { Spinner } from "~/components/ui/spinner"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "~/components/ui/card"
import { getSession } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: `Exporteren - Instellingen - Bedrijf | ${clientConfig.name}` },
        {
            name: "description",
            content: "Exporteer je bedrijfsgegevens als JSON.",
        },
    ]
}

/**
 * Loads farm details for the export page.
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw data("Farm ID is required", { status: 400 })
        }

        const session = await getSession(request)

        const farm = await getFarm(fdm, session.principal_id, b_id_farm)
        if (!farm) {
            throw data("Farm not found", { status: 404 })
        }

        return {
            farm,
            b_id_farm,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

export default function FarmSettingsExportBlock() {
    const { farm, b_id_farm } = useLoaderData<typeof loader>()
    const [isExporting, setIsExporting] = useState(false)

    const handleDownloadJson = async () => {
        if (isExporting) return

        setIsExporting(true)
        toast.info("Export wordt voorbereid", {
            description: "Dit kan enkele seconden duren...",
        })

        try {
            const response = await fetch(
                `/farm/${b_id_farm}/settings/export/data`,
            )
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.message || "Export failed")
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const filename = `${clientConfig.name}_${b_id_farm}_${format(new Date(), "yyyy-MM-dd")}.json`

            const a = document.createElement("a")
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            toast.success("Download voltooid")
        } catch (error) {
            console.error(error)
            toast.error("Er ging iets mis bij het genereren van de export")
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card className="overflow-hidden border-border/50 shadow-sm">
                <CardHeader className="bg-muted/30 pb-8">
                    <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-xl">
                            <FileJson className="h-8 w-8 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle>JSON gegevensexport</CardTitle>
                            <CardDescription>
                                Een export van{" "}
                                <strong>{farm.b_name_farm}</strong> in het Farm
                                Data Model formaat.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pt-8 space-y-8">
                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                <Info className="h-4 w-4 text-primary" />
                                Inhoud van de export
                            </h4>
                            <ul className="grid grid-cols-1 gap-2 text-sm text-muted-foreground">
                                <li className="flex items-start gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                                    <span>Bedrijfsgegevens</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                                    <span>Percelen inclusief geometrie</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                                    <span>Teelt- en oogsgegevens</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                                    <span>Meststoffen en bemestingen</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                                    <span>Bodemanalyses</span>
                                </li>
                            </ul>
                        </div>

                        <div className="space-y-4 bg-primary/5 p-6 rounded-xl border border-primary/10">
                            <h4 className="text-sm font-semibold">
                                Meer informatie
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Het Farm Data Model (FDM) is een open standaard
                                voor de uitwisseling van agrarische data. Het
                                doel is om eenvoudig data uit te kunnen wisselen
                                om beter inzicht te kunnen krijgen.
                            </p>
                            <Button
                                variant="link"
                                className="p-0 h-auto text-xs gap-1.5"
                                asChild
                            >
                                <Link
                                    to="https://svenvw.github.io/fdm/"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Lees meer over het Farm Data Model{" "}
                                    <ExternalLink className="h-3 w-3" />
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <Separator className="bg-border/50" />
                </CardContent>

                <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/10 pt-2 pb-6 px-6">
                    <p className="text-xs text-muted-foreground max-w-[280px] text-center sm:text-left">
                        Je downloadt een enkel JSON bestand. Je kunt dit bestand
                        gebruiken als backup, om je data te integreren met
                        andere software of om later weer te importerenn.
                    </p>
                    <Button
                        type="button"
                        disabled={isExporting}
                        onClick={handleDownloadJson}
                        size="lg"
                        className="w-full sm:w-auto shadow-sm"
                    >
                        {isExporting ? (
                            <Spinner className="mr-2" />
                        ) : (
                            <Download className="mr-2 h-4 w-4" />
                        )}
                        {isExporting
                            ? "Bezig met voorbereiden..."
                            : "Start gegevensexport"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
