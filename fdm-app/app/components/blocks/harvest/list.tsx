import type { Cultivation, Harvest, HarvestParameters } from "@svenvw/fdm-core"
import { getParametersForHarvestCat } from "@svenvw/fdm-core"
import { format } from "date-fns/format"
import { NavLink } from "react-router-dom"
import type { HarvestableType } from "./types"
import { nl } from "date-fns/locale/nl"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../../ui/card"
import { Label } from "../../ui/label"
import { getHarvestParameterLabel } from "./parameters"
import { Button } from "../../ui/button"
import { ArrowRight, Calendar, Info, PlusCircle } from "lucide-react"
import { Badge } from "../../ui/badge"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../../ui/tooltip"
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "../../ui/empty"

export function HarvestsList({
    harvests,
    b_lu_harvestable,
    harvestParameters,
}: {
    harvests: Harvest[]
    b_lu_harvestable: HarvestableType
    harvestParameters: HarvestParameters
}) {
    const canAddHarvest =
        b_lu_harvestable === "multiple" ||
        (b_lu_harvestable === "once" && harvests.length === 0)

    const renderHarvestDetails = (harvest: Harvest) => (
        <div className="grid grid-cols-2 gap-4 pt-4">
            {harvestParameters.map((param: string) => (
                <div key={param}>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Label className="text-xs text-muted-foreground">
                                    {getHarvestParameterLabel(param)}
                                </Label>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{getHarvestParameterLabel(param)}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <p className="text-sm font-medium leading-none">
                        {harvest.harvestable?.harvestable_analyses?.[0]?.[
                            param
                        ] ?? "–"}
                    </p>
                </div>
            ))}
        </div>
    )

    const renderHarvestSummary = (harvest: Harvest) => (
        <div className="flex items-center justify-between">
            <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-md font-medium">
                    {format(harvest.b_lu_harvest_date, "PPP", {
                        locale: nl,
                    })}
                </span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>
    )

    if (harvests && harvests.length > 0) {
        if (b_lu_harvestable === "once") {
            const harvest = harvests[0]
            return (
                <Card className="w-full">
                    <CardHeader>{renderHarvestSummary(harvest)}</CardHeader>
                    <CardContent>{renderHarvestDetails(harvest)}</CardContent>
                </Card>
            )
        }
        return (
            <div className="space-y-3">
                {harvests.map((harvest) => {
                    const analyses =
                        harvest.harvestable?.harvestable_analyses?.[0]
                    const summaryParams: { label: string; value: any }[] = []
                    if (analyses) {
                        for (const param of harvestParameters) {
                            const value = analyses[param]
                            if (value !== null && value !== undefined) {
                                summaryParams.push({
                                    label: getHarvestParameterLabel(param),
                                    value: value,
                                })
                            }
                            if (summaryParams.length >= 2) {
                                break
                            }
                        }
                    }

                    return (
                        <NavLink
                            key={harvest.b_id_harvesting}
                            to={`./harvest/${harvest.b_id_harvesting}`}
                            className="block rounded-lg"
                        >
                            <Card className="transition-all hover:bg-muted/50">
                                <CardHeader>
                                    {renderHarvestSummary(harvest)}
                                </CardHeader>
                                {summaryParams.length > 0 && (
                                    <CardContent className="pt-0">
                                        <div className="flex items-center space-x-6">
                                            {summaryParams.map((p) => (
                                                <div key={p.label}>
                                                    <p className="text-xs text-muted-foreground">
                                                        {p.label}
                                                    </p>
                                                    <p className="text-sm font-semibold">
                                                        {p.value}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        </NavLink>
                    )
                })}
            </div>
        )
    }

    if (canAddHarvest) {
        return (
            <Empty>
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <PlusCircle />
                    </EmptyMedia>
                    <EmptyTitle>Nog geen oogst</EmptyTitle>
                    <EmptyDescription>
                        Voeg een oogst toe om belangrijke gegevens zoals
                        opbrengst, datum en gehaltes bij te houden.
                    </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                    <Button size="sm">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Voeg oogst toe
                    </Button>
                </EmptyContent>
            </Empty>
        )
    }

    return (
        <Empty>
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <Info />
                </EmptyMedia>
                <EmptyTitle>Dit gewas is niet oogstbaar</EmptyTitle>
                <EmptyDescription>
                    Kies een einddatum om aan te geven wanneer dit gewas is
                    beëindigd.
                </EmptyDescription>
            </EmptyHeader>
        </Empty>
    )
}
