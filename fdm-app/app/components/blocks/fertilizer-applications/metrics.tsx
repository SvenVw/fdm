import { NavLink } from "react-router"
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
                                <ItemTitle className="hover:underline">
                                    <NavLink to="#">Gebruiksnormen</NavLink>
                                </ItemTitle>
                            </ItemContent>
                            <ItemDescription>
                                <div className="flex flex-col space-y-2">
                                    <div className="grid grid-cols-[1fr_auto] items-center">
                                        <p className="whitespace-nowrap px-2">Stikstof</p>
                                        <span className="text-right whitespace-nowrap px-2">
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

                                    <div className="grid grid-cols-[1fr_auto] items-center">
                                        <p className="whitespace-nowrap px-2">Fosfaat</p>
                                        <span className="text-right whitespace-nowrap px-2">
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

                                    <div className="grid grid-cols-[1fr_auto] items-center">
                                        <p className="whitespace-nowrap px-2">Dierlijke mest</p>
                                        <span className="text-right whitespace-nowrap px-2">
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
                                <ItemTitle className="hover:underline">
                                    <NavLink to="#">Stikstofbalans</NavLink>
                                </ItemTitle>
                            </ItemContent>
                            <ItemDescription>
                                <div className="flex flex-col space-y-2">
                                    {/* Simplified Flow (Top Section) */}
                                    <div className="grid grid-cols-[1fr_auto] items-center">
                                        <p className="whitespace-nowrap px-2">Aanvoer</p>
                                        <span className="font-semibold text-right whitespace-nowrap px-2">
                                            {mockNitrogenBalance.supply} kg N
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-[1fr_auto] items-center">
                                        <p className="whitespace-nowrap px-2">Afvoer</p>
                                        <span className="font-semibold text-right whitespace-nowrap px-2">
                                            - {mockNitrogenBalance.removal} kg N
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-[1fr_auto] items-center">
                                        <p className="whitespace-nowrap px-2">Emissie</p>
                                        <span className="font-semibold text-right whitespace-nowrap px-2">
                                            - {mockNitrogenBalance.emission} kg N
                                        </span>
                                    </div>
                                    <ItemSeparator className="col-span-2" />{" "}
                                    {/* Separator for clarity */}
                                    {/* Prominent Result (Bottom Section) */}
                                    <div className="grid grid-cols-[1fr_auto] items-center">
                                        <p className="text-xl font-bold whitespace-nowrap px-2">
                                            Balans
                                        </p>
                                        <span className="text-xl font-bold text-right whitespace-nowrap px-2">
                                            {mockNitrogenBalance.balance} kg N
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-[1fr_auto] items-center">
                                        <p className="whitespace-nowrap px-2">
                                            Streefwaarde
                                        </p>
                                        <span className="font-semibold text-right whitespace-nowrap px-2">
                                            {mockNitrogenBalance.target} kg N
                                        </span>
                                    </div>
                                    <ItemSeparator className="col-span-2" />{" "}
                                    <div className="grid grid-cols-[1fr_auto] items-center">
                                        <p className="text-xl font-bold whitespace-nowrap px-2">
                                            {mockNitrogenBalance.task < 0
                                                ? "Opgave"
                                                : "Ruimte"}
                                        </p>
                                        <span
                                            className={`text-xl font-bold text-right whitespace-nowrap px-2 ${
                                                mockNitrogenBalance.task < 0
                                                    ? "text-red-500"
                                                    : "text-green-500"
                                            }`}
                                        >
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
                                <ItemTitle className="hover:underline">
                                    <NavLink to="#">Bemestingsadvies</NavLink>
                                </ItemTitle>
                            </ItemContent>
                            <ItemDescription>
                                <div className="flex flex-col space-y-2">
                                    <div className="grid grid-cols-[1fr_auto] items-center">
                                        <p className="whitespace-nowrap px-2">Stikstof</p>
                                        <span className="text-right whitespace-nowrap px-2">
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

                                    <div className="grid grid-cols-[1fr_auto] items-center">
                                        <p className="whitespace-nowrap px-2">Fosfaat</p>
                                        <span className="text-right whitespace-nowrap px-2">
                                            {
                                                mockFertilizationAdvice.phosphate
                                                    .current
                                            }{" "}
                                            /{" "}
                                            {
                                                mockFertilizationAdvice.phosphate
                                                    .total
                                            }{" "}
                                            kg P₂O₅
                                        </span>
                                    </div>
                                    <Progress
                                        value={
                                            (mockFertilizationAdvice.phosphate
                                                .current /
                                                mockFertilizationAdvice.phosphate
                                                    .total) *
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

                                    <div className="grid grid-cols-[1fr_auto] items-center">
                                        <p className="whitespace-nowrap px-2">Kalium</p>
                                        <span className="text-right whitespace-nowrap px-2">
                                            {
                                                mockFertilizationAdvice.potassium
                                                    .current
                                            }{" "}
                                            /{" "}
                                            {
                                                mockFertilizationAdvice.potassium
                                                    .total
                                            }{" "}
                                            kg K₂O
                                        </span>
                                    </div>
                                    <Progress
                                        value={
                                            (mockFertilizationAdvice.potassium
                                                .current /
                                                mockFertilizationAdvice.potassium
                                                    .total) *
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
