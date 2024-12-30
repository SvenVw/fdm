import { Map as MapGL, GeolocateControl, NavigationControl, Source, Layer } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css';

export function MapFields({
    interactive,
    mapboxToken,
    mapStyle
 }: MapFieldsProps) {


    // Set controls
    let Controls = <></>
    if (interactive === true) {
        Controls = <div><GeolocateControl/><NavigationControl/></div>
    }

    return (
        <MapGL
            initialViewState={{
                longitude: 5,
                latitude: 52,
                zoom: 10,
            }}
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
