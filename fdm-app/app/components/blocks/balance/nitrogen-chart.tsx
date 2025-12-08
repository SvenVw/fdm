import { format } from "date-fns/format"
import { ReactElement, Ref, useId, useMemo, useState } from "react"
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

type ApplicationChartConfigItem = {
    label: string
    color: string
    styleId?: string
    dotted?: boolean
    unit?: string
    detail?: string
}

function buildChartDataAndLegend({
    type,
    balanceData,
    fieldInput,
}:
    | { type: "farm"; balanceData: FarmBalanceData; fieldInput: unknown }
    | {
          type: "field"
          balanceData: FieldBalanceData
          fieldInput: {
              fertilizerApplications: { p_app_id: string; p_name_nl: string }[]
          }
      }) {
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
            styleId: "mineralFertilizer",
        },
        manureFertilizer: {
            label: "Dierlijke Mest",
            color: "yellow",
            styleId: "manureFertilizer",
        },
        compostFertilizer: {
            label: "Compost",
            color: "green",
            styleId: "compostFertilizer",
        },
        otherFertilizer: {
            label: "Overige Meststoffen",
            color: "gray",
            styleId: "otherFertilizer",
        },
    }

    const _chartConfig = {
        ...legend,
        mineralFertilizerAmmonia: {
            ...legend.mineralFertilizer,
            label: "Ammoniakemissie door kunstmest",
        },
        manureFertilizerAmmonia: {
            ...legend.manureFertilizer,
            label: "Ammoniakemissie door dierlijke mesten",
        },
        compostFertilizerAmmonia: {
            ...legend.compostFertilizer,
            label: "Ammoniakemissie door compost",
        },
        otherFertilizerAmmonia: {
            ...legend.otherFertilizer,
            label: "Ammoniakemissie door overige meststoffen",
        },
    }
    const chartConfig: Record<
        keyof typeof _chartConfig,
        ApplicationChartConfigItem
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
            chartData[`${p_type}FertilizerAmmonia`] = Math.abs(
                balanceData.emission.ammonia.fertilizers[p_type].total,
            )
            balanceData.emission.ammonia.fertilizers[
                p_type
            ].applications.forEach((app) => {
                const dataKey = `${p_type}FertilizerAmmonia_${app.id}`
                chartData[dataKey] = Math.abs(app.value)
                ;(chartConfig as Record<string, ApplicationChartConfigItem>)[
                    dataKey
                ] = {
                    ...chartConfig[`${p_type}FertilizerAmmonia`],
                    label: format(app.p_app_date, "PP", { locale: nl }),
                    unit: "kg N / ha ammoniakemissie",
                    detail: fieldInput.fertilizerApplications.find(
                        (fa: { p_app_id: string }) => fa.p_app_id === app.id,
                    )?.p_name_nl,
                }
            })
        })
    }

    return { legend, chartData, chartConfig }
}

function DottedPatternDef({
    id,
    spacing = 1.5,
    darkness = 0.02,
    color = "black",
    bg,
    rotate,
}: {
    id: string
    color: string
    spacing?: number
    darkness?: number
    bg?: string
    /** Rotation in degrees *without unit* */
    rotate?: number
}) {
    const radius = spacing * Math.sqrt((4 / Math.PI) * darkness)
    const worldSpaceTransform = "translate(0,0) scale(10,10)"
    return (
        <pattern
            id={id}
            patternUnits="userSpaceOnUse"
            width={spacing}
            height={spacing}
            patternTransform={
                rotate
                    ? `rotate(${rotate}) ${worldSpaceTransform}`
                    : worldSpaceTransform
            }
            preserveAspectRatio="xMidYMid"
        >
            <circle cx={radius} cy={radius} r={radius} fill={color} />
        </pattern>
        // <pattern id={id} viewBox="0,0,10,10" width="10%" height="10%">
        //     <polygon points="0,0 2,5 0,10 5,8 10,10 8,5 10,0 5,2" />
        // </pattern>
    )
}

function buildPatternId(id: string, dataKey: string) {
    return `${id}_${dataKey}`
}

