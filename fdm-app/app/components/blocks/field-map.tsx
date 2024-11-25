import { useMemo } from 'react';
import { Map as MapGL, Source, Layer } from 'react-map-gl'
import type { FeatureCollection } from "geojson";
import 'mapbox-gl/dist/mapbox-gl.css';
import geojsonExtent from '@mapbox/geojson-extent'

interface FieldMapType {
    b_geojson: FeatureCollection
    mapboxToken: string
}

const brpFieldsFillStyle = {
    id: 'brp-fields-fill',
    type: 'fill',
    paint: {
        'fill-color': "#93c5fd",
        'fill-opacity': 0.5,
        'fill-outline-color': "#1e3a8a"
    }
};
const brpFieldsLineStyle = {
    id: 'brp-fields-line',
    type: 'line',
    paint: {
        'line-color': "#1e3a8a",
        'line-opacity': 0.8,
        'line-width': 2,
    }
};


export function FieldMap(props: FieldMapType) {
    const mapboxToken = props.mapboxToken

    // Convert geometry to geoJSON
    const bounds = useMemo(() => {
        try {
            return geojsonExtent(props.b_geojson);
        } catch (error) {
            console.error('Failed to calculate bounds:', error);
            return [-180, -90, 180, 90]; // Default world bounds
        }
    }, [props.b_geojson]);

    return (
        <MapGL
            initialViewState={{
                bounds: bounds,
                fitBoundsOptions: {
                    padding: 40
                }
            }}
            style={{ width: '100%', height: '100%' }}
            interactive={false}
            mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
            mapboxAccessToken={mapboxToken}
            onError={(e: Error) => console.error('Map error:', e)}
        >

            <Source
                id="fieldMap"
                type="geojson"
                data={props.b_geojson}
                onError={(e: Error) => console.error('Source loading error:', e)}>

                <Layer {...brpFieldsFillStyle} />
                <Layer {...brpFieldsLineStyle} />
            </Source>
        </MapGL >
    )
}

