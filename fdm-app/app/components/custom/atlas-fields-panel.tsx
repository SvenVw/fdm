import { FeatureCollection } from 'geojson';
import * as React from 'react';
import { useMap } from 'react-map-gl';

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import throttle from 'lodash.throttle';

function FieldsPanel({ fields }: { fields: FeatureCollection }) {

    const { current: map } = useMap();
    const [panel, setPanel] = useState({ zoomText: <></>, fieldsText: <></> });

    useEffect(() => {
        async function updatePanel() {

            if (map) {

                const zoom = map.getZoom()

                if (zoom && zoom <= 12) {
                    setPanel({
                        zoomText: <>
                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertTitle>Let op!</AlertTitle>
                                <AlertDescription>
                                    Zoom in om percelen te kunnen selecteren.
                                </AlertDescription>
                            </Alert>
                        </>,
                        fieldsText: <></>
                    }
                    )
                } else {
                    setPanel({
                        zoomText: <></>,
                        fieldsText: <></>
                    })
                }
            }
        }

        const throttledUpdatePanel = throttle(updatePanel, 250, { trailing: true });

        if (map) {
            map.on("move", throttledUpdatePanel);
            map.on("zoom", throttledUpdatePanel);
            map.once("load", throttledUpdatePanel);
            return () => {
                map.off("move", throttledUpdatePanel);
                map.off("zoom", throttledUpdatePanel);
            };
        }
    }, []);

    return (
        <div className='fields-panel'>
            {panel.zoomText}
            {panel.fieldsText}
        </div>
    );
}

export default React.memo(FieldsPanel);