import type {
    AggregatedNormFillingsToFarmLevel,
    AggregatedNormsToFarmLevel,
} from "@svenvw/fdm-calculator"
import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"

const getProgressColorClass = (percentage: number) => {
    if (percentage >= 100) return "bg-red-500"
    return "bg-green-500"
}

interface ProgressBarProps {
    value: number
}

const ProgressBar = ({ value }: ProgressBarProps) => (
    <div className="h-2 w-full rounded-full bg-muted">
        <div
            className={`h-full rounded-full ${getProgressColorClass(value)}`}
            style={{ width: `${Math.min(value, 100)}%` }}
        />
    </div>
)

interface NormCardProps {
    title: string
    norm: number
    filling: number | undefined
    unit: string
}

function NormCard({ title, norm, filling, unit }: NormCardProps) {
    const fillingValue = filling || 0
    const percentage = norm > 0 ? (fillingValue / norm) * 100 : 0

    return (
        <Card>
            <CardHeader className="pb-4">
                <CardTitle className="text-base font-medium">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-baseline justify-between">
                    <div>
                        <div className="text-3xl font-bold">
                            {norm.toFixed(0)}
                        </div>
                        <p className="text-sm text-muted-foreground">{unit}</p>
                    </div>
                    {filling !== undefined && (
                        <div className="text-right">
                            <div className="text-lg font-semibold">
                                {fillingValue.toFixed(0)} kg
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Gebruikt
                            </p>
                        </div>
                    )}
                </div>
                {filling !== undefined && (
                    <div className="mt-4">
                        <ProgressBar value={percentage} />
                        <p className="mt-1 text-right text-sm text-muted-foreground">
                            {percentage.toFixed(0)}% gebruikt
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

interface FarmNormsProps {
    farmNorms: AggregatedNormsToFarmLevel
    farmFillings: AggregatedNormFillingsToFarmLevel | undefined
    hasFieldNormErrors: boolean
    fieldErrorMessages: string[]
}

export function FarmNorms({
    farmNorms,
    farmFillings,
    hasFieldNormErrors,
    fieldErrorMessages,
}: FarmNormsProps) {
    return (
        <div>
            {hasFieldNormErrors && (
                <Alert variant="destructive" className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Fouten bij perceelsnormen</AlertTitle>
                    <AlertDescription>
                        <p>
                            Voor één of meerdere percelen konden de
                            gebruiksnormen niet volledig worden berekend. De
                            totalen op bedrijfsniveau kunnen hierdoor afwijken.
                        </p>
                        <ul className="list-disc pl-5 mt-2 text-xs">
                            {fieldErrorMessages.map((msg) => (
                                <li key={msg}>{msg}</li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <NormCard
                    title="Stikstof, werkzaam"
                    norm={farmNorms.nitrogen}
                    filling={farmFillings?.nitrogen}
                    unit="kg N"
                />
                <NormCard
                    title="Fosfaat"
                    norm={farmNorms.phosphate}
                    filling={farmFillings?.phosphate}
                    unit="kg P₂O₅"
                />
                <NormCard
                    title="Stikstof uit dierlijke mest"
                    norm={farmNorms.manure}
                    filling={farmFillings?.manure}
                    unit="kg N"
                />
            </div>
        </div>
    )
}
