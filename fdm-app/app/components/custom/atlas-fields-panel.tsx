import { FeatureCollection } from 'geojson';
import * as React from 'react';
import { useMap } from 'react-map-gl';

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Check, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import throttle from 'lodash.throttle';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function FieldsPanel({ fields }: { fields: FeatureCollection }) {

    const { current: map } = useMap();
    const [panel, setPanel] = useState({ zoomText: <></>, fieldsText: <></> });

    useEffect(() => {
        function updatePanel() {

            if (map) {

                let zoomText = panel.zoomText
                let fieldsText = panel.fieldsText

                // Set message about zoom level
                const zoom = map.getZoom()
                if (zoom && zoom <= 12) {
                    zoomText = <>
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>Let op!</AlertTitle>
                            <AlertDescription>
                                Zoom in om percelen te kunnen selecteren.
                            </AlertDescription>
                        </Alert>
                    </>
                } else {
                    zoomText = <></>

                }

                // Set information about fields
                if (fields.features.length > 0) {
                    console.log(fields.features)

                    const fieldCount = fields.features.length + 1
                    let fieldCountText = `Je hebt ${fieldCount} percelen geselecteerd`
                    if (fieldCount === 1) {
                        fieldCountText = `Je hebt 1 perceel geselecteerd`
                    }

                    const cultivations = fields.features.reduce((acc: { b_lu_name: string; count: number; }[], feature) => {
                        const existingCultivation = acc.find(c => c.b_lu_name === feature.properties.b_lu_name);
                        if (existingCultivation) {
                            existingCultivation.count++;
                        } else {
                            acc.push({ b_lu_name: feature.properties.b_lu_name, count: 1 });
                        }
                        return acc;
                    }, []);


                    fieldsText = <>
                        <Card className={cn("w-full")}>
                            <CardHeader>
                                <CardTitle>Percelen</CardTitle>
                                <CardDescription>{fieldCountText}</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <div>
                                    {cultivations.map((cultivation, index) => (
                                        // let cultivationCountText = `${cultivation.count + 1} percelen`

                                        <div
                                            key={index}
                                            className="mb-2 grid grid-cols-[25px_1fr] items-start pb-2 last:mb-0 last:pb-0"
                                        >
                                            <span className="flex h-2 w-2 translate-y-1 rounded-full bg-green-500" />
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium leading-none">
                                                    {cultivation.b_lu_name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {`${cultivation.count + 1} percelen`}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full">
                                    <Check /> Sla geselecteerde percelen op
                                </Button>
                            </CardFooter>
                        </Card>
                    </>
                } else {
                    fieldsText = <>
                        <Card className={cn("w-[380px]")}>
                            <CardHeader>
                                <CardTitle>Percelen</CardTitle>
                                <CardDescription>Je hebt geen percelen geselecteerd</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4">

                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" disabled>
                                    <Check /> Sla geselecteerde percelen op
                                </Button>
                            </CardFooter>
                        </Card>
                    </>
                }

                setPanel({
                    zoomText: zoomText,
                    fieldsText: fieldsText
                })
            }
        }

        const throttledUpdatePanel = throttle(updatePanel, 250, { trailing: true });

        if (map) {
            map.on("move", throttledUpdatePanel);
            map.on("zoom", throttledUpdatePanel);
            map.once('click', updatePanel)
            map.once("load", throttledUpdatePanel);
            return () => {
                map.off("move", throttledUpdatePanel);
                map.off("zoom", throttledUpdatePanel);
                // map.off('click', updatePanel)
            };
        }
        updatePanel()
    }, [fields, map]);

    return (
        <div className='fields-panel grid gap-4 w-[350px]'>
            {panel.zoomText}
            {panel.fieldsText}
        </div>
    );
}

// export default React.memo(FieldsPanel);