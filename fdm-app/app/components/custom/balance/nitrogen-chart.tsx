import {
    ChartContainer,
    ChartLegendContent,
    ChartTooltipContent,
    ChartTooltip,
    type ChartConfig,
    ChartLegend,
} from "~/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, ReferenceLine } from "recharts"

export function NitrogenBalanceChart({
    balanceData,
}: {
    balanceData: {
        balance: number
        supply: number
        removal: number
        emission: number
        target: number
    }
}): any {
    console.log(balanceData)
    const chartData = [
        {
            primary: "Aanvoer",
            supply: 150,
            removal: 20,
            emission: 10,
        },       
    ]

    const chartConfig = {
        supply: {
            label: "Aanvoer",
            color: "hsl(var(--chart-1))",
        },
        removal: {
            label: "Afvoer",
            color: "hsl(var(--chart-2))",
        },
        emission: {
            label: "Emissie",
            color: "hsl(var(--chart-3))",
        },
    } satisfies ChartConfig
    const referenceLineColor = balanceData.balance <= balanceData.target ? "green" : "red"

    return (
        <ChartContainer config={chartConfig}>
            <BarChart
                accessibilityLayer
                data={chartData}
                layout="vertical"
                margin={{
                    left: -20,
                }}
            >
                <XAxis type="number" dataKey="supply" />
                <YAxis
                    dataKey="primary"
                    type="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                    dataKey="supply"
                    fill="var(--color-supply)"
                    radius={5}
                    stackId={"a"}
                />
                <Bar
                    dataKey="removal"
                    fill="var(--color-removal)"
                    radius={5}
                    stackId={"b"}
                />
                <Bar
                    dataKey="emission"
                    fill="var(--color-emission)"
                    radius={5}
                    stackId={"b"}
                />
                <ReferenceLine x={balanceData.target} stroke={referenceLineColor} strokeWidth={2}/>
            </BarChart>
        </ChartContainer>
    )
}
