import { AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "~/components/ui/tooltip"

interface FarmNormsProps {
    farmNorms: {
        manure: number
        phosphate: number
        nitrogen: number
    }
    hasFieldNormErrors: boolean
    fieldErrorMessages: string[]
}

export function FarmNorms({
    farmNorms,
    hasFieldNormErrors,
    fieldErrorMessages,
}: FarmNormsProps) {
    return (
        <div className="mb-0">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                {hasFieldNormErrors && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    aria-label="Gebruiksnorm fouten op percelen"
                                    className="inline-flex"
                                >
                                    <AlertTriangle
                                        className="h-5 w-5 text-amber-600"
                                        aria-hidden="true"
                                    />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-md">
                                <p className="font-medium">
                                    Voor sommige percelen zijn de gebruiksnormen
                                    niet volledig berekend:
                                </p>
                                <ul className="list-disc pl-5 mt-2 text-sm">
                                    {fieldErrorMessages.map((msg) => (
                                        <li key={msg}>{msg}</li>
                                    ))}
                                </ul>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
                Bedrijfsniveau
            </h2>
            <div className="grid gap-4 xl:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Stikstof
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {farmNorms.nitrogen} kg N
                        </div>
                        {/* <p className="text-xs text-muted-foreground"></p> */}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Fosfaat
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {farmNorms.phosphate} kg P2O5
                        </div>
                        {/* <p className="text-xs text-muted-foreground"></p> */}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Stikstof uit dierlijke mest
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {farmNorms.manure} kg N
                        </div>
                        {/* <p className="text-xs text-muted-foreground"></p> */}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
