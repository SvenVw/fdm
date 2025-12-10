import { format } from "date-fns/format"
import { type ReactElement, type Ref, useId, useMemo, useState } from "react"
import { nl } from "react-day-picker/locale"
import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { cn } from "@/app/lib/utils"
import {
    ChartContainer,
    ChartLegend,
    ChartTooltip,
} from "~/components/ui/chart"
import { getCultivationColor } from "~/components/custom/cultivation-colors"
import { Card, CardContent, CardHeader } from "~/components/ui/card"

type FertilizerTypes = "mineral" | "manure" | "compost" | "other"

type FieldInput = {
    cultivations: {
        b_lu: string
        b_lu_name: string
        b_lu_croprotation: string
    }[]
    harvests: {
        b_id_harvesting: string
        b_lu_harvest_date: Date
        b_lu: string
        harvestable: {
            b_id_harvestable: string
            harvestable_analyses: unknown[]
        }
    }[]
    fertilizerApplications: { p_app_id: string; p_name_nl: string }[]
}

type FarmBalanceData = {
    emission: {
        total: number
        ammonia: {
            total: number
            fertilizers: Record<"total" | FertilizerTypes, number>
            residues: number
        }
        nitrate: number
    }
    removal: {
        total: number
        harvests: number
        residues: number
    }
    supply: {
        total: number
        deposition: number
        fixation: number
        mineralization: number
        fertilizers: Record<FertilizerTypes, number>
    }
}

