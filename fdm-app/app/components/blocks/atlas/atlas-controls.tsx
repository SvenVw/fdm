import { Layers, Mountain } from "lucide-react"
import type { ControlPosition, Map as MapLibreMap } from "maplibre-gl"
import { useEffect } from "react"
import { createRoot, type Root } from "react-dom/client"
import {
    GeolocateControl,
    type IControl,
    NavigationControl,
    useControl,
} from "react-map-gl/maplibre"
import { useIsMobile } from "~/hooks/use-mobile"
import { GeocoderControl } from "./atlas-geocoder"

type ControlsProps = {
    onViewportChange: (viewport: {
        longitude: number
        latitude: number
        zoom: number
    }) => void
    showFields?: boolean
    onToggleFields?: () => void
    showElevation?: boolean
    onToggleElevation?: () => void
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
            {props.showElevation !== undefined && props.onToggleElevation && (
                <ElevationControl
                    showElevation={props.showElevation}
                    onToggle={props.onToggleElevation}
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

interface ButtonProps {
    active: boolean
    onToggle: () => void
    labelActive: string
    labelInactive: string
    Icon: React.ElementType
}

function ControlButton({ active, onToggle, labelActive, labelInactive, Icon }: ButtonProps) {
    return (
        <button
            type="button"
            className="maplibregl-ctrl-icon flex items-center justify-center p-0!"
            onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onToggle()
            }}
            title={active ? labelActive : labelInactive}
        >
            <Icon
                className={`h-5 w-full ${active ? "opacity-100" : "opacity-40"}`}
            />
        </button>
    )
}

class CustomControl implements IControl {
    _map: MapLibreMap | undefined
    _container: HTMLDivElement | undefined
    _root: Root | undefined
    _props: ButtonProps

    constructor(initialProps: ButtonProps) {
        this._props = initialProps
    }

    onAdd(map: MapLibreMap): HTMLElement {
        this._map = map
        this._container = document.createElement("div")
        this._container.className = "maplibregl-ctrl maplibregl-ctrl-group"

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

    updateProps(newProps: ButtonProps) {
        this._props = newProps
        this._render()
    }

    _render() {
        if (this._root) {
            this._root.render(<ControlButton {...this._props} />)
        }
    }
}

const CONTROL_OPTIONS = { position: "top-right" as const }

function FieldsControl({
    showFields,
    onToggle,
}: {
    showFields: boolean
    onToggle: () => void
}) {
    const control = useControl<CustomControl>(
        () => new CustomControl({ 
            active: showFields, 
            onToggle, 
            labelActive: "Verberg percelen", 
            labelInactive: "Toon percelen",
            Icon: Layers
        }),
        CONTROL_OPTIONS,
    )

    useEffect(() => {
        control.updateProps({ 
            active: showFields, 
            onToggle, 
            labelActive: "Verberg percelen", 
            labelInactive: "Toon percelen",
            Icon: Layers
        })
    }, [control, showFields, onToggle])

    return null
}

function ElevationControl({
    showElevation,
    onToggle,
}: {
    showElevation: boolean
    onToggle: () => void
}) {
    const control = useControl<CustomControl>(
        () => new CustomControl({ 
            active: showElevation, 
            onToggle, 
            labelActive: "Verberg hoogtekaart", 
            labelInactive: "Toon hoogtekaart",
            Icon: Mountain
        }),
        CONTROL_OPTIONS,
    )

    useEffect(() => {
        control.updateProps({ 
            active: showElevation, 
            onToggle, 
            labelActive: "Verberg hoogtekaart", 
            labelInactive: "Toon hoogtekaart",
            Icon: Mountain
        })
    }, [control, showElevation, onToggle])

    return null
}
