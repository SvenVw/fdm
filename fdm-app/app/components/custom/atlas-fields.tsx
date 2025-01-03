import { Map as MapGL,  GeolocateControl, NavigationControl, Layer } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css';
import geojsonExtent from '@mapbox/geojson-extent'
import type { FeatureCollection } from "geojson";
import { useMemo, useState } from 'react';
import type { LayerProps } from 'react-map-gl';


import { FieldsPanelZoom, FieldsPanelSelection, FieldsPanelHover } from './atlas-fields-panels';
import { AvailableFieldsSource, SelectedFieldsSource, generateFeatureClass, type fieldsAvailableUrlType } from './atlas-fields-sources';

const ZOOM_LEVEL_FIELDS = 12;

export function AtlasFields({
    interactive,
    mapboxToken,
    mapStyle,
    fieldsSelected,
    fieldsAvailableUrl
}: MapFieldsProps) {

    // Set selected fields
    const [selectedFieldsData, setSelectedFieldsData] = useState(generateFeatureClass());
    if (fieldsSelected) {
        setSelectedFieldsData(fieldsSelected)
    }

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
        <>
            <MapGL
                {...viewState}
                style={{ height: "calc(100vh - 64px - 123px)" }}
                interactive={interactive}
                mapStyle={mapStyle}
                mapboxAccessToken={mapboxToken}
                // onClick={evt => handleClickOnField(evt)}
                interactiveLayerIds={['available-fields-fill', 'selected-fields-fill']}
            >

                {Controls}
                <SelectedFieldsSource selectedFieldsData={selectedFieldsData} setSelectedFieldsData={setSelectedFieldsData} >
                    <Layer {...selectedFieldsStyle} />
                </SelectedFieldsSource>
                <AvailableFieldsSource url={fieldsAvailableUrl} zoomLevelFields={ZOOM_LEVEL_FIELDS} >
                    <Layer {...availableFieldsFillStyle} />
                    {/* <Layer {...availableFieldsLineStyle} /> */}
                </AvailableFieldsSource>
                <div className='fields-panel grid gap-4 w-[350px]'>
                    <FieldsPanelSelection fields={selectedFieldsData} zoomLevelFields={ZOOM_LEVEL_FIELDS} />
                    <FieldsPanelZoom zoomLevelFields={ZOOM_LEVEL_FIELDS} />
                    <FieldsPanelHover zoomLevelFields={ZOOM_LEVEL_FIELDS} />
                </div>
                
            </MapGL>

        </>

    )
}

const availableFieldsFillStyle: LayerProps & { id: string; type: string; paint: { 'fill-color': string; 'fill-opacity': number; 'fill-outline-color': string; } } = {
    id: 'available-fields-fill',
    type: 'fill',
    paint: {
        'fill-color': "#93c5fd",
        'fill-opacity': 0.5,
        'fill-outline-color': "#1e3a8a"
    },
};
const availableFieldsLineStyle = {
    id: 'available-fields-line',
    type: 'line',
    paint: {
        'line-color': "#1e3a8a",
        'line-opacity': 0.8,
        'line-width': 2,
    }
};
const selectedFieldsStyle: LayerProps & { id: string; type: string; paint: { 'fill-color': string; 'fill-opacity': number; 'fill-outline-color': string; } } = {
    id: 'selected-fields-fill',
    type: 'fill',
    paint: {
        'fill-color': "#fca5a5",
        'fill-opacity': 0.8,
        'fill-outline-color': "#1e3a8a"
    }
};

interface MapFieldsProps {
    interactive: boolean
    mapboxToken: string
    mapStyle: "mapbox://styles/mapbox/satellite-streets-v12"
    fieldsSelected: FeatureCollection | null
    fieldsAvailableUrl: fieldsAvailableUrlType
}
