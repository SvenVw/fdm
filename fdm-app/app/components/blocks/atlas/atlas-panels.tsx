import type { FeatureCollection } from "geojson"
import throttle from "lodash.throttle"
import { Check, Info } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import type { MapBoxZoomEvent, MapMouseEvent } from "react-map-gl/mapbox"
import { useMap } from "react-map-gl/mapbox"
import { data, NavLink, useFetcher } from "react-router"
import { LoadingSpinner } from "~/components/custom/loadingspinner"
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert"
import { Button } from "~/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { cn } from "~/lib/utils"

export function FieldsPanelHover({
    zoomLevelFields,
    layer,
    layerExclude,
}: {
    zoomLevelFields: number
    layer: string
    layerExclude?: string[] | string
}) {
    const { current: map } = useMap()
    const [panel, setPanel] = useState<React.ReactNode | null>(null)
    useEffect(() => {
        function updatePanel(evt: MapMouseEvent | MapBoxZoomEvent) {
            if (map) {
                // Set message about zoom level
                const zoom = map.getZoom()
                if (zoom && zoom > zoomLevelFields) {
                    const features = map.queryRenderedFeatures(evt.point, {
                        layers: [layer],
                    })

                    if (layerExclude) {
                        const featuresExclude = map.queryRenderedFeatures(
                            evt.point,
                            {
                                layers: Array.isArray(layerExclude)
                                    ? layerExclude
                                    : [layerExclude],
                            },
                        )
                        if (featuresExclude && featuresExclude.length > 0) {
                            setPanel(null)
                            return
                        }
                    }

                    if (
                        features &&
                        features.length > 0 &&
                        features[0].properties
                    ) {
                        setPanel(
                            <Card className={cn("w-full")}>
                                <CardHeader>
                                    <CardTitle>
                                        {layer === "fieldsSaved"
                                            ? features[0].properties.b_name
                                            : features[0].properties.b_lu_name}
                                    </CardTitle>
                                    <CardDescription>
                                        {layer === "fieldsSaved"
                                            ? `${features[0].properties.b_area} ha`
                                            : layer === "fieldsAvailable"
                                              ? "Klik om te selecteren"
                                              : "Klik om te verwijderen"}
                                    </CardDescription>
                                </CardHeader>
                            </Card>,
                        )
                    } else {
                        setPanel(null)
                    }
                }
            }
        }

        const throttledUpdatePanel = throttle(updatePanel, 250, {
            trailing: true,
        })

        if (map) {
            map.on("mousemove", throttledUpdatePanel)
            map.on("click", updatePanel)
            map.on("zoom", throttledUpdatePanel)
            map.on("load", updatePanel)
            return () => {
                map.off("mousemove", throttledUpdatePanel)
                map.off("zoom", throttledUpdatePanel)
            }
        }
    }, [map, zoomLevelFields, layer, layerExclude])

    return panel
}

export function FieldsPanelZoom({
    zoomLevelFields,
}: {
    zoomLevelFields: number
}) {
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
    numPreviouslyCreatedFields,
    continueTo,
}: {
    fields: FeatureCollection
    numPreviouslyCreatedFields: number
    continueTo: string
}) {
    const fetcher = useFetcher()
    const { current: map } = useMap()
    const [panel, setPanel] = useState<React.ReactNode | null>(null)

    const isSubmitting = fetcher.state === "submitting"

    const submitSelectedFields = useCallback(
        async (fields: FeatureCollection) => {
            if (fields.features.length === 0) return
            try {
                const formSelectedFields = new FormData()
                formSelectedFields.append(
                    "selected_fields",
                    JSON.stringify(fields),
                )

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
        },
        [fetcher],
    )

    useEffect(() => {
        function updatePanel() {
            if (map) {
                // Set information about fields
                const features = fields?.features || []
                if (features.length > 0) {
                    // console.log(fields.features)

                    const fieldCount = features.length
                    let fieldCountText = `Je hebt ${fieldCount} percelen geselecteerd`
                    if (fieldCount === 1) {
                        fieldCountText = "Je hebt 1 perceel geselecteerd"
                    }

                    const cultivations = features.reduce(
                        (
                            acc: { b_lu_name: string; count: number }[],
                            feature,
                        ) => {
                            if (!feature.properties) return acc
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
                                    {cultivations.map((cultivation, _index) => (
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
                                                Opslaan van geselecteerde
                                                percelen...
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
                        <Card>
                            <CardHeader>
                                <CardTitle>Percelen</CardTitle>
                                <CardDescription>
                                    Je hebt geen percelen geselecteerd
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4" />
                            <CardFooter>
                                <NavLink to={continueTo} className="flex-1">
                                    <Button className="w-full">
                                        <Check />
                                        <span>Doorgaan</span>
                                    </Button>
                                </NavLink>
                            </CardFooter>
                        </Card>,
                    )
                }
            }
        }
        updatePanel()
    }, [fields, isSubmitting, map, submitSelectedFields])

    return panel
}
