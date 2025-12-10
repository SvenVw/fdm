import type {
    collectInputForNitrogenBalance,
    getNitrogenBalance,
    NitrogenBalanceFieldResultNumeric,
} from "@svenvw/fdm-calculator"
import { format } from "date-fns/format"
import { useMemo, useState } from "react"
import { nl } from "react-day-picker/locale"
import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { cn } from "@/app/lib/utils"
import { getCultivationColor } from "~/components/custom/cultivation-colors"
import { Card, CardContent, CardHeader } from "~/components/ui/card"
import {
    ChartContainer,
    ChartLegend,
    ChartTooltip,
} from "~/components/ui/chart"

type FieldInput = Awaited<ReturnType<typeof collectInputForNitrogenBalance>>
type FarmBalanceData = Awaited<ReturnType<typeof getNitrogenBalance>>
type FieldBalanceData = NitrogenBalanceFieldResultNumeric

type ApplicationChartConfigItem = {
    label: string
    color?: string
    styleId?: string
    unit?: string
    detail?: string[]
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
          fieldInput: FieldInput
      }) {
    const fertilizerTypes = ["mineral", "manure", "compost", "other"] as const
    type BarDataType = (string | string[])[]
    const fixationBar: BarDataType = []
    const fertilizerSupplyBar: BarDataType = []
    const removalBar: BarDataType = []
    const fertilizerAmmoniaBar: BarDataType = []
    const residueAmmoniaBar: BarDataType = []

    const nitrateEmission =
        type === "farm"
            ? balanceData.emission.nitrate
            : balanceData.emission.nitrate.total
    const chartData: Record<string, number | undefined> = {
        deposition: Math.abs(
            type === "farm"
                ? balanceData.supply.deposition
                : balanceData.supply.deposition.total,
        ),
        mineralization: Math.abs(
            type === "farm"
                ? balanceData.supply.mineralisation
                : balanceData.supply.mineralisation.total,
        ),
        emissionAmmonia:
            balanceData.emission.ammonia.total === undefined
                ? undefined
                : Math.abs(balanceData.emission.ammonia.total),
        emissionNitrate:
            nitrateEmission === undefined
                ? undefined
                : Math.abs(nitrateEmission),
    }

    const farmFixationLegend = {
        fixation: {
            label: "Fixatie",
            color: "#f08",
        },
    }

    const farmRemovalLegend = {
        harvest: {
            label: "Oogsten",
            color: "var(--color-teal-700)",
        },
        residue: {
            label: "Gewasresten",
            color: "var(--color-pink-800)",
        },
    }

    const legend = {
        deposition: {
            label: "Depositie",
            color: "black",
        },
        ...(type === "farm" ? farmFixationLegend : {}),
        mineralization: {
            label: "Mineralisatie",
            color: "lime",
        },
        mineralFertilizer: {
            label: "Kunstmest",
            color: "var(--color-sky-600)",
        },
        manureFertilizer: {
            label: "Dierlijke Mest",
            color: "var(--color-yellow-600)",
        },
        compostFertilizer: {
            label: "Compost",
            color: "var(--color-green-600)",
        },
        otherFertilizer: {
            label: "Overige Meststoffen",
            color: "var(--color-gray-600)",
        },
        ...(type === "farm" ? farmRemovalLegend : {}),
    }

    const chartConfig: Record<string, ApplicationChartConfigItem> = {
        ...farmFixationLegend,
        ...farmRemovalLegend,
        ...legend,
        removalHarvest: {
            ...farmRemovalLegend.harvest,
            label: "Afvoer door Oogsten",
        },
        removalResidue: {
            ...farmRemovalLegend.residue,
            label: "Afvoer door Gewasresten",
        },
        emissionNitrate: {
            label: "Nitraatemissie",
            color: "hsl(var(--chart-4))",
        },
    }

    const langNL = {
        mineral: "kunstmest",
        manure: "dierlijke mesten",
        compost: "compost",
        other: "overige meststoffen",
    }

    for (const fertilizerType of fertilizerTypes) {
        // These styles are inherited by individual fertilizer applications too
        const style = legend[`${fertilizerType}Fertilizer`]
        chartConfig[`${fertilizerType}FertilizerSupply`] = {
            ...style,
            label: `Aanvoer door ${langNL[fertilizerType]}`,
        }
        chartConfig[`${fertilizerType}FertilizerAmmonia`] = {
            ...style,
            label: `Ammoniakemissie door ${langNL[fertilizerType]}`,
        }
    }

    if (type === "farm") {
        chartData.fixation = Math.abs(balanceData.supply.fixation)
        fixationBar.push("fixation")
        chartData.residueAmmonia = Math.abs(
            balanceData.emission.ammonia.residues,
        )
        residueAmmoniaBar.push("residueAmmonia")
        chartData.removalHarvest = Math.abs(balanceData.removal.harvests)
        removalBar.push("removalHarvest")
        chartData.removalResidue = Math.abs(balanceData.removal.residues)
        removalBar.push("removalResidue")
        fertilizerTypes.forEach((p_type) => {
            fertilizerSupplyBar.push(`${p_type}FertilizerSupply`)
            chartData[`${p_type}FertilizerSupply`] = Math.abs(
                balanceData.supply.fertilizers[p_type],
            )

            fertilizerAmmoniaBar.push(`${p_type}FertilizerAmmonia`)
            chartData[`${p_type}FertilizerAmmonia`] = Math.abs(
                balanceData.emission.ammonia.fertilizers[p_type],
            )
        })
    }

    if (type === "field") {
        type ExtendedChartConfig = Record<string, ApplicationChartConfigItem>

        function addFertilizerApplication(
            fieldInput: FieldInput,
            dataKeyPrefix: string,
            label: string,
            applicationResult: { id: string; value: number },
            unit: string,
            bar: BarDataType,
        ) {
            const dataKey = `${dataKeyPrefix}_${applicationResult.id}`
            const application = fieldInput.fertilizerApplications.find(
                (fa: { p_app_id: string }) =>
                    fa.p_app_id === applicationResult.id,
            )
            chartData[dataKey] = Math.abs(applicationResult.value)
            ;(chartConfig as ExtendedChartConfig)[dataKey] = application
                ? {
                      styleId: dataKeyPrefix,
                      label: label,
                      unit: unit,
                      detail: [
                          application.p_name_nl,
                          format(application.p_app_date, "PP", {
                              locale: nl,
                          }),
                      ],
                  }
                : {
                      styleId: dataKeyPrefix,
                      label: label,
                      unit: unit,
                      detail: ["onbekend"],
                  }
            bar.push(dataKey)
        }

        function addCultivation(
            fieldInput: FieldInput,
            dataKeyPrefix: string,
            label: string,
            cultivationResult: { id: string; value: number },
            unit: string,
            styles: Record<string, ApplicationChartConfigItem>,
            bar: BarDataType,
        ) {
            const dataKey = `${dataKeyPrefix}_${cultivationResult.id}`
            const cultivation = fieldInput.cultivations.find(
                (lu) => lu.b_lu === cultivationResult.id,
            ) ?? {
                b_lu: "",
                b_lu_name: "onbekend",
                b_lu_croprotation: "",
            }

            const styleId = `${dataKeyPrefix}_${cultivation.b_lu_croprotation}`
            if (!styles[styleId]) {
                styles[styleId] = {
                    ...styles[""],
                    color: getCultivationColor(cultivation.b_lu_croprotation),
                }
            }
            chartData[dataKey] = Math.abs(cultivationResult.value)
            ;(chartConfig as ExtendedChartConfig)[dataKey] = {
                label: label,
                unit: unit,
                detail: [cultivation.b_lu_name],
                styleId: styleId,
            }
            bar.push(dataKey)
        }
        fertilizerTypes.forEach((p_type) => {
            // Fertilizer Supply
            const fertilizerTypeSupplyBar: string[] = []
            balanceData.supply.fertilizers[p_type].applications.forEach(
                (app) => {
                    addFertilizerApplication(
                        fieldInput,
                        `${p_type}FertilizerSupply`,
                        "Aanvoer",
                        app,
                        "kg N / ha",
                        fertilizerTypeSupplyBar,
                    )
                },
            )
            fertilizerSupplyBar.push(fertilizerTypeSupplyBar)

            // Fertilizer Ammonia Emission
            const fertilizerTypeAmmoniaBar: string[] = []
            balanceData.emission.ammonia.fertilizers[
                p_type
            ].applications.forEach((app) => {
                addFertilizerApplication(
                    fieldInput,
                    `${p_type}FertilizerAmmonia`,
                    "Ammoniakemissie",
                    app,
                    "kg N / ha",
                    fertilizerTypeAmmoniaBar,
                )
            })
            fertilizerAmmoniaBar.push(fertilizerTypeAmmoniaBar)
        })

        const fixationStyles: Record<string, ApplicationChartConfigItem> = {
            "": {
                label: "onbekend",
                color: "gray",
            },
        }

        balanceData.supply.fixation.cultivations.forEach(
            (cultivationResult) => {
                addCultivation(
                    fieldInput,
                    "fixation",
                    "Fixatie",
                    cultivationResult,
                    "kg N / ha",
                    fixationStyles,
                    fixationBar,
                )
            },
        )

        Object.assign(chartConfig, fixationStyles)

        balanceData.removal.harvests.harvests.forEach((harvestResult) => {
            const dataKey = `removalHarvest_${harvestResult.id}`
            const harvestDetails = fieldInput.harvests.find(
                (harvesting) => harvesting.b_id_harvesting === harvestResult.id,
            )
            const cultivationDetails = harvestDetails
                ? fieldInput.cultivations.find(
                      (lu) => lu.b_lu === harvestDetails.b_lu,
                  )
                : undefined

            chartData[dataKey] = Math.abs(harvestResult.value)
            ;(chartConfig as ExtendedChartConfig)[dataKey] = harvestDetails
                ? {
                      label: "Afvoer door Oogst",
                      styleId: "removalHarvest",
                      detail: cultivationDetails
                          ? [
                                cultivationDetails.b_lu_name,
                                format(harvestDetails.b_lu_harvest_date, "PP", {
                                    locale: nl,
                                }),
                            ]
                          : [],
                  }
                : {
                      label: "Afvoer door Oogst",
                      styleId: "removalHarvest",
                      detail: ["onbekend oogst"],
                  }
            removalBar.push(dataKey)
        })

        const removalStyles: Record<string, ApplicationChartConfigItem> = {
            "": {
                label: "onbekend",
                color: "gray",
            },
        }

        balanceData.removal.residues.cultivations.forEach(
            (cultivationResult) => {
                addCultivation(
                    fieldInput,
                    "removalResidue",
                    "Afvoer door Gewasresten",
                    cultivationResult,
                    "kg N / ha",
                    removalStyles,
                    removalBar,
                )
            },
        )

        Object.assign(chartConfig, removalStyles)

        const residueAmmoniaStyles: Record<string, ApplicationChartConfigItem> =
            {
                "": {
                    label: "onbekend",
                    color: "gray",
                },
            }
        balanceData.emission.ammonia.residues.cultivations.forEach(
            (cultivationResult) => {
                addCultivation(
                    fieldInput,
                    "residueAmmonia",
                    "Ammoniakemissie",
                    cultivationResult,
                    "kg N / ha",
                    residueAmmoniaStyles,
                    residueAmmoniaBar,
                )
            },
        )

        Object.assign(chartConfig, residueAmmoniaStyles)
    }

    // Bar Graph Layout
    const supplyBar = [
        "deposition",
        ...fixationBar,
        "mineralization",
        ...fertilizerSupplyBar,
    ]
    const allRemovalBar = [
        ...removalBar,
        ...fertilizerAmmoniaBar,
        ...residueAmmoniaBar,
        "emissionNitrate",
    ]

    return {
        legend,
        chartData,
        chartConfig,
        supplyBar,
        removalBar: allRemovalBar,
    }
}