type FieldBalanceData = {
    emission: {
        total: number
        ammonia: {
            total: number
            residues: {
                total: number
                cultivations: { id: string; value: number }[]
            }
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
    removal: {
        total: number
        harvests: {
            total: number
            harvests: { id: string; value: number }[]
        }
        residues: {
            total: number
            cultivations: { id: string; value: number }[]
        }
    }
    supply: {
        total: number
        fixation: {
            total: number
            cultivations: { id: string; value: number }[]
        }
        deposition: { total: number }
        mineralization: { total: number }
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
}

type ApplicationChartConfigItem = {
    label: string
    color?: string
    styleId?: string
    fillPattern?: "dotted" | "striped"
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
    const removal =
        type === "farm" ? balanceData.removal : balanceData.removal.total
    const chartData: Record<string, number | undefined> = {
        deposition: Math.abs(
            type === "farm"
                ? balanceData.supply.deposition
                : balanceData.supply.deposition.total,
        ),
        mineralization: Math.abs(
            type === "farm"
                ? balanceData.supply.fixation
                : balanceData.supply.fixation.total,
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
        deposition: {
            label: "Depositie",
            color: "black",
        },
        fixation: {
            label: "Fixatie",
            color: "#f08",
        },
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
        supply: {
            label: "Aanvoer",
            color: "black",
            fillPattern: "dotted",
        },
        removal: {
            label: "Afvoer",
            color: "black",
            fillPattern: "striped",
        },
        emission: {
            label: "Emissie",
            color: "white",
        },
    } as const

    const chartConfig: Record<string, ApplicationChartConfigItem> = {
        ...legend,
        deposition: {
            ...legend.supply,
            ...legend.deposition,
        },
        fixation: {
            ...legend.supply,
            ...legend.fixation,
        },
        mineralization: {
            ...legend.supply,
            ...legend.mineralization,
        },
        removalHarvest: {
            ...legend.removal,
            label: "Afvoer door Oogsten",
            color: "var(--color-teal-700)",
        },
        removalResidue: {
            ...legend.removal,
            label: "Afvoer door Gewasresten",
            color: "var(--color-brown-300)",
        },
        emissionNitrate: {
            ...legend.emission,
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
            ...legend.supply,
            ...style,
            fillPattern: "dotted",
            label: `Aanvoer door ${langNL[fertilizerType]}`,
        }
        chartConfig[`${fertilizerType}FertilizerAmmonia`] = {
            ...legend.emission,
            ...style,
            label: `Ammoniakemissie door ${langNL[fertilizerType]}`,
        }
    }

    if (type === "farm") {
        chartData.fixation = Math.abs(balanceData.supply.fixation)
        chartData.residueAmmonia = Math.abs(
            balanceData.emission.ammonia.residues,
        )
        chartData.removalHarvest = Math.abs(balanceData.removal.harvests)
        chartData.removalResidue = Math.abs(balanceData.removal.residues)
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
                      label: format(application.p_app_date, "PP", {
                          locale: nl,
                      }),
                      unit: unit,
                      detail: application.p_name_nl,
                  }
                : {
                      styleId: dataKeyPrefix,
                      label: "onbekend",
                      unit: unit,
                  }
            bar.push(dataKey)
        }

        function addCultivation(
            fieldInput: FieldInput,
            dataKeyPrefix: string,
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
                label: cultivation.b_lu_name,
                unit: unit,
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
                        app,
                        "kg N / ha aanvoer",
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
                    app,
                    "kg N / ha ammoniakemissie",
                    fertilizerTypeAmmoniaBar,
                )
            })
            fertilizerAmmoniaBar.push(fertilizerTypeAmmoniaBar)
        })

        const fixationStyles: Record<string, ApplicationChartConfigItem> = {
            "": {
                ...legend.supply,
                label: "onbekend",
                color: "gray",
            },
        }

        balanceData.supply.fixation.cultivations.forEach(
            (cultivationResult) => {
                addCultivation(
                    fieldInput,
                    "fixation",
                    cultivationResult,
                    "kg N / ha fixatie",
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
                      label: format(harvestDetails.b_lu_harvest_date, "PP", {
                          locale: nl,
                      }),
                      styleId: "removalHarvest",
                      detail: cultivationDetails
                          ? cultivationDetails.b_lu_name
                          : undefined,
                  }
                : {
                      label: "onbekend oogst",
                      styleId: "removalHarvest",
                  }
            removalBar.push(dataKey)
        })

        const removalStyles: Record<string, ApplicationChartConfigItem> = {
            "": {
                ...legend.removal,
                label: "onbekend",
                color: "gray",
            },
        }

        balanceData.removal.residues.cultivations.forEach(
            (cultivationResult) => {
                addCultivation(
                    fieldInput,
                    "removalResidue",
                    cultivationResult,
                    "kg N / ha afvoer",
                    removalStyles,
                    removalBar,
                )
            },
        )

        Object.assign(chartConfig, removalStyles)

        const residueAmmoniaStyles: Record<string, ApplicationChartConfigItem> =
            {
                "": {
                    ...legend.emission,
                    label: "onbekend",
                    color: "gray",
                },
            }
        balanceData.emission.ammonia.residues.cultivations.forEach(
            (cultivationResult) => {
                addCultivation(
                    fieldInput,
                    "residueAmmonia",
                    cultivationResult,
                    "kg N / ha ammoniakemissie",
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

function DottedPatternDef({
    id,
    spacing = 0.5,
    darkness = 0.05,
    color = "black",
    bg,
    bgOpacity = 0.2,
    rotate,
}: {
    id: string
    color?: string
    spacing?: number
    darkness?: number
    bg?: string
    bgOpacity?: number
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
            viewBox="0 0 1 1"
        >
            {bg && (
                <rect
                    x={0}
                    y={0}
                    width={1}
                    height={1}
                    fill={bg}
                    fillOpacity={bgOpacity}
                />
            )}
            <circle cx={radius} cy={radius} r={radius} fill={color} />
        </pattern>
    )
}

function StripedPatternDef({
    id,
    spacing = 0.5,
    darkness = 0.1,
    color = "black",
    bg,
    bgOpacity = 0.2,
    rotate,
}: {
    id: string
    color?: string
    spacing?: number
    darkness?: number
    bg?: string
    bgOpacity?: number
    /** Rotation in degrees *without unit* */
    rotate?: number
}) {
    const worldSpaceTransform = "translate(0,0) scale(10,10)"
    return (
        <pattern
            id={id}
            patternUnits="userSpaceOnUse"
            viewBox="0 0 1 1"
            width={spacing}
            height={spacing}
            patternTransform={
                rotate
                    ? `rotate(${rotate}) ${worldSpaceTransform}`
                    : worldSpaceTransform
            }
            preserveAspectRatio="xMidYMid"
        >
            {bg && (
                <rect
                    x={0}
                    y={0}
                    width={1}
                    height={1}
                    fill={bg}
                    fillOpacity={bgOpacity}
                />
            )}
            <rect x={0} y={0} width={darkness} height={1} fill={color} />
        </pattern>
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
            {Object.values(
                Object.entries(chartConfig).reduce(
                    (pats, [dataKey, itemConfig]) => {
                        const id = buildPatternId(baseId, dataKey)
                        const styleId = itemConfig.styleId ?? dataKey
                        if (pats[styleId]) return pats
                        if (itemConfig.fillPattern === "dotted") {
                            pats[styleId] = (
                                <DottedPatternDef
                                    key={id}
                                    id={id}
                                    color={itemConfig.color}
                                    bg={itemConfig.color}
                                    rotate={30}
                                />
                            )
                        }
                        if (itemConfig.fillPattern === "striped") {
                            pats[styleId] = (
                                <StripedPatternDef
                                    key={id}
                                    id={id}
                                    color={itemConfig.color}
                                    bg={itemConfig.color}
                                    rotate={45}
                                />
                            )
                        }
                        return pats
                    },
                    {} as Record<string, ReactElement>,
                ),
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
        const styleId =
            chartConfig[dataKey as keyof typeof chartConfig]?.styleId ?? dataKey
        const itemConfig = styleId && chartConfig[styleId]
        if (!itemConfig) return {}

        if (itemConfig.fillPattern) {
            return {
                style: {
                    fill: `url(#${buildPatternId(patternId, styleId ?? dataKey)})`,
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
                    const barStyle = getBarStyle(dataKey)
                    return (
                        <Bar
                            key={dataKey}
                            dataKey={dataKey}
                            radius={pickBarRadius(i, barItem)}
                            stackId={stackId}
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
                })
            }

            const dataKey = barItem

            return (
                <Bar
                    key={dataKey}
                    dataKey={dataKey}
                    radius={barRadius}
                    stackId={stackId}
                    {...getBarStyle(dataKey)}
                    onMouseEnter={onTooltipFocus}
                    onMouseLeave={onTooltipBlur}
                />
            )
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
                {/** Needs to be inside a <g> tag so Recharts actually renders it */}
                <g>
                    <PatternDefinitions
                        id={patternId}
                        chartConfig={chartConfig}
                    />
                </g>
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
                                        {itemConfig.detail && (
                                            <div>
                                                <div className="inline-block me-2 h-2 w-2 rounded-[2px]" />
                                                {itemConfig.detail}
                                            </div>
                                        )}
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        <div>
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
                                            {itemConfig.fillPattern ||
                                            itemConfig.color === "white" ? (
                                                <svg
                                                    role="img"
                                                    aria-label={
                                                        itemConfig.label
                                                    }
                                                    viewBox="0 0 10 10"
                                                    className="h-6 w-6 border shrink-0 rounded-[2px]"
                                                    style={{
                                                        borderColor:
                                                            itemConfig.color ===
                                                            "white"
                                                                ? "black"
                                                                : itemConfig.color,
                                                    }}
                                                >
                                                    <rect
                                                        x={0}
                                                        y={0}
                                                        width={10}
                                                        height={10}
                                                        fill={
                                                            itemConfig.color ===
                                                            "white"
                                                                ? "black"
                                                                : `url(#${buildPatternId(patternId, dataKey)})`
                                                        }
                                                        fillOpacity={
                                                            itemConfig.color ===
                                                            "white"
                                                                ? 0.2
                                                                : 1
                                                        }
                                                    />
                                                </svg>
                                            ) : (
                                                <div
                                                    className="h-2 w-2 shrink-0 rounded-[2px]"
                                                    style={{
                                                        backgroundColor:
                                                            itemConfig.color,
                                                    }}
                                                />
                                            )}
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
