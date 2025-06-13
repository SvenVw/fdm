import { ArrowDownToLine, Gauge, Leaf, Sprout } from "lucide-react"
import { Card, CardContent, CardFooter } from "~/components/ui/card"
import type { NutrientDescription } from "./types"
import { Badge } from "~/components/ui/badge"
import type { Dose } from "@svenvw/fdm-calculator"
import type { FertilizerApplication } from "@svenvw/fdm-core"

/**
 * Props for the NutrientKPICardForTotalApplications component.
 * @param doses - The applied doses of the nutrient.
 * @param fertilizerApplications - The list of fertilizer applications.
 */
export type NutrientKPICardForTotalApplicationsProps = {
    doses: {
        dose: Record<string, number>
        applications: Dose[]
    }
    fertilizerApplications: FertilizerApplication[]
}

/**
 * A card that displays the total number of fertilizer applications.
 * @param props - The props for the component.
 */
export function NutrientKPICardForTotalApplications({
    doses,
    fertilizerApplications,
}: NutrientKPICardForTotalApplicationsProps) {
    const numberOfFertilizerApplications = fertilizerApplications.length
    const numberOfNutrientsApplied = Object.values(doses.dose).filter(
        (value) => value > 0,
    ).length
    return (
        <Card className="border-l-4 border-l-primary">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                                Aantal bemestingen
                            </span>
                        </div>
                        <p className="text-2xl font-bold">
                            {numberOfFertilizerApplications}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {numberOfNutrientsApplied === 1
                                ? `Voor ${numberOfNutrientsApplied} nutriënt`
                                : `Voor ${numberOfNutrientsApplied} nutriënten`}
                        </p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-full">
                        <ArrowDownToLine className="h-6 w-6 text-primary" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

/**
 * Props for the NutrientKPICardForNutrientDeficit component.
 * @param descriptions - The descriptions of the nutrients.
 * @param advices - The recommended amounts of the nutrients.
 * @param doses - The applied doses of the nutrients.
 */
export type NutrientKPICardForNutrientDeficitProps = {
    descriptions: NutrientDescription[]
    advices: Record<string, number>
    doses: {
        dose: Record<string, number>
        applications: Dose[]
    }
}

/**
 * A card that displays the nutrients that are in deficit.
 * @param props - The props for the component.
 */
export function NutrientKPICardForNutrientDeficit({
    descriptions,
    advices,
    doses,
}: NutrientKPICardForNutrientDeficitProps) {
    const deficitThreshold = 90

    const deficitNutrients = descriptions
        .map((nutrient: NutrientDescription) => {
            const adviceParameter = nutrient.adviceParameter
            const doseParameter = nutrient.doseParameter

            const dose = doses.dose[doseParameter]
            const advice = advices[adviceParameter]

            const percentage = advice ? (dose / advice) * 100 : 0
            if (percentage < deficitThreshold) {
                return nutrient.symbol
            }
            return null
        })
        .filter((x) => x !== null)

    return (
        <Card
            className={
                deficitNutrients.length > 0
                    ? "border-l-4 border-l-red-500"
                    : "border-l-4 border-l-green-500"
            }
        >
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Gauge className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                                Risico voor opbrengst
                            </span>
                        </div>
                        <p className="text-2xl font-bold">
                            {deficitNutrients.length}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {deficitNutrients.map((symbol) => (
                                <Badge
                                    key={symbol}
                                    variant="outline"
                                    className="text-xs"
                                >
                                    {symbol}
                                </Badge>
                            ))}
                        </div>
                    </div>
                    <div
                        className={
                            deficitNutrients.length > 0
                                ? "p-3 bg-red-500/10 rounded-full"
                                : "p-3 bg-green-500/10 rounded-full"
                        }
                    >
                        <Sprout
                            className={
                                deficitNutrients.length > 0
                                    ? "h-6 w-6 text-red-500"
                                    : "h-6 w-6 text-green-500"
                            }
                        />
                    </div>
                </div>
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">
                {deficitNutrients.length > 0
                    ? "Minder geven dan geadviseerd kan leiden tot opbrengstverlies"
                    : ""}
            </CardFooter>
        </Card>
    )
}

/**
 * Props for the NutrientKPICardForNutrientExcess component.
 * @param descriptions - The descriptions of the nutrients.
 * @param advices - The recommended amounts of the nutrients.
 * @param doses - The applied doses of the nutrients.
 */
export type NutrientKPICardForNutrientExcessProps = {
    descriptions: NutrientDescription[]
    advices: Record<string, number>
    doses: {
        dose: Record<string, number>
        applications: Dose[]
    }
}

/**
 * A card that displays the nutrients that are in excess.
 * @param props - The props for the component.
 */
export function NutrientKPICardForNutrientExcess({
    descriptions,
    advices,
    doses,
}: NutrientKPICardForNutrientExcessProps) {
    const excessThreshold = 105

    const excessNutrients = descriptions
        .map((nutrient: NutrientDescription) => {
            const adviceParameter = nutrient.adviceParameter
            const doseParameter = nutrient.doseParameter

            const dose = doses.dose[doseParameter]
            const advice = advices[adviceParameter]

            const percentage = advice ? (dose / advice) * 100 : 0
            if (percentage >= excessThreshold) {
                return nutrient.symbol
            }
            return null
        })
        .filter((x) => x !== null && x !== "EOC")

    return (
        <Card
            className={
                excessNutrients.length > 0
                    ? "border-l-4 border-l-orange-500"
                    : "border-l-4 border-l-green-500"
            }
        >
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Gauge className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                                Risico voor milieu
                            </span>
                        </div>
                        <p className="text-2xl font-bold">
                            {excessNutrients.length}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {excessNutrients.map((symbol) => (
                                <Badge
                                    key={symbol}
                                    variant="outline"
                                    className="text-xs"
                                >
                                    {symbol}
                                </Badge>
                            ))}
                        </div>
                    </div>
                    <div
                        className={
                            excessNutrients.length > 0
                                ? "p-3 bg-orange-500/10 rounded-full"
                                : "p-3 bg-green-500/10 rounded-full"
                        }
                    >
                        <Leaf
                            className={
                                excessNutrients.length > 0
                                    ? "h-6 w-6 text-orange-500"
                                    : "h-6 w-6 text-green-500"
                            }
                        />
                    </div>
                </div>
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">
                {excessNutrients.length > 0
                    ? "Meer geven dan geadviseerd kan leiden tot verlies naar milieu"
                    : ""}
            </CardFooter>
        </Card>
    )
}
