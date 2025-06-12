import { ArrowDownToLine,} from "lucide-react"
import { Card, CardContent } from "../../ui/card"

export function NutrientKPICardForTotalApplications({
    doses,
    fertilizerApplications,
}: {
    doses: any
    fertilizerApplications: any
}) {
    const numberOfFertilizerApplications = fertilizerApplications.length
    const numberOfNutrientsApplied = Object.values(doses.dose).filter(
        (value) => value > 0,
    ).length
    console.log(numberOfNutrientsApplied)
    return (
        <Card className="border-l-4 border-l-primary">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            {/* <Package className="h-4 w-4 text-muted-foreground" /> */}
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