function PatternDefinitions({
    ref,
    id: baseId,
    chartConfig,
}: {
    ref?: Ref<SVGDefsElement>
    id: string
    chartConfig: Record<string, ApplicationChartConfigItem>
}) {
    return (
        <defs ref={ref}>
            {Object.entries(chartConfig).reduce(
                (pats, [dataKey, itemConfig]) => {
                    if (itemConfig.dotted) {
                        const id = buildPatternId(baseId, dataKey)
                        pats.push(
                            <DottedPatternDef
                                key={id}
                                id={id}
                                color={itemConfig.color}
                                rotate={30}
                            />,
                        )
                    }
                    return pats
                },
                [] as ReactElement[],
            )}
        </defs>
    )
}

export function NitrogenBalanceChart(
    props: { balanceData: { balance: number; removal: number } } & (
        | { type: "farm"; balanceData: FarmBalanceData; fieldInput: unknown }
        | {
              type: "field"
              balanceData: FieldBalanceData
              fieldInput: {
                  fertilizerApplications: {
                      p_app_id: string
                      p_name_nl: string
                  }[]
              }
          }
    ),
) {
    const { type, balanceData, fieldInput } = props
    const fertilizerTypes = ["mineral", "manure", "compost", "other"] as const
    const [tooltipFocus, setTooltipFocus] = useState<Set<string>>(new Set())
    // biome-ignore lint/correctness/useExhaustiveDependencies: each value in props is passed separately
    const { legend, chartData, chartConfig } = useMemo(
        () => buildChartDataAndLegend(props),
        [type, balanceData, fieldInput],
    )
    const patternId = useId()

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

    function getBarStyle(dataKey: string) {
        const itemConfig = chartConfig[dataKey as keyof typeof chartConfig]
        if (!itemConfig) return {}

        if (itemConfig.dotted) {
            return {
                style: {
                    fill: `url(#${buildPatternId(patternId, itemConfig.styleId ? itemConfig.styleId : dataKey)})`,
                },
                stroke: itemConfig.color,
                strokeWidth: "var(--spacing-2)",
            }
        }

        return { fill: itemConfig.color }
    }

    const barRadius = 5
    const barRadiusStart: [number, number, number, number] = [
        barRadius,
        0,
        0,
        barRadius,
    ]
    const barRadiusEnd: [number, number, number, number] = [
        0,
        barRadius,
        barRadius,
        0,
    ]

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
                {PatternDefinitions({
                    id: patternId,
                    chartConfig: legend,
                })}
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
                    radius={5}
                    stackId={"a"}
                    {...getBarStyle("supply")}
                    onMouseEnter={onTooltipFocus}
                    onMouseLeave={onTooltipBlur}
                />
                <Bar
                    dataKey="removal"
                    radius={5}
                    stackId={"b"}
                    {...getBarStyle("removal")}
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
                                  radius={5}
                                  stackId={"b"}
                                  {...getBarStyle(dataKey)}
                                  onMouseEnter={onTooltipFocus}
                                  onMouseLeave={onTooltipBlur}
                              />
                          )
                      })
                    : fertilizerTypes.flatMap((p_type) =>
                          balanceData.emission.ammonia.fertilizers[
                              p_type
                          ].applications.map((app, i, apps) => {
                              const dataKey = `${p_type}FertilizerAmmonia_${app.id}`
                              const barStyle = getBarStyle(dataKey)
                              return (
                                  <Bar
                                      key={dataKey}
                                      dataKey={dataKey}
                                      strokeWidth={2}
                                      radius={
                                          i === 0
                                              ? barRadiusStart
                                              : i === apps.length - 1
                                                ? barRadiusEnd
                                                : barRadius
                                      }
                                      stackId={"b"}
                                      {...barStyle}
                                      stroke={
                                          tooltipFocus.has(dataKey)
                                              ? "black"
                                              : barStyle.stroke
                                      }
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
                    {...getBarStyle("emissionNitrate")}
                    onMouseEnter={onTooltipFocus}
                    onMouseLeave={onTooltipBlur}
                />
            </BarChart>
        </ChartContainer>
    )
}
