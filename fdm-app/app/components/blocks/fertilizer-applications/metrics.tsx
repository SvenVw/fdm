import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import {
    Item,
    ItemContent,
    ItemDescription,
    ItemGroup,
    ItemSeparator,
    ItemTitle,
} from "~/components/ui/item"
import { Progress } from "~/components/ui/progress"

export function FertilizerApplicationMetricsCard() {
    // Mock data for demonstration
    const mockNorms = {
        nitrogen: { current: 200, total: 230 },
        phosphate: { current: 40, total: 230 },
        animalManure: { current: 120, total: 170 },
    }

    const mockNitrogenBalance = {
        supply: 200,
        removal: 40,
        emission: 10,
        balance: 150,
        target: 125,
        task: -25,
    }

    const mockFertilizationAdvice = {
        nitrogen: { current: 200, total: 230 },
        phosphate: { current: 40, total: 230 },
        potassium: { current: 120, total: 170 },
    }

    const getNormsProgressColor = (current: number, total: number) => {
        const percentage = (current / total) * 100
        if (percentage > 100) return "red-500"
        return "green-500"
    }

    const getAdviceProgressColor = (current: number, total: number) => {
        const percentage = (current / total) * 100
        if (percentage < 80) return "orange-500"
        if (percentage >= 80 && percentage <= 105) return "green-500"
        if (percentage > 105) return "orange-500"
        return "gray-500" // Default or error color
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    Bemestingsplanner
                </CardTitle>
                <CardDescription>
                    Bekijk de impact van uw bemestingen.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <ItemGroup>
                        <ItemSeparator />
                        <Item>
                            <ItemContent>
                                <ItemTitle>Gebruiksnormen</ItemTitle>
                            </ItemContent>
                            <ItemDescription>
                                <div className="flex flex-col space-y-2">
                                    <div className="flex flex-row justify-between">
                                        <p>Stikstof</p>
                                        <span>
                                            {mockNorms.nitrogen.current} /{" "}
                                            {mockNorms.nitrogen.total} kg N
                                        </span>
                                    </div>
                                    <Progress
                                        value={
                                            (mockNorms.nitrogen.current /
                                                mockNorms.nitrogen.total) *
                                            100
                                        }
                                        colorBar={getNormsProgressColor(
                                            mockNorms.nitrogen.current,
                                            mockNorms.nitrogen.total,
                                        )}
                                        className="h-2"
                                    />

                                    <div className="flex flex-row justify-between">
                                        <p>Fosfaat</p>
                                        <span>
                                            {mockNorms.phosphate.current} /{" "}
                                            {mockNorms.phosphate.total} kg P₂O₅
                                        </span>
                                    </div>
                                    <Progress
                                        value={
                                            (mockNorms.phosphate.current /
                                                mockNorms.phosphate.total) *
                                            100
                                        }
                                        colorBar={getNormsProgressColor(
                                            mockNorms.phosphate.current,
                                            mockNorms.phosphate.total,
                                        )}
                                        className="h-2"
                                    />

                                    <div className="flex flex-row justify-between">
                                        <p>Dierlijke mest</p>
                                        <span>
                                            {mockNorms.animalManure.current} /{" "}
                                            {mockNorms.animalManure.total} kg N
                                        </span>
                                    </div>
                                    <Progress
                                        value={
                                            (mockNorms.animalManure.current /
                                                mockNorms.animalManure.total) *
                                            100
                                        }
                                        colorBar={getNormsProgressColor(
                                            mockNorms.animalManure.current,
                                            mockNorms.animalManure.total,
                                        )}
                                        className="h-2"
                                    />
                                </div>
                            </ItemDescription>
                        </Item>
                    </ItemGroup>
                    <ItemGroup>
                        <ItemSeparator />
                        <Item>
                            <ItemContent>
                                <ItemTitle>Stikstofbalans</ItemTitle>
                            </ItemContent>
                            <ItemDescription>
                                <div className="flex flex-col space-y-2">
                                    {/* Simplified Flow (Top Section) */}
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center justify-between">
                                            <p className="flex items-center gap-1">
                                                Aanvoer
                                            </p>
                                            <span className="font-semibold">
                                                {mockNitrogenBalance.supply} kg
                                                N
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="flex items-center gap-1">
                                                Afvoer
                                            </p>
                                            <span className="font-semibold">
                                                - {mockNitrogenBalance.removal}{" "}
                                                kg N
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="flex items-center gap-1">
                                                Emissie
                                            </p>
                                            <span className="font-semibold">
                                                - {mockNitrogenBalance.emission}{" "}
                                                kg N
                                            </span>
                                        </div>
                                    </div>
                                    <ItemSeparator />{" "}
                                    {/* Separator for clarity */}
                                    {/* Prominent Result (Bottom Section) */}
                                    <div className="flex flex-row justify-between items-center font-bold text-lg">
                                        <p>Balans</p>
                                        <span>
                                            {mockNitrogenBalance.balance} kg N
                                        </span>
                                    </div>
                                    <div className="flex flex-row justify-between items-center text-sm text-gray-500 space-x-1">
                                        <p>Streefwaarde</p>
                                        <span>
                                            {mockNitrogenBalance.target} kg N
                                        </span>
                                    </div>
                                    <div
                                        className={`flex flex-row justify-between items-center font-bold text-lg ${mockNitrogenBalance.task < 0 ? "text-red-500" : "text-green-500"}`}
                                    >
                                        <p>Opgave</p>
                                        <span>
                                            {mockNitrogenBalance.task} kg N
                                        </span>
                                    </div>
                                </div>
                            </ItemDescription>
                        </Item>
                    </ItemGroup>
                    <ItemGroup>
                        <ItemSeparator />
                        <Item>
                            <ItemContent>
                                <ItemTitle>Bemestingsadvies</ItemTitle>
                            </ItemContent>
                            <ItemDescription>
                                <div className="flex flex-col space-y-2">
                                    <div className="flex flex-row justify-between">
                                        <p>Stikstof</p>
                                        <span>
                                            {
                                                mockFertilizationAdvice.nitrogen
                                                    .current
                                            }{" "}
                                            /{" "}
                                            {
                                                mockFertilizationAdvice.nitrogen
                                                    .total
                                            }{" "}
                                            kg N
                                        </span>
                                    </div>
                                    <Progress
                                        value={
                                            (mockFertilizationAdvice.nitrogen
                                                .current /
                                                mockFertilizationAdvice.nitrogen
                                                    .total) *
                                            100
                                        }
                                        colorBar={getAdviceProgressColor(
                                            mockFertilizationAdvice.nitrogen
                                                .current,
                                            mockFertilizationAdvice.nitrogen
                                                .total,
                                        )}
                                        className="h-2"
                                    />

                                    <div className="flex flex-row justify-between">
                                        <p>Fosfaat</p>
                                        <span>
                                            {
                                                mockFertilizationAdvice
                                                    .phosphate.current
                                            }{" "}
                                            /{" "}
                                            {
                                                mockFertilizationAdvice
                                                    .phosphate.total
                                            }{" "}
                                            kg P₂O₅
                                        </span>
                                    </div>
                                    <Progress
                                        value={
                                            (mockFertilizationAdvice.phosphate
                                                .current /
                                                mockFertilizationAdvice
                                                    .phosphate.total) *
                                            100
                                        }
                                        colorBar={getAdviceProgressColor(
                                            mockFertilizationAdvice.phosphate
                                                .current,
                                            mockFertilizationAdvice.phosphate
                                                .total,
                                        )}
                                        className="h-2"
                                    />

                                    <div className="flex flex-row justify-between">
                                        <p>Kalium</p>
                                        <span>
                                            {
                                                mockFertilizationAdvice
                                                    .potassium.current
                                            }{" "}
                                            /{" "}
                                            {
                                                mockFertilizationAdvice
                                                    .potassium.total
                                            }{" "}
                                            kg K₂O
                                        </span>
                                    </div>
                                    <Progress
                                        value={
                                            (mockFertilizationAdvice.potassium
                                                .current /
                                                mockFertilizationAdvice
                                                    .potassium.total) *
                                            100
                                        }
                                        colorBar={getAdviceProgressColor(
                                            mockFertilizationAdvice.potassium
                                                .current,
                                            mockFertilizationAdvice.potassium
                                                .total,
                                        )}
                                        className="h-2"
                                    />
                                </div>
                            </ItemDescription>
                        </Item>
                    </ItemGroup>
                </div>
            </CardContent>
        </Card>
    )
}
