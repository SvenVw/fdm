import { Map, GeolocateControl } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css';

interface FieldsMapType {
  mapboxToken: string
}

export function FieldsMap(props: FieldsMapType) {
  // const navigation = useNavigation();
  const mapboxToken = props.mapboxToken

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
    >
      <GeolocateControl />
    </Map>


  )
}