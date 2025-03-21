import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import type {
    CurrentSoilData,
    SoilParameterDescription,
} from "@svenvw/fdm-core"
import { Calendar, Microscope, Pencil, Sparkles, User } from "lucide-react"
import { NavLink } from "react-router"
import { format } from "date-fns/format"
import { nl } from "date-fns/locale/nl"

function SoilDataCard({
    title,
    shortname,
    value,
    unit,
    type,
    link,
    date,
    source,
}: {
    title: string
    shortname: string
    value: number | string
    unit: string
    type: "numeric" | "enum"
    link: string
    date: Date
    source: string
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 space-x-2">
                <CardTitle className="text-sm font-medium">
                    {shortname}
                </CardTitle>
                {source !== "NMI" ? (
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
                        <div className="text-2xl font-bold">{value}</div>
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
                                    {source === "NMI" ? (
                                        <Sparkles className="h-4 w-4" />
                                    ) : source === "" || !source ? (
                                        <User className="h-4 w-4" />
                                    ) : (
                                        <Microscope className="h-4 w-4" />
                                    )}
                                    <span>
                                        {source === "NMI"
                                            ? "NMI"
                                            : source === "" || !source
                                              ? "Onbekend"
                                              : source}
                                    </span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                {source === "NMI"
                                    ? "Geschat door NMI"
                                    : source === "" || !source
                                      ? "Onbekende bron"
                                      : `Gemeten door ${source}`}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div
                                    className={cn(
                                        "flex items-center space-x-1",
                                        !date || source === "NMI"
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
            {cards.map((card) => (
                <SoilDataCard
                    key={card.title}
                    title={card.title}
                    shortname={card.shortname}
                    value={card.value}
                    unit={card.unit}
                    type={card.type}
                    link={card.link}
                    date={card.date}
                    source={card.source}
                />
            ))}
        </div>
    )
}

function constructSoilDataCards(
    currentSoilData: CurrentSoilData,
    soilParameterDescription: SoilParameterDescription,
) {
    // Construct the soil data cards
    // console.log(currentSoilData)
    // console.log(soilParameterDescription)
    const cardValues = currentSoilData.map((item) => {
        const description = soilParameterDescription.find((x) => {
            return x.parameter === item.parameter
        })
        const cardValue = {
            title: description.name,
            shortname: description.description,
            value: item.value,
            unit: description.unit,
            type: description.type,
            link: `./analysis/${item.a_id}`,
            date: item.b_sampling_date,
            source: item.a_source,
        }

        return cardValue
    })

    return cardValues
}
