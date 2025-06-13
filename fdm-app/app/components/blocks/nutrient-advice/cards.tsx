import { useState } from "react"
import type { NutrientDescription } from "./types"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Progress } from "~/components/ui/progress"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "~/components/ui/collapsible"
import { Button } from "~/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Separator } from "~/components/ui/separator"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { NavLink } from "react-router"
import { cn } from "@/app/lib/utils"

export function NutrientCard({
    description,
    advice,
    doses,
    fertilizerApplications,
    fertilizers,
    to,
}: {
    description: NutrientDescription
    advice: number
    doses: any
    fertilizerApplications: any
    fertilizers: any
    to: string
}) {
    const [isExpanded, setIsExpanded] = useState(false)
    const doseTotal = doses.dose[description.doseParameter]
    const percentage = advice > 0 ? (doseTotal / advice) * 100 : 0
    const numberOfApplicationsForNutrient = doses.applications.filter(
        (x) => x[description.doseParameter] > 0,
    ).length

    return (
        <Card className="relative">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-md">
                            {description.symbol}
                        </div>
                        <CardTitle className="text-lg">
                            {description.name}
                        </CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-center space-y-1">
                    <div className="text-4xl font-bold">
                        {advice.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {description.unit}
                    </div>
                </div>
                {advice > 0 && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Bemestingsniveau</span>
                            <span>{percentage.toFixed(0)}%</span>
                        </div>
                        <Progress
                            value={percentage}
                            className={cn(
                                percentage > 100 && description.symbol === "EOC"
                                    ? "[&>div]:bg-green-500 h-3"
                                    : percentage > 100
                                      ? "[&>div]:bg-orange-500  h-3"
                                      : "h-3",
                            )}
                        />
                    </div>
                )}

                {fertilizerApplications.length > 0 &&
                numberOfApplicationsForNutrient > 0 ? (
                    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                        <CollapsibleTrigger asChild>
                            <Button
                                variant="ghost"
                                className="w-full justify-between p-0 h-auto"
                            >
                                <span className="text-sm font-medium">
                                    Bemestingen
                                </span>
                                {isExpanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                ) : (
                                    <ChevronDown className="h-4 w-4" />
                                )}
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-2 mt-3">
                            <Separator />
                            <div className="space-y-3">
                                {doses.applications.map((app) => {
                                    const dose = app[description.doseParameter]
                                    if (dose === 0) {
                                        return null
                                    }
                                    const fertilizerApplication =
                                        fertilizerApplications.find(
                                            (x) => x.p_app_id === app.p_app_id,
                                        )
                                    const fertilizer = fertilizers.find(
                                        (x) =>
                                            x.p_id_catalogue ===
                                            fertilizerApplication.p_id_catalogue,
                                    )
                                    return (
                                        <div
                                            key={app.p_app_id}
                                            className="flex justify-between items-center p-2 bg-muted/50 rounded"
                                        >
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium">
                                                    <NavLink to={to}>
                                                        {fertilizer.p_name_nl}
                                                    </NavLink>
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {format(
                                                        fertilizerApplication.p_app_date,
                                                        "PP",
                                                        { locale: nl },
                                                    )}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold">
                                                    {dose.toFixed(0)}{" "}
                                                    {description.unit}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {
                                                        fertilizerApplication.p_app_amount
                                                    }
                                                    {" kg/ha"}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                ) : (
                    <p className="text-sm text-muted-foreground">{`Geen bemestingen met ${description.name.toLocaleLowerCase()}`}</p>
                )}
            </CardContent>
        </Card>
    )
}
