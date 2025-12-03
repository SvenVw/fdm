import type { JSX } from "react"
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
    supply,
    removal,
    emission,
}: {
    supply: number
    removal: number | undefined
    emission: {
        total: number
        ammonia: number
        nitrate: number
    }
}): JSX.Element {
    const chartData = [
        {
            supply: supply,
            removal: removal === undefined ? undefined : Math.abs(removal),
            emissionAmmonia:
                emission.ammonia === undefined
                    ? undefined
                    : Math.abs(emission.ammonia),
            emissionNitrate:
                emission.nitrate === undefined
                    ? undefined
                    : Math.abs(emission.nitrate),
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
        emissionAmmonia: {
            label: "Ammoniakemissie",
            color: "hsl(var(--chart-3))",
        },
        emissionNitrate: {
            label: "Nitraatemissie",
            color: "hsl(var(--chart-4))",
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
                    dataKey="emissionAmmonia"
                    fill="var(--color-emissionAmmonia)"
                    radius={5}
                    stackId={"b"}
                />
                <Bar
                    dataKey="emissionNitrate"
                    fill="var(--color-emissionNitrate)"
                    radius={5}
                    stackId={"b"}
                />
            </BarChart>
        </ChartContainer>
    )
}
