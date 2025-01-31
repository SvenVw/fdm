import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import throttle from "lodash.throttle"
import { Info } from "lucide-react"
import { useEffect, useState } from "react"
import { useMap } from "react-map-gl"

export function FieldsPanelHover({
    zoomLevelFields, layer, layerExclude
}: { zoomLevelFields: number, layer: string, layerExclude?: string }) {
    const { current: map } = useMap()
    const [panel, setPanel] = useState<React.ReactNode | null>(null)
    useEffect(() => {
        function updatePanel(evt: any) {
            if (map) {
                // Set message about zoom level
                const zoom = map.getZoom()
                if (zoom && zoom > zoomLevelFields) {
                    const features = map.queryRenderedFeatures(evt.point, {
                        layers: [layer],
                    })

                    if (layerExclude) {
                        const featuresExclude = map.queryRenderedFeatures(evt.point, {
                            layers: [layerExclude],
                        })
                        if (featuresExclude && featuresExclude.length > 0) {
                            setPanel(null)
                            return
                        }
                    }

                    if (features && features.length > 0 && features[0].properties) {
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
                                            : layer === 'fieldsAvailable' ?
                                                "Klik om te selecteren"
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
            map.on("mousemove", (evt) => throttledUpdatePanel(evt))
            map.on("click", updatePanel)
            map.on("zoom", throttledUpdatePanel)
            map.on("load", updatePanel)
            return () => {
                map.off("mousemove", throttledUpdatePanel)
                map.off("zoom", throttledUpdatePanel)
            }
        }
    }, [map, zoomLevelFields, layer])

    return panel
}

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