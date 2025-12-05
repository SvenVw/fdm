import { format } from "date-fns/format"
import { type JSX, useState } from "react"
import { nl } from "react-day-picker/locale"
import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { cn } from "@/app/lib/utils"
import {
    ChartContainer,
    ChartLegend,
    ChartTooltip,
} from "~/components/ui/chart"

type FertilizerTypes = "mineral" | "manure" | "compost" | "other"

type FarmBalanceData = {
    emission: {
        total: number
        ammonia: {
            total: number
            fertilizers: Record<"total" | FertilizerTypes, number>
        }
        nitrate: number
    }
    removal: number
    supply: number
}

type FieldBalanceData = {
    emission: {
        total: number
        ammonia: {
            total: number
            fertilizers: Record<
                FertilizerTypes,
                {
                    total: number
                    applications: {
                        id: string
                        p_id_catalogue: string
                        p_type: FertilizerTypes
                        p_app_date: string
                        value: number
                    }[]
                }
            >
        }
        nitrate: { total: number }
    }
    removal: { total: number }
    supply: { total: number }
}

export function NitrogenBalanceChart({
    type,
    balanceData,
    fertilizerNames,
}: { balanceData: { balance: number; removal: number } } & (
    | { type: "farm"; balanceData: FarmBalanceData; fertilizerNames?: unknown }
    | {
          type: "field"
          balanceData: FieldBalanceData
          fertilizerNames: Record<string, string>
      }
)): JSX.Element {
    const [tooltipFocus, setTooltipFocus] = useState<Set<string>>(new Set())
    const fertilizerTypes = ["mineral", "manure", "compost", "other"] as const
    const nitrateEmission =
        type === "farm"
            ? balanceData.emission.nitrate
            : balanceData.emission.nitrate.total
    const removal =
        type === "farm" ? balanceData.removal : balanceData.removal.total
    const chartData: Record<string, number | undefined> = {
        supply: Math.abs(
            type === "farm" ? balanceData.supply : balanceData.supply.total,
        ),
        removal: removal === undefined ? undefined : Math.abs(removal),
        emissionAmmonia:
            balanceData.emission.ammonia.total === undefined
                ? undefined
                : Math.abs(balanceData.emission.ammonia.total),
        emissionNitrate:
            nitrateEmission === undefined
                ? undefined
                : Math.abs(nitrateEmission),
    }

    type ApplicationChartConfig = {
        label: string
        color: string
        unit?: string
        detail?: string
    }

    const legend = {
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
        mineralFertilizer: {
            label: "Kunstmest",
            color: "var(--color-sky-600)",
        },
        manureFertilizer: {
            label: "Dierlijke Mest",
            color: "yellow",
        },
        compostFertilizer: {
            label: "Compost",
            color: "green",
        },
        otherFertilizer: {
            label: "Overige Meststoffen",
            color: "gray",
        },
    }

    const _chartConfig = {
        ...legend,
        mineralFertilizerAmmonia: {
            ...legend.mineralFertilizer,
            label: "Totaal ammoniakemissie door kunstmest",
            unit: "kg N / ha ammoniak",
        },
        manureFertilizerAmmonia: {
            ...legend.manureFertilizer,
            label: "Totaal ammoniakemissie door dierlijke mesten",
            unit: "kg N / ha ammoniak",
        },
        compostFertilizerAmmonia: {
            ...legend.compostFertilizer,
            label: "Totaal ammoniakemissie door compost",
            unit: "kg N / ha ammoniak",
        },
        otherFertilizerAmmonia: {
            ...legend.otherFertilizer,
            label: "Totaal ammoniakemissie door overige meststoffen",
            unit: "kg N / ha ammoniak",
        },
    }
    const chartConfig: Record<
        keyof typeof _chartConfig,
        ApplicationChartConfig
    > = _chartConfig

    if (type === "farm") {
        fertilizerTypes.forEach((p_type) => {
            chartData[`${p_type}FertilizerAmmonia`] = Math.abs(
                balanceData.emission.ammonia.fertilizers[p_type],
            )
        })
    }

    if (type === "field") {
        fertilizerTypes.forEach((p_type) => {
            balanceData.emission.ammonia.fertilizers[
                p_type
            ].applications.forEach((app) => {
                const dataKey = `${p_type}FertilizerAmmonia_${app.id}`
                chartData[dataKey] = Math.abs(app.value)
                ;(chartConfig as Record<string, ApplicationChartConfig>)[
                    dataKey
                ] = {
                    ...chartConfig[`${p_type}FertilizerAmmonia`],
                    label: format(app.p_app_date, "PP", { locale: nl }),
                    detail: fertilizerNames[app.p_id_catalogue],
                }
            })
        })
    }

    type ChartMouseEvent = {
        tooltipPayload: { dataKey: string }[]
    }

    const onTooltipFocus = (e: ChartMouseEvent) => {
        const dataKey = e.tooltipPayload[0].dataKey
        if (!tooltipFocus.has(dataKey))
            setTooltipFocus((tooltipFocus) => {
                tooltipFocus.add(dataKey)
                return new Set(tooltipFocus)
            })
    }

    const onTooltipBlur = (e: ChartMouseEvent) => {
        const dataKey = e.tooltipPayload[0].dataKey
        if (tooltipFocus.has(dataKey))
            setTooltipFocus((tooltipFocus) => {
                tooltipFocus.delete(dataKey)
                return new Set(tooltipFocus)
            })
    }

    return (
        <ChartContainer config={chartConfig}>
            <BarChart
                accessibilityLayer
                data={[chartData]}
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
                    content={({ active }) => {
                        if (active && tooltipFocus.size > 0) {
                            const dataKey = tooltipFocus.values().next()
                                .value as keyof typeof chartConfig
                            const itemConfig = chartConfig[dataKey]

                            return (
                                <div className="flex min-w-32 items-center gap-2 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
                                    <div
                                        className="h-2 w-2 shrink-0 rounded-[2px]"
                                        style={{
                                            backgroundColor: itemConfig.color,
                                        }}
                                    />
                                    <div
                                        className={cn(
                                            "flex flex-col items-start [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground",
                                        )}
                                    >
                                        <p className="flex flex-row">
                                            <div>{itemConfig.label}</div>
                                            <div className="ms-2">
                                                {chartData[dataKey]}{" "}
                                                {itemConfig.unit ?? "kg N / ha"}
                                            </div>
                                        </p>
                                        {itemConfig.detail && (
                                            <p
                                                className={cn(
                                                    "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground",
                                                )}
                                            >
                                                {itemConfig.detail}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )
                        }
                        return null
                    }}
                />
                <ChartLegend
                    content={
                        <div
                            className={
                                "flex items-center justify-center gap-4 flex-wrap"
                            }
                        >
                            {Object.entries(legend).map(
                                ([dataKey, itemConfig]) => {
                                    return (
                                        <div
                                            key={dataKey}
                                            className={cn(
                                                "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground",
                                            )}
                                        >
                                            <div
                                                className="h-2 w-2 shrink-0 rounded-[2px]"
                                                style={{
                                                    backgroundColor:
                                                        itemConfig.color,
                                                }}
                                            />
                                            {itemConfig.label}
                                        </div>
                                    )
                                },
                            )}
                        </div>
                    }
                />
                <Bar
                    dataKey="supply"
                    fill="var(--color-supply)"
                    radius={5}
                    stackId={"a"}
                    onMouseEnter={onTooltipFocus}
                    onMouseLeave={onTooltipBlur}
                />
                <Bar
                    dataKey="removal"
                    fill="var(--color-removal)"
                    radius={5}
                    stackId={"b"}
                    onMouseEnter={onTooltipFocus}
                    onMouseLeave={onTooltipBlur}
                />
                {type === "farm"
                    ? fertilizerTypes.map((p_type) => {
                          const dataKey = `${p_type}FertilizerAmmonia`
                          return (
                              <Bar
                                  key={dataKey}
                                  dataKey={dataKey}
                                  fill={`var(--color-${p_type}FertilizerAmmonia)`}
                                  radius={5}
                                  stackId={"b"}
                                  onMouseEnter={onTooltipFocus}
                                  onMouseLeave={onTooltipBlur}
                              />
                          )
                      })
                    : fertilizerTypes.flatMap((p_type) =>
                          balanceData.emission.ammonia.fertilizers[
                              p_type
                          ].applications.map((app) => {
                              const dataKey = `${p_type}FertilizerAmmonia_${app.id}`
                              return (
                                  <Bar
                                      key={dataKey}
                                      dataKey={dataKey}
                                      fill={`var(--color-${p_type}FertilizerAmmonia)`}
                                      stroke={
                                          tooltipFocus.has(dataKey)
                                              ? "var(--color-stroke)"
                                              : "none"
                                      }
                                      strokeWidth={2}
                                      radius={5}
                                      stackId={"b"}
                                      onMouseEnter={onTooltipFocus}
                                      onMouseLeave={onTooltipBlur}
                                  />
                              )
                          }),
                      )}
                <Bar
                    dataKey="emissionNitrate"
                    fill="var(--color-emissionNitrate)"
                    radius={5}
                    stackId={"b"}
                    onMouseEnter={onTooltipFocus}
                    onMouseLeave={onTooltipBlur}
                />
            </BarChart>
        </ChartContainer>
    )
}
