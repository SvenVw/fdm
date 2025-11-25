import { Layers } from "lucide-react"
import type { ControlPosition, Map as MapboxMap } from "mapbox-gl"
import { useEffect } from "react"
import { createRoot, type Root } from 'react-dom/client'
import {
    GeolocateControl,
    type IControl,
    NavigationControl,
    useControl,
} from "react-map-gl/mapbox"
import { GeocoderControl } from "./atlas-geocoder"
import { useIsMobile } from "~/hooks/use-mobile"

type ControlsProps = {
    onViewportChange: (viewport: {
        longitude: number
        latitude: number
        zoom: number
    }) => void
    showFields?: boolean
    onToggleFields?: () => void
}

export function Controls(props: ControlsProps) {
    const isMobile = useIsMobile()

    return (
        <>
            <GeocoderControl
                onViewportChange={props.onViewportChange}
                collapsed={isMobile}
            />
            {props.showFields !== undefined && props.onToggleFields && (
                <FieldsControl
                    showFields={props.showFields}
                    onToggle={props.onToggleFields}
                />
            )}
            <GeolocateControl
                positionOptions={{ enableHighAccuracy: true }}
                trackUserLocation={true}
            />
            <NavigationControl />
        </>
    )
}

interface FieldsButtonProps {
    showFields: boolean
    onToggle: () => void
}

function FieldsButton({ showFields, onToggle }: FieldsButtonProps) {
    return (
        <button
            type="button"
            className="mapboxgl-ctrl-icon flex items-center justify-center p-0!"
            onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onToggle()
            }}
            title={showFields ? "Verberg percelen" : "Toon percelen"}
        >
            <Layers
                className={`h-5 w-full ${showFields ? "opacity-100" : "opacity-40"}`}
            />
        </button>
    )
}

class CustomFieldsControl implements IControl {
    _map: MapboxMap | undefined
    _container: HTMLDivElement | undefined
    _root: Root | undefined
    _props: FieldsButtonProps

    constructor(initialProps: FieldsButtonProps) {
        this._props = initialProps
    }

    onAdd(map: MapboxMap): HTMLElement {
        this._map = map
        this._container = document.createElement("div")
        this._container.className = "mapboxgl-ctrl mapboxgl-ctrl-group"
        
        this._root = createRoot(this._container)
        this._render()

        return this._container
    }

    onRemove(): void {
        if (this._root) {
            this._root.unmount()
            this._root = undefined
        }
        this._container?.parentNode?.removeChild(this._container)
        this._container = undefined
        this._map = undefined
    }

    getDefaultPosition(): ControlPosition {
        return "top-right"
    }

    updateProps(newProps: FieldsButtonProps) {
        this._props = newProps
        this._render()
    }

    _render() {
        if (this._root) {
            this._root.render(<FieldsButton {...this._props} />)
        }
    }
}

const CONTROL_OPTIONS = { position: 'top-right' as const }

function FieldsControl({ showFields, onToggle }: { showFields: boolean; onToggle: () => void }) {
    const control = useControl<CustomFieldsControl>(
        () => new CustomFieldsControl({ showFields, onToggle }),
        CONTROL_OPTIONS
    )

    useEffect(() => {
        control.updateProps({ showFields, onToggle })
    }, [control, showFields, onToggle])

    return null
}


