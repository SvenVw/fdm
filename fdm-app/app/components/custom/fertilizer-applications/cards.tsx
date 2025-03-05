import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { Dose } from "@svenvw/fdm-calculator"
import { Lightbulb, Scale } from "lucide-react"
import type { FertilizerApplicationsCardProps } from "./types.d"

function FertilizerApplicationsCard({
    title,
    shortname,
    value,
    unit,
    limit,
    advice,
}: FertilizerApplicationsCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <p className="text-xs text-muted-foreground">{shortname}</p>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-2xl font-bold">{`${Math.round(value)} ${unit}`}</div>
                <div className="grid grid-cols-2 items-center space-x-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div
                                    className={cn(
                                        "flex items-center space-x-2 text-muted-foreground justify-start",
                                        !limit ? "invisible" : "",
                                    )}
                                >
                                    <Scale />
                                    <p className="flex text-xs text-muted-foreground">
                                        <span>{`${limit}`}</span>
                                    </p>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                {`Gebruiksnorm voor ${title} [${unit}]`}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div
                                    className={cn(
                                        "flex items-center space-x-2 text-muted-foreground justify-end",
                                        !advice ? "invisible" : "",
                                    )}
                                >
                                    <Lightbulb />
                                    <p className="flex text-xs text-muted-foreground">
                                        <span>{`${advice}`}</span>
                                    </p>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                {`Bemestingsadvies voor ${title} [${unit}]`}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </CardContent>
        </Card>
    )
}

export function FertilizerApplicationsCards({ dose }: { dose: Dose }) {
    const cards = constructCards(dose)

    return (
        <div className="grid gap-4 xl:grid-cols-2">
            {cards.map((card: FertilizerApplicationsCardProps) => (
                <FertilizerApplicationsCard
                    key={card.title}
                    title={card.title}
                    shortname={card.shortname}
                    value={card.value}
                    unit={card.unit}
                    limit={card.limit}
                    advice={card.advice}
                />
            ))}
        </div>
    )
}

function constructCards(dose: Dose) {
    // Construct the fertilizer application cards
    const cards: FertilizerApplicationsCardProps[] = [
        {
            title: "Stikstof, totaal",
            shortname: "Ntot",
            value: dose.p_dose_n,
            unit: "kg/ha",
            limit: 250,
            advice: 200,
        },
        {
            title: "Fosfaat, totaal",
            shortname: "P2O5",
            value: dose.p_dose_p2o5,
            unit: "kg/ha",
            limit: 75,
            advice: 40,
        },
        {
            title: "Kalium, totaal",
            shortname: "K2O",
            value: dose.p_dose_k2o,
            unit: "kg/ha",
            limit: undefined,
            advice: 90,
        },
    ]

    return cards
}
