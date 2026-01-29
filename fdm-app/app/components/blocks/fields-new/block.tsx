import type {
    CurrentSoilData,
    SoilParameterDescription,
} from "@svenvw/fdm-core"
import type maplibregl from "maplibre-gl"
import { NewFieldsAtlas } from "./atlas"
import { NewFieldsForm } from "./form"
import { NewFieldSoilAnalysisBlock } from "./soil"

export function NewFieldsBlock({
    b_id,
    b_name,
    b_area,
    b_lu_catalogue,
    b_bufferstrip,
    cultivationOptions,
    featureCollection,
    mapStyle,
    currentSoilData,
    soilParameterDescription,
}: NewFieldsBlockProps) {
    return (
        <div className="space-y-6">
            <div className="grid lg:grid-cols-4 gap-6">
                <div className="col-span-2">
                    <NewFieldsForm
                        b_id={b_id}
                        b_name={b_name}
                        b_area={b_area}
                        b_lu_catalogue={b_lu_catalogue}
                        b_bufferstrip={b_bufferstrip}
                        cultivationOptions={cultivationOptions}
                    />
                </div>
                <div className="col-span-2 space-y-5">
                    <NewFieldsAtlas
                        featureCollection={featureCollection}
                        mapStyle={mapStyle}
                    />
                </div>
            </div>
            <div className="col-span-4">
                <NewFieldSoilAnalysisBlock
                    b_id={b_id}
                    currentSoilData={currentSoilData}
                    soilParameterDescription={soilParameterDescription}
                />
            </div>
        </div>
    )
}

type NewFieldsBlockProps = {
    b_id: string
    b_name: string
    b_area: number
    b_lu_catalogue: string
    b_bufferstrip: boolean
    cultivationOptions: {
        value: string
        label: string
    }[]
    featureCollection: GeoJSON.FeatureCollection
    mapStyle: string | maplibregl.StyleSpecification
    currentSoilData: CurrentSoilData
    soilParameterDescription: SoilParameterDescription
}
