import { useState } from "react";
import { useFetcher } from "@remix-run/react";
import { Map, GeolocateControl, NavigationControl, Source, Layer } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css';

interface FieldsMapType {
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


export function FieldsMap(props: FieldsMapType) {
  // const navigation = useNavigation();
  const fetcher = useFetcher();
  const mapboxToken = props.mapboxToken

  const [bprFieldsData, setBrpFieldsData] = useState<any>(null);

  async function loadBrpFields(evt) {  
  
    // Check if user zoomed in enough
    const zoom = evt.target.getZoom()
    if (zoom >= 12) {
  
      // Get the bounding box of the map view
      const bbox = evt.target.getBounds(0.5)
  
      const formBrpFields = new FormData();
      formBrpFields.append("question", 'get_brp_fields')
      formBrpFields.append("xmax", bbox.getEast())
      formBrpFields.append("xmin", bbox.getWest())
      formBrpFields.append("ymax", bbox.getNorth())
      formBrpFields.append("ymin", bbox.getSouth())
  
      await fetcher.submit(formBrpFields, {
        method: "POST"
      })
      const brpFields = await fetcher.data
      setBrpFieldsData(brpFields)

    }
  }

  return (
    <Map
      initialViewState={{
        longitude: 5,
        latitude: 52,
        zoom: 10,
      }}
      style={{ height: "calc(100vh - 64px)" }}
      mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
      mapboxAccessToken={mapboxToken}
      onZoomEnd={async evt => await loadBrpFields(evt)}
      onMoveEnd={async evt => await loadBrpFields(evt)}      
    >
      <Source id="brpFields" type="geojson" data={bprFieldsData}>
          <Layer {...brpFieldsFillStyle} />
          <Layer {...brpFieldsLineStyle} />
        </Source>
      <NavigationControl />
      <GeolocateControl />
    </Map>


  )
}

