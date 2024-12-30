import { Map as MapGL, GeolocateControl, NavigationControl, Source, Layer } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css';
import geojsonExtent from '@mapbox/geojson-extent'
import type { FeatureCollection } from "geojson";
import { useMemo, useState } from 'react';

export function AtlasFields({
    interactive,
    mapboxToken,
    mapStyle,
    fieldsSelected,
}: MapFieldsProps) {

    // Set controls
    let Controls = <></>
    if (interactive === true) {
        Controls = <div><GeolocateControl /><NavigationControl /></div>
    }

    // Set viewState
    const initialBounds = [3.1, 50.7, 7.2, 53.6];
    const [viewState, setViewState] = useState({
        bounds: initialBounds,
        fitBoundsOptions: {
            padding: 0
        }
    });
    if (fieldsSelected) {
        const bounds = useMemo(() => {
            try {
                return geojsonExtent(fieldsSelected);
            } catch (error) {
                console.error('Failed to calculate bounds:', error);
                return initialBounds; 
            }
        }, [fieldsSelected]);
        setViewState({
            bounds: bounds,
            fitBoundsOptions: {
                padding: 10
            }
        })
    }

    return (
        <MapGL
            {...viewState}
            style={{ height: "calc(100vh - 64px - 123px)" }}
            interactive={interactive}
            mapStyle={mapStyle}
            mapboxAccessToken={mapboxToken}
        // onZoomEnd={async evt => await loadBrpFields(evt)}
        // onMoveEnd={async evt => await loadBrpFields(evt)}
        // onClick={evt => handleClickOnField(evt)}
        // interactiveLayerIds={['brp-fields-fill', 'selected-fields-fill', 'brp-fields-line']}
        >

            {Controls}
        </MapGL>
    )
}

interface MapFieldsProps {
    interactive: boolean
    mapboxToken: string
    mapStyle: "mapbox://styles/mapbox/satellite-streets-v12"
    fieldsSelected: FeatureCollection | null
}

interface GeoJSONFeature {
    type: string;
    geometry: {
        type: string;
        coordinates: number[][][];
    };
    properties: {
        reference_id: string;
        [key: string]: any;
    };
}

interface GeoJSONCollection {
    type: "FeatureCollection";
    features: GeoJSONFeature[];
}
