import { useState } from "react";
import { useFetcher, useNavigation } from "@remix-run/react";
import { Map, GeolocateControl, NavigationControl, Source, Layer } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from "../ui/button";

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
const selectedFieldsStyle = {
  id: 'selected-fields-fill',
  type: 'fill',
  paint: {
    'fill-color': "#fca5a5",
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
  const navigation = useNavigation();
  const fetcher = useFetcher();
  const mapboxToken = props.mapboxToken

  const [bprFieldsData, setBrpFieldsData] = useState<any>(null);
  const [selectedFieldsData, setSelectedFieldsData] = useState<any>(null);

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

  function handleClickOnField(evt) {
    if (evt.features && evt.features[0].properties) {

      const feature = {
        type: evt.features[0].type,
        geometry: evt.features[0].geometry,
        properties: evt.features[0].properties
      }

      if (selectedFieldsData) {
        // Check if field is already selected
        const b_id = feature.properties.reference_id
        const featuresOld = selectedFieldsData.features

        const featureToRemove = featuresOld.find(f => f.properties.reference_id === b_id)

        if (featureToRemove) {
          // Remove field from selection
          const featuresWithRemoval = featuresOld.filter(f => f.properties.reference_id !== b_id)
          const featureCollection = {
            type: "FeatureCollection",
            features: featuresWithRemoval
          }
          setSelectedFieldsData(featureCollection)
        } else {
          // Add field to selection
          const featureCollection = {
            type: "FeatureCollection",
            features: [
              ...featuresOld,
              feature
            ]
          }
          setSelectedFieldsData(featureCollection)
        }
      } else {
        // Create selection with first field        
        const featureCollection = {
          type: "FeatureCollection",
          features: [
            feature
          ]
        }
        setSelectedFieldsData(featureCollection)
      }
    }
  }

  async function handleClickOnSubmit()  {
    
    selectedFieldsData

    const formSelectedFields = new FormData();
    formSelectedFields.append("question", 'submit_selected_fields')
    formSelectedFields.append("selected_fields", JSON.stringify(selectedFieldsData.features))

    await fetcher.submit(formSelectedFields, {
      method: "POST",
    })


  }

  return (
    <div style={{ position: "relative" }}>
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
        onClick={evt => handleClickOnField(evt)}
        interactiveLayerIds={['brp-fields-fill', 'selected-fields-fill', 'brp-fields-line']}
      >
        <Source id="brpFields" type="geojson" data={bprFieldsData}>
          <Layer {...brpFieldsFillStyle} />
          <Layer {...brpFieldsLineStyle} />
        </Source>
        <Source id="selectedFields" type="geojson" data={selectedFieldsData}>
          <Layer {...selectedFieldsStyle} />
          {/* <Layer {...brpFieldsLineStyle} /> */}
        </Source>
        <NavigationControl />
        <GeolocateControl />
      </Map>
      <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translate(-50%, -50%)" }}>
        <Button onClick={handleClickOnSubmit} disabled={!selectedFieldsData}>
          {navigation.state === "submitting"
            ? "Opslaan..."
            : "Voeg geselecteerde percelen toe"}
        </Button>
      </div>
    </div>
  )
}