export function NitrogenBalanceChart(
    props: { balanceData: { balance: number; removal: number } } & (
        | { type: "farm"; balanceData: FarmBalanceData; fieldInput: unknown }
        | {
              type: "field"
              balanceData: FieldBalanceData
              fieldInput: FieldInput
          }
    ),
) {
    const { type, balanceData, fieldInput } = props
    const [tooltipFocus, setTooltipFocus] = useState<Set<string>>(new Set())
    // biome-ignore lint/correctness/useExhaustiveDependencies: each value in props is passed separately
    const { legend, chartData, chartConfig, supplyBar, removalBar } = useMemo(
        () => buildChartDataAndLegend(props),
        [type, balanceData, fieldInput],
    )

    type ChartMouseEvent = {
        tooltipPayload: { dataKey: string }[]
    }

    const onTooltipFocus = (e: ChartMouseEvent) => {
        const dataKey = e.tooltipPayload[0].dataKey
        if (!tooltipFocus.has(dataKey))
            setTooltipFocus(
                (tooltipFocus) => new Set([...tooltipFocus, dataKey]),
            )
    }

    const onTooltipBlur = (e: ChartMouseEvent) => {
        const dataKey = e.tooltipPayload[0].dataKey
        if (tooltipFocus.has(dataKey))
            setTooltipFocus((tooltipFocus) => {
                const newTooltipFocus = new Set(tooltipFocus)
                newTooltipFocus.delete(dataKey)
                return newTooltipFocus
            })
    }

    const clearTooltipFocus = () => {
        setTooltipFocus(new Set())
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
    function pickBarRadius(i: number, arr: unknown[]) {
        if (arr.length === 1) return barRadius
        if (i === 0) return barRadiusStart
        if (i === arr.length - 1) return barRadiusEnd
        return undefined
    }

    /**
     * Renders a list of data keys and data key arrays as an array of <Bar />
     * @param stackId stack id to use for this set of data keys
     * @param bar an array where each item is
     *   - a data key: it will display as a standalone bar rectangle with rounded corners
     *   - an array of data keys: it will display as a list of rectangle bars where only the outer corners are rounded.
     *     Hovering over each rectangle will make it show a black outline for clarity.
     * @returns
     */
    function renderBar(stackId: string, bar: (string | string[])[]) {
        return bar.flatMap((barItem) => {
            if (Array.isArray(barItem)) {
                return barItem.map((dataKey, i) => {
                    const styleId = chartConfig[dataKey]?.styleId ?? dataKey
                    const barStyle = chartConfig[styleId] ?? {}
                    return (
                        <Bar
                            key={dataKey}
                            dataKey={dataKey}
                            radius={pickBarRadius(i, barItem)}
                            stackId={stackId}
                            fill={barStyle.color}
                            stroke={
                                tooltipFocus.has(dataKey) ? "black" : undefined
                            }
                            onMouseEnter={onTooltipFocus}
                            onMouseLeave={onTooltipBlur}
                        />
                    )
                })
            }

            const dataKey = barItem
            const styleId = chartConfig[dataKey]?.styleId ?? dataKey
            const barStyle = chartConfig[styleId] ?? {}

            return (
                <Bar
                    key={dataKey}
                    dataKey={dataKey}
                    radius={barRadius}
                    stackId={stackId}
                    fill={barStyle.color}
                    onMouseEnter={onTooltipFocus}
                    onMouseLeave={onTooltipBlur}
                />
            )
        })
    }

    return (
        <ChartContainer config={chartConfig} onMouseLeave={clearTooltipFocus}>
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
                                <Card>
                                    <CardHeader className="p-4 pb-0">
                                        <div>
                                            <div
                                                className="inline-block me-2 h-2 w-2 rounded-[2px]"
                                                style={{
                                                    backgroundColor:
                                                        itemConfig.styleId
                                                            ? chartConfig[
                                                                  itemConfig
                                                                      .styleId
                                                              ].color
                                                            : itemConfig.color,
                                                }}
                                            />
                                            {itemConfig.label}
                                        </div>
                                        {itemConfig.detail?.map((detail, i) => (
                                            // biome-ignore lint/suspicious/noArrayIndexKey: detail is constant
                                            <div key={i}>
                                                <div className="inline-block me-2 h-2 w-2 rounded-[2px]" />
                                                {detail}
                                            </div>
                                        ))}
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        <div className="font-bold">
                                            <div className="inline-block me-2 h-2 w-2 rounded-[2px]" />
                                            {chartData[dataKey]}{" "}
                                            {itemConfig.unit ?? "kg N / ha"}
                                        </div>
                                    </CardContent>
                                </Card>
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
                {renderBar("a", supplyBar)}
                {renderBar("b", removalBar)}
            </BarChart>
        </ChartContainer>
    )
}
