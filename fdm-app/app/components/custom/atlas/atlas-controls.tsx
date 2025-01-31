import { GeolocateControl, NavigationControl } from "react-map-gl"

export function Controls() {
    return (
        <>
            <GeolocateControl
                positionOptions={{ enableHighAccuracy: true }}
                trackUserLocation={true}
            />
            <NavigationControl />
        </>
    )
}
