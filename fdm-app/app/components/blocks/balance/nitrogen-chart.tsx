import { Bar, BarChart, XAxis, YAxis } from "recharts"
import {
    type ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "~/components/ui/chart"

export function NitrogenBalanceChart({
    balance,
    supply,
    removal,
    volatilization,
}: {
    balance: number
    supply: number
    removal: number | undefined
    volatilization: number | undefined
}): JSX.Element {
    const chartData = [
        {
            supply: supply,
            removal: removal ? Math.abs(removal) : undefined,
            volatilization: volatilization
                ? Math.abs(volatilization)
                : undefined,
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
        volatilization: {
            label: "Emissie",
            color: "hsl(var(--chart-3))",
        },
    } satisfies ChartConfig

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
                <XAxis type="number" />
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
                    dataKey="volatilization"
                    fill="var(--color-volatilization)"
                    radius={5}
                    stackId={"b"}
                />
            </BarChart>
        </ChartContainer>
    )
}
