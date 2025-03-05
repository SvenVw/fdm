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

/**
 * Renders a card displaying fertilizer application data.
 *
 * The component shows a header with a title and a short label, and a content area presenting a rounded fertilizer value along with its unit. Tooltips for usage norm (limit) and fertilizer advice are conditionally rendered when their values are provided.
 *
 * @param title - Full title displayed in the header and tooltips.
 * @param shortname - Abbreviated name shown in the header.
 * @param value - Numeric fertilizer application value, rounded before display.
 * @param unit - Measurement unit appended to the value.
 * @param limit - Usage norm value; its tooltip is shown if defined.
 * @param advice - Fertilizer advice; its tooltip is shown if defined.
 */
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

/**
 * Constructs an array of fertilizer application card configuration objects.
 *
 * Using the provided dose information, this function creates configuration objects for
 * each fertilizer application card. Each object contains a title, short name, value, and unit,
 * while the limit and advice properties are set to undefined.
 *
 * @param dose - The dose data containing fertilizer application values.
 * @returns An array of fertilizer application card configuration objects.
 */
function constructCards(dose: Dose) {
    // Construct the fertilizer application cards
    const cards: FertilizerApplicationsCardProps[] = [
        {
            title: "Stikstof, totaal",
            shortname: "Ntot",
            value: dose.p_dose_n,
            unit: "kg/ha",
            limit: undefined,
            advice: undefined,
        },
        {
            title: "Stikstof, werkzaam",
            shortname: "Nw",
            value: dose.p_dose_nw,
            unit: "kg/ha",
            limit: undefined,
            advice: undefined,
        },
        {
            title: "Fosfaat, totaal",
            shortname: "P2O5",
            value: dose.p_dose_p2o5,
            unit: "kg/ha",
            limit: undefined,
            advice: undefined,
        },
        {
            title: "Kalium, totaal",
            shortname: "K2O",
            value: dose.p_dose_k2o,
            unit: "kg/ha",
            limit: undefined,
            advice: undefined,
        },
    ]

    return cards
}
