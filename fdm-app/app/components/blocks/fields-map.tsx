import { useState } from "react";
import { useFetcher } from "react-router";
import { Map as MapGL, GeolocateControl, NavigationControl, Source, Layer } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from "../ui/button";
import { LoadingSpinner } from "../custom/loadingspinner";

interface FieldsMapType {
  mapboxToken: string
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

/**
 * FieldsMap component renders a map interface for selecting and displaying fields.
 * Manages GeoJSON data and handles submission states.
 * @returns The JSX element representing the interactive fields map.
 */
export function FieldsMap(props: FieldsMapType) {
  const fetcher = useFetcher();
  const mapboxToken = props.mapboxToken

  const [bprFieldsData, setBrpFieldsData] = useState<GeoJSONCollection | null>(null);
  const [selectedFieldsData, setSelectedFieldsData] = useState<GeoJSONCollection | null>(null);

  const isSubmitting = fetcher.state === "submitting" && fetcher.formData?.get("question") === 'submit_selected_fields'
  const isLoading = fetcher.state === "submitting" && fetcher.formData?.get("question") === 'get_brp_fields'

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

      const newFeature = {
        type: evt.features[0].type,
        geometry: evt.features[0].geometry,
        properties: evt.features[0].properties
      };
      const b_id = newFeature.properties.reference_id;

      setSelectedFieldsData(prevData => {
        if (!prevData) {
          return {
            type: "FeatureCollection",
            features: [newFeature]
          };
        }

        const isSelected = prevData.features.some(f =>
          f.properties.reference_id === b_id
        );

        return {
          type: "FeatureCollection",
          features: isSelected
            ? prevData.features.filter(f =>
              f.properties.reference_id !== b_id
            )
            : [...prevData.features, newFeature]
        };
      });
    }
  }

  async function handleClickOnSubmit() {
    if (!selectedFieldsData?.features?.length) {
      return;
    }

    try {
      const formSelectedFields = new FormData();
      formSelectedFields.append("question", 'submit_selected_fields')
      formSelectedFields.append("selected_fields", JSON.stringify(selectedFieldsData.features))

      await fetcher.submit(formSelectedFields, {
        method: "POST",
      })

    } catch (error: unknown) {
      console.error('Failed to submit fields: ', error);
      throw new Error(`Failed to submit fields: ${error instanceof Error ? error.message : String(error)}`);
      // TODO: adding a toast notification with error
    }

  }

  return (
    <div style={{ position: "relative" }}>
      <MapGL
        initialViewState={{
          longitude: 5,
          latitude: 52,
          zoom: 10,
        }}
        style={{ height: "calc(100vh - 64px - 123px)" }}
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
      </MapGL>
      <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translate(-50%, -50%)" }}>
        <Button onClick={handleClickOnSubmit} disabled={!selectedFieldsData || isSubmitting || isLoading}>
          {isSubmitting ?
            <div className="flex items-center space-x-2">
              <LoadingSpinner />
              <span>Opslaan...</span>
            </div>
            : isLoading ?
              <div className="flex items-center space-x-2">
                <LoadingSpinner />
                <span>Laden van BRP percelen...</span>
              </div>
              : "Voeg geselecteerde percelen toe"
          }
        </Button>
      </div>
    </div>
  )
}

