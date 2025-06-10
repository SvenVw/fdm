import { GeolocateControl, NavigationControl } from "react-map-gl/mapbox"
import { GeocoderControl } from "./atlas-geocoder"

type ControlsProps = {
    onViewportChange: (viewport: {
        longitude: number
        latitude: number
        zoom: number
    }) => void
}

export function Controls(props: ControlsProps) {
    return (
        <>
            <GeocoderControl onViewportChange={props.onViewportChange} />
            <GeolocateControl
                positionOptions={{ enableHighAccuracy: true }}
                trackUserLocation={true}
            />
            <NavigationControl />
        </>
    )
}
