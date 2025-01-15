import type { FeatureCollection } from "geojson"
import type * as React from "react"
import { useMap } from "react-map-gl"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import throttle from "lodash.throttle"
import { Check, Info } from "lucide-react"
import { useEffect, useState } from "react"
import { data, useFetcher } from "react-router"
import { LoadingSpinner } from "./loadingspinner"

export function FieldsPanelZoom({
    zoomLevelFields,
}: { zoomLevelFields: number }) {
    const { current: map } = useMap()
    const [panel, setPanel] = useState<React.ReactNode | null>(null)

    useEffect(() => {
        function updatePanel() {
            if (map) {
                // Set message about zoom level
                const zoom = map.getZoom()
                if (zoom && zoom <= zoomLevelFields) {
                    setPanel(
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>Let op!</AlertTitle>
                            <AlertDescription>
                                Zoom in om percelen te kunnen selecteren.
                            </AlertDescription>
                        </Alert>,
                    )
                } else {
                    setPanel(null)
                }
            }
        }

        const throttledUpdatePanel = throttle(updatePanel, 250, {
            trailing: true,
        })

        if (map) {
            map.on("move", throttledUpdatePanel)
            map.on("zoom", throttledUpdatePanel)
            map.once("load", throttledUpdatePanel)
            return () => {
                map.off("move", throttledUpdatePanel)
                map.off("zoom", throttledUpdatePanel)
            }
        }
    }, [map, zoomLevelFields])

    return panel
}

export function FieldsPanelSelection({
    fields,
}: { fields: FeatureCollection }) {
    const fetcher = useFetcher()
    const { current: map } = useMap()
    const [panel, setPanel] = useState<React.ReactNode | null>(null)

    const isSubmitting = fetcher.state === "submitting"

    async function submitSelectedFields(fields: FeatureCollection) {
        try {
            const formSelectedFields = new FormData()
            formSelectedFields.append("selected_fields", JSON.stringify(fields))

            await fetcher.submit(formSelectedFields, {
                method: "POST",
            })
        } catch (error: unknown) {
            console.error("Failed to submit fields: ", error)
            throw data({
                status: 500,
                statusText: `Failed to submit fields: ${error}`,
            })
            // TODO: adding a toast notification with error
        }
    }

    useEffect(() => {
        function updatePanel() {
            if (map) {
                // Set information about fields
                if (fields.features.length > 0) {
                    console.log(fields.features)

                    const fieldCount = fields.features.length
                    let fieldCountText = `Je hebt ${fieldCount} percelen geselecteerd`
                    if (fieldCount === 1) {
                        fieldCountText = "Je hebt 1 perceel geselecteerd"
                    }

                    const cultivations = fields.features.reduce(
                        (
                            acc: { b_lu_name: string; count: number }[],
                            feature,
                        ) => {
                            const existingCultivation = acc.find(
                                (c) =>
                                    c.b_lu_name ===
                                    feature.properties.b_lu_name,
                            )
                            if (existingCultivation) {
                                existingCultivation.count++
                            } else {
                                acc.push({
                                    b_lu_name: feature.properties.b_lu_name,
                                    count: 1,
                                })
                            }
                            return acc
                        },
                        [],
                    )

                    setPanel(
                        <Card className={cn("w-full")}>
                            <CardHeader>
                                <CardTitle>Percelen</CardTitle>
                                <CardDescription>
                                    {fieldCountText}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <div>
                                    {cultivations.map((cultivation, index) => (
                                        // let cultivationCountText = `${cultivation.count + 1} percelen`

                                        <div
                                            key={cultivation.b_lu_name}
                                            className="mb-2 grid grid-cols-[25px_1fr] items-start pb-2 last:mb-0 last:pb-0"
                                        >
                                            <span className="flex h-2 w-2 translate-y-1 rounded-full bg-green-500" />
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium leading-none">
                                                    {cultivation.b_lu_name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {`${cultivation.count} percelen`}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    onClick={() => submitSelectedFields(fields)}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center space-x-2">
                                            <LoadingSpinner />
                                            <span>
                                                Sla geselecteerde percelen op
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <Check />
                                            <span>
                                                Sla geselecteerde percelen op
                                            </span>
                                        </div>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>,
                    )
                } else {
                    setPanel(
                        <Card className={cn("w-[380px]")}>
                            <CardHeader>
                                <CardTitle>Percelen</CardTitle>
                                <CardDescription>
                                    Je hebt geen percelen geselecteerd
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4" />
                            <CardFooter>
                                <Button className="w-full" disabled>
                                    <Check /> Sla geselecteerde percelen op
                                </Button>
                            </CardFooter>
                        </Card>,
                    )
                }
            }
        }
        updatePanel()
    }, [fields, isSubmitting, map])

    return panel
}

export function FieldsPanelHover({
    zoomLevelFields,
}: { zoomLevelFields: number }) {
    const { current: map } = useMap()
    const [panel, setPanel] = useState<React.ReactNode | null>(null)

    useEffect(() => {
        function updatePanel(evt) {
            if (map) {
                // Set message about zoom level
                const zoom = map.getZoom()
                if (zoom && zoom > zoomLevelFields) {
                    const featuresSelected = map.queryRenderedFeatures(
                        evt.point,
                        {
                            layers: ["selected-fields-fill"],
                        },
                    )

                    if (featuresSelected.length > 0) {
                        setPanel(
                            <Card className={cn("w-full")}>
                                <CardHeader>
                                    <CardTitle>
                                        {
                                            featuresSelected[0].properties
                                                .b_lu_name
                                        }
                                    </CardTitle>
                                    <CardDescription>
                                        Klik om te verwijderen
                                    </CardDescription>
                                </CardHeader>
                            </Card>,
                        )
                    } else {
                        const featuresAvailable = map.queryRenderedFeatures(
                            evt.point,
                            {
                                layers: ["available-fields-fill"], // Specify the layer ID
                            },
                        )

                        if (featuresAvailable.length > 0) {
                            setPanel(
                                <Card className={cn("w-ful")}>
                                    <CardHeader>
                                        <CardTitle>
                                            {
                                                featuresAvailable[0].properties
                                                    .b_lu_name
                                            }
                                        </CardTitle>
                                        <CardDescription>
                                            Klik om te selecteren
                                        </CardDescription>
                                    </CardHeader>
                                </Card>,
                            )
                        } else {
                            setPanel(null)
                        }
                    }
                } else {
                    setPanel(null)
                }
            }
        }

        const throttledUpdatePanel = throttle(updatePanel, 250, {
            trailing: true,
        })

        if (map) {
            map.on("mousemove", throttledUpdatePanel)
            map.once("click", updatePanel)
            map.on("zoom", throttledUpdatePanel)
            map.once("load", updatePanel)
            return () => {
                map.off("mousemove", throttledUpdatePanel)
            }
        }
    }, [map, zoomLevelFields])

    return panel
}
