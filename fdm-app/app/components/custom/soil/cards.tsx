import type {
    CurrentSoilData,
    SoilParameterDescription,
} from "@svenvw/fdm-core"
import { format } from "date-fns/format"
import { nl } from "date-fns/locale/nl"
import { Calendar, Microscope, Pencil, Sparkles, User } from "lucide-react"
import { NavLink } from "react-router"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "~/components/ui/tooltip"
import { cn } from "~/lib/utils"

function SoilDataCard({
    title,
    shortname,
    value,
    label,
    unit,
    type,
    link,
    date,
    source,
    sourceLabel,
}: {
    title: string
    shortname: string
    value: number | string
    label: string | undefined
    unit: string
    type: "numeric" | "enum"
    link: string
    date: Date
    source: string
    sourceLabel: string
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 space-x-2">
                <CardTitle className="text-sm font-medium">
                    {shortname}
                </CardTitle>
                {source !== "nl-other-nmi" ? (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <NavLink to={link} className="h-4 w-4">
                                    <Pencil className="text-xs text-muted-foreground h-full w-full" />
                                </NavLink>
                            </TooltipTrigger>
                            <TooltipContent>Bewerken</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ) : null}
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="flex items-baseline space-x-2">
                    {type === "enum" ? (
                        <div className="text-2xl font-bold">
                            {label && type === "enum" ? label : value}
                        </div>
                    ) : (
                        <>
                            <div className="text-2xl font-bold">{`${Math.round(value as number)}`}</div>
                            <div className="text-sm text-muted-foreground">
                                {unit}
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div
                                    className={cn(
                                        "flex items-center space-x-1",
                                        !source ? "invisible" : "",
                                    )}
                                >
                                    {source === "nl-other-nmi" ? (
                                        <Sparkles className="h-4 w-4" />
                                    ) : source === "other" || !source ? (
                                        <User className="h-4 w-4" />
                                    ) : (
                                        <Microscope className="h-4 w-4" />
                                    )}
                                    <span>
                                        {(() => {
                                            if (!source) return "Onbekend"
                                            return sourceLabel
                                        })()}
                                    </span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                {source === "nl-other-nmi"
                                    ? `Geschat met ${sourceLabel}`
                                    : source === "other" || !source
                                      ? "Onbekende bron"
                                      : `Gemeten door ${sourceLabel}`}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div
                                    className={cn(
                                        "flex items-center space-x-1",
                                        !date || source === "nl-other-nmi"
                                            ? "invisible"
                                            : "",
                                    )}
                                >
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                        {format(date, "P", { locale: nl })}
                                    </span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                {`Bemonsterd op: ${format(date, "PPP", {
                                    locale: nl,
                                })}`}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </CardContent>
        </Card>
    )
}

export function SoilDataCards({
    currentSoilData,
    soilParameterDescription,
}: {
    currentSoilData: CurrentSoilData
    soilParameterDescription: SoilParameterDescription
}) {
    const cards = constructSoilDataCards(
        currentSoilData,
        soilParameterDescription,
    )
    return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl2:grid-cols-3 xl3:grid-cols-5">
            {cards.map(
                (card: {
                    title: string
                    shortname: string
                    value: string | number | undefined
                    label: string | undefined
                    unit: string
                    type: "numeric" | "enum"
                    link: string
                    date: Date
                    source: string
                    sourceLabel: string
                }) => {
                    if (card.value) {
                        const sourceParam = soilParameterDescription.find(
                            (x: { parameter: string }) => x.parameter === "a_source",
                        )
                        const sourceOption = sourceParam?.options?.find(
                            (x: { value: string }) => x.value === card.source,
                        )
                        const sourceLabel =
                            sourceOption?.label || card.source || "Onbekend"

                        return (
                            <SoilDataCard
                                key={card.title}
                                title={card.title}
                                shortname={card.shortname}
                                value={card.value}
                                label={card.label}
                                unit={card.unit}
                                type={card.type}
                                link={card.link}
                                date={card.date}
                                source={card.source}
                                sourceLabel={sourceLabel}
                            />
                        )
                    }
                },
            )}
        </div>
    )
}

function constructSoilDataCards(
    currentSoilData: CurrentSoilData,
    soilParameterDescription: SoilParameterDescription,
) {
    // Construct the soil data cards
    const cardValues = currentSoilData.map(
        (item: {
            parameter: string
            value: string | number | undefined
            a_id: string
            b_sampling_date: Date
            a_source: string
        }) => {
            const description = soilParameterDescription.find(
                (x: { parameter: string }) => {
                    return x.parameter === item.parameter
                },
            )

            if (!description) {
                console.warn(
                    `No description found for parameter: ${item.parameter}`,
                )
                return null
            }

            let label = undefined
            if (description.type === "enum") {
                label = description.options?.find(
                    (option: { value: string }) => option.value === item.value,
                )?.label
            }

            const cardValue = {
                title: description.name,
                shortname: description.description,
                value: item.value,
                label: label,
                unit: description.unit,
                type: description.type,
                link: `./analysis/${item.a_id}`,
                date: item.b_sampling_date,
                source: item.a_source,
            }

            return cardValue
        },
    )
    return cardValues.filter(Boolean)
}
