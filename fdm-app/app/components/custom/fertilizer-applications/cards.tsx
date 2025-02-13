import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Lightbulb, Scale } from "lucide-react"
import type { FertilizerApplicationsCardProps } from "./types.d"
import { cn } from "@/lib/utils"

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
                <div className="text-2xl font-bold">{`${value} ${unit}`}</div>
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
                                        <span>{`${limit} ${unit}`}</span>
                                    </p>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                {`Gebruiksnorm voor ${title}`}
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
                                        <span>{`${advice} ${unit}`}</span>
                                    </p>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                {`Bemestingsadvies voor ${title}`}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </CardContent>
        </Card>
    )
}

export function FertilizerApplicationsCards({
    cards,
}: { cards: FertilizerApplicationsCardProps[] }) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
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
