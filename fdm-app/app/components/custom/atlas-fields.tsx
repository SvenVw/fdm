// import {
//     GeolocateControl,
//     Layer,
//     Map as MapGL,
//     NavigationControl,
// } from "react-map-gl"
// import "mapbox-gl/dist/mapbox-gl.css"

// import type { FeatureCollection } from "geojson"
// import { useEffect, useState } from "react"
// import type { LayerProps } from "react-map-gl"

// import {
//     FieldsPanelHover,
//     FieldsPanelSelection,
//     FieldsPanelZoom,
// } from "./atlas-fields-panels"
// import {
//     AvailableFieldsSource,
//     FieldsSource,
//     type fieldsAvailableUrlType,
//     generateFeatureClass,
// } from "./atlas-fields-sources"



// export function AtlasFields({
//     height,
//     width,
//     interactive,
//     mapboxToken,
//     mapStyle,
//     fieldsSelected,
//     fieldsAvailableUrl,
//     fieldsSaved,
// }: MapFieldsProps) {
//     // Set selected fields
//     const [selectedFieldsData, setSelectedFieldsData] = useState(
//         generateFeatureClass(),
//     )
//     useEffect(() => {
//         if (fieldsSelected) {
//             setSelectedFieldsData(fieldsSelected)
//         }
//     }, [fieldsSelected])

//     let Controls = null
//     let Panels = null
//     if (interactive === true) {
//         // Set controls
  

//         Panels = (
//             <div className="fields-panel grid gap-4 w-[350px]">
//                 {fieldsAvailableUrl && (
//                     <>
//                         <FieldsPanelZoom zoomLevelFields={ZOOM_LEVEL_FIELDS} />
//                         <FieldsPanelSelection fields={selectedFieldsData} />
//                         <FieldsPanelHover
//                             zoomLevelFields={ZOOM_LEVEL_FIELDS}
//                             layer={"available-fields-fill"}
//                         />

//                         <FieldsPanelHover
//                             zoomLevelFields={ZOOM_LEVEL_FIELDS}
//                             layer={"selected-fields-fill"}
//                         />
//                     </>
//                 )}
//                 {(fieldsSaved) && (
//                     <>
//                         <FieldsPanelZoom zoomLevelFields={ZOOM_LEVEL_FIELDS} />
//                         <FieldsPanelHover
//                             zoomLevelFields={ZOOM_LEVEL_FIELDS}
//                             layer={"saved-fields-fill"}
//                         />
//                     </>
//                 )}
//             </div>
//         )
//     }

//     // Set layers
//     const interactiveLayerIds = []
//     let FieldsSelectedLayer = null
//     let FieldsAvailableLayer = null
//     if (fieldsAvailableUrl) {
//         FieldsAvailableLayer = (
//             <AvailableFieldsSource
//                 url={fieldsAvailableUrl}
//                 zoomLevelFields={ZOOM_LEVEL_FIELDS}
//             >
//                 <Layer {...availableFieldsFillStyle} />
//                 {/* <Layer {...availableFieldsLineStyle} /> */}
//             </AvailableFieldsSource>
//         )
//         interactiveLayerIds.push("available-fields-fill")

//         FieldsSelectedLayer = (
//             <FieldsSource
//                 id="selectedFields"
//                 fieldsData={selectedFieldsData}
//                 setFieldsData={setSelectedFieldsData}
//             >
//                 <Layer {...selectedFieldsStyle} />
//             </FieldsSource>
//         )
//         interactiveLayerIds.push("selected-fields-fill")
//     }
//     let FieldsSavedLayer = null
//     if (fieldsSaved) {
//         FieldsSavedLayer = (
 
//         )
//         interactiveLayerIds.push("saved-fields-fill")
//     }

//     // Set viewState

//     let bounds = initialBounds
//     if (fieldsSaved) {
//         try {
//             bounds = geojsonExtent(fieldsSaved)
//         } catch (error) {
//             console.error("Failed to calculate bounds:", error)
//             bounds = initialBounds
//         }
//     }
//     if (fieldsSelected) {
//         try {
//             bounds = geojsonExtent(fieldsSelected)
//         } catch (error) {
//             console.error("Failed to calculate bounds:", error)
//             bounds = initialBounds
//         }
//     }
//     const viewState = {
//         bounds: bounds,
//         fitBoundsOptions: { padding: 100 },
//     }

//     return (
//         <>
//             <MapGL
//                 {...viewState}
//                 style={{ height: height || "100%", width: width || "100%" }}
//                 interactive={interactive}
//                 mapStyle={mapStyle}
//                 mapboxAccessToken={mapboxToken}
//                 interactiveLayerIds={interactiveLayerIds}
//             >
//                 {Controls}
//                 {FieldsSelectedLayer}
//                 {FieldsAvailableLayer}
//                 {FieldsSavedLayer}
//                 {Panels}
//             </MapGL>
//         </>
//     )
// }



