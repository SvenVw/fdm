import {
	addCultivation,
	addField,
	addSoilAnalysis,
	getCultivationsFromCatalogue,
	getFarm,
	getFarms,
	getFields,
} from "@svenvw/fdm-core";
import type { Feature, FeatureCollection, Polygon } from "geojson";
import { useState } from "react";
import {
	GeolocateControl,
	Layer,
	Map as MapGL,
	NavigationControl,
} from "react-map-gl/mapbox";
import {
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	type MetaFunction,
	data,
	useLoaderData,
} from "react-router";
import { dataWithError, redirectWithSuccess } from "remix-toast";
import { ClientOnly } from "remix-utils/client-only";
import { ZOOM_LEVEL_FIELDS } from "~/components/blocks/atlas/atlas";
import {
	FieldsPanelHover,
	FieldsPanelZoom,
} from "~/components/blocks/atlas/atlas-panels";
import {
	FieldsSourceAvailable,
	FieldsSourceNotClickable,
} from "~/components/blocks/atlas/atlas-sources";
import { getFieldsStyle } from "~/components/blocks/atlas/atlas-styles";
import { getViewState } from "~/components/blocks/atlas/atlas-viewstate";
import FieldDetailsDialog from "~/components/blocks/field/form";
import { FormSchema } from "~/components/blocks/field/schema";
import { Header } from "~/components/blocks/header/base";
import { HeaderFarm } from "~/components/blocks/header/farm";
import { HeaderField } from "~/components/blocks/header/field";
import { Separator } from "~/components/ui/separator";
import { SidebarInset } from "~/components/ui/sidebar";
import { Skeleton } from "~/components/ui/skeleton";
import { getMapboxStyle, getMapboxToken } from "~/integrations/mapbox";
import { getNmiApiKey, getSoilParameterEstimates } from "~/integrations/nmi";
import { getSession } from "~/lib/auth.server";
import { getCalendar, getTimeframe } from "~/lib/calendar";
import { handleActionError, handleLoaderError } from "~/lib/error";
import { fdm } from "~/lib/fdm.server";
import { extractFormValuesFromRequest } from "~/lib/form";
import { useCalendarStore } from "~/store/calendar";

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: `Nieuw perceel | ${clientConfig.name}` },
        {
            name: "description",
            content: "Voeg een nieuw perceel toe",
        },
    ]
}

/**
 * Retrieves farm details and map configurations for rendering the farm map.
 *
 * This loader function extracts the farm ID from route parameters, validates its presence, and uses the current session to fetch the corresponding farm details. It then retrieves the Mapbox token and style configuration, and returns these along with the farm's display name and a URL for available fields. Any errors encountered during processing are transformed using {@link handleLoaderError}.
 *
 * @throws {Response} When the farm ID is missing, the specified farm is not found, or another error occurs during data retrieval.
 *
 * @returns An object containing the farm name, Mapbox token, Mapbox style, and the URL for available fields.
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
	try {
		// Get the Id and name of the farm
		const b_id_farm = params.b_id_farm;
		if (!b_id_farm) {
			throw data("Farm ID is required", {
				status: 400,
				statusText: "Farm ID is required",
			});
		}

		// Get the session
		const session = await getSession(request);

		// Get timeframe from calendar store
		const timeframe = getTimeframe(params);

		// Get a list of possible farms of the user
		const farms = await getFarms(fdm, session.principal_id);
		const farmOptions = farms.map((farm) => {
			if (!farm?.b_id_farm || !farm?.b_name_farm) {
				throw new Error("Invalid farm data structure");
			}
			return {
				b_id_farm: farm.b_id_farm,
				b_name_farm: farm.b_name_farm,
			};
		});

		const farm = await getFarm(fdm, session.principal_id, b_id_farm);

		if (!farm) {
			throw data("Farm not found", {
				status: 404,
				statusText: "Farm not found",
			});
		}

		// Get the fields of the farm
		const fields = await getFields(
			fdm,
			session.principal_id,
			b_id_farm,
			timeframe,
		);
		const features = fields.map((field) => {
			const feature: Feature = {
				type: "Feature" as const,
				properties: {
					b_id: field.b_id,
					b_name: field.b_name,
					b_area: Math.round(field.b_area * 10) / 10,
					b_lu_name: field.b_lu_name,
					b_id_source: field.b_id_source,
				},
				geometry: field.b_geometry,
			};
			return feature;
		});

		const featureCollection: FeatureCollection = {
			type: "FeatureCollection",
			features: features,
		};

		// Get the available cultivations
		let cultivationOptions = [];
		const cultivationsCatalogue = await getCultivationsFromCatalogue(
			fdm,
			session.principal_id,
			b_id_farm,
		);
		cultivationOptions = cultivationsCatalogue
			.filter(
				(cultivation) => cultivation?.b_lu_catalogue && cultivation?.b_lu_name,
			)
			.map((cultivation) => ({
				value: cultivation.b_lu_catalogue,
				label: `${cultivation.b_lu_name} (${cultivation.b_lu_catalogue.split("_")[1]})`,
			}));
		if (!cultivationOptions.length) {
			throw dataWithError(
				"No cultivations are available",
				"Er zijn nog geen gewassen beschikbaar.",
			);
		}

		// Create default field name
		const fieldNameDefault = `Perceel ${fields.length + 1}`;

		// Get the Mapbox token and style
		const mapboxToken = getMapboxToken();
		const mapboxStyle = getMapboxStyle();

		return {
			farmOptions: farmOptions,
			b_id_farm: b_id_farm,
			b_name_farm: farm.b_name_farm,
			featureCollection: featureCollection,
			fieldNameDefault: fieldNameDefault,
			cultivationOptions: cultivationOptions,
			mapboxToken: mapboxToken,
			mapboxStyle: mapboxStyle,
			fieldsAvailableUrl: process.env.AVAILABLE_FIELDS_URL,
		};
	} catch (error) {
		throw handleLoaderError(error);
	}
}

// Main
export default function Index() {
	const loaderData = useLoaderData<typeof loader>();
	const calendar = useCalendarStore((state) => state.calendar);

	const fieldsSavedId = "fieldsSaved";
	const fieldsSaved = loaderData.featureCollection;
	const fieldsSavedStyle = getFieldsStyle(fieldsSavedId);
	let viewState = getViewState(null);
	if (fieldsSaved.features.length > 0) {
		viewState = getViewState(fieldsSaved);
	}

	const fieldsAvailableId = "fieldsAvailable";
	const fieldsAvailableStyle = getFieldsStyle(fieldsAvailableId);

	const [open, setOpen] = useState(false);

	const [selectedField, setSelectedField] = useState<Feature<Polygon> | null>(
		null,
	);

	const handleSelectField = (feature: Feature<Polygon>) => {
		setSelectedField(feature);
		setOpen(true);
	};

	return (
		<SidebarInset>
			<Header
				action={{
					to: `/farm/${loaderData.b_id_farm}/${calendar}/field/`,
					label: "Terug naar percelen",
					disabled: false,
				}}
			>
				<HeaderFarm
					b_id_farm={loaderData.b_id_farm}
					farmOptions={loaderData.farmOptions}
				/>
				<HeaderField
					b_id_farm={loaderData.b_id_farm}
					fieldOptions={[]}
					b_id={undefined}
				/>
			</Header>
			{/* <FarmHeader
                farmOptions={loaderData.farmOptions}
                b_id_farm={loaderData.b_id_farm}
                fieldOptions={undefined}
                b_id={undefined}
                layerOptions={[]}
                layerSelected={undefined}
                fertilizerOptions={undefined}
                p_id={undefined}
                action={{
                    to: `/farm/${loaderData.b_id_farm}/${calendar}/field/`,
                    label: "Terug naar percelen",
                }}
            /> */}
			<main>
				<div className="space-y-6 p-10 pb-0">
					<div className="flex items-center">
						<div className="space-y-0.5">
							<h2 className="text-2xl font-bold tracking-tight">
								Nieuw perceel
							</h2>
							<p className="text-muted-foreground">
								Zoom in en voeg een nieuw perceel toe
							</p>
						</div>
					</div>
					<Separator className="my-6" />
				</div>
				<div>
					<ClientOnly
						fallback={<Skeleton className="h-full w-full rounded-xl" />}
					>
						{() => (
							<MapGL
								{...viewState}
								style={{
									height: "calc(100vh - 64px - 123px)",
									width: "100%",
								}}
								interactive={true}
								mapStyle={loaderData.mapboxStyle}
								mapboxAccessToken={loaderData.mapboxToken}
								interactiveLayerIds={[fieldsAvailableId, fieldsSavedId]}
								onClick={(evt) => {
									if (!evt.features) return;
									const polygonFeature = evt.features.find(
										(f) =>
											f.source === fieldsAvailableId &&
											f.geometry?.type === "Polygon",
									);
									if (polygonFeature) {
										handleSelectField(polygonFeature as Feature<Polygon>);
									}
								}}
							>
								<GeolocateControl />
								<NavigationControl />

								<FieldsSourceAvailable
									id={fieldsAvailableId}
									url={loaderData.fieldsAvailableUrl}
									zoomLevelFields={ZOOM_LEVEL_FIELDS}
								>
									<Layer {...fieldsAvailableStyle} />
								</FieldsSourceAvailable>

								<FieldsSourceNotClickable
									id={fieldsSavedId}
									fieldsData={fieldsSaved}
								>
									<Layer {...fieldsSavedStyle} />
								</FieldsSourceNotClickable>

								<div className="fields-panel grid gap-4 w-[350px]">
									<FieldsPanelZoom zoomLevelFields={ZOOM_LEVEL_FIELDS} />
									<FieldsPanelHover
										zoomLevelFields={ZOOM_LEVEL_FIELDS}
										layer={fieldsAvailableId}
										layerExclude={fieldsSavedId}
									/>
								</div>
							</MapGL>
						)}
					</ClientOnly>
				</div>
			</main>
			{selectedField && (
				<FieldDetailsDialog
					open={open}
					setOpen={setOpen}
					field={selectedField as Feature<Polygon>}
					cultivationOptions={loaderData.cultivationOptions}
					fieldNameDefault={loaderData.fieldNameDefault}
				/>
			)}
		</SidebarInset>
	);
}

export async function action({ request, params }: ActionFunctionArgs) {
	// Get the farm id
	const b_id_farm = params.b_id_farm;
	if (!b_id_farm) {
		throw data("Farm ID is required", {
			status: 400,
			statusText: "Farm ID is required",
		});
	}

	try {
		// Get the session
		const session = await getSession(request);

		// Get the timeframe
		const timeframe = getTimeframe(params);
		const calendar = getCalendar(params);

		const nmiApiKey = getNmiApiKey();

		// Get form values
		const formValues = await extractFormValuesFromRequest(request, FormSchema);

		// Check if cultivation is available
		let cultivationOptions = [];
		const cultivationsCatalogue = await getCultivationsFromCatalogue(
			fdm,
			session.principal_id,
			b_id_farm,
		);
		cultivationOptions = cultivationsCatalogue
			.filter(
				(cultivation) => cultivation?.b_lu_catalogue && cultivation?.b_lu_name,
			)
			.map((cultivation) => {
				return cultivation.b_lu_catalogue;
			});
		if (!cultivationOptions.includes(formValues.b_lu_catalogue)) {
			return dataWithError(
				`Cultivation ${formValues.b_lu_catalogue} is not available`,
				"Gewas is onbekend. Kies een gewas uit de lijst",
			);
		}

		const b_name = formValues.b_name;
		const b_id_source = formValues.b_id_source;
		const b_lu_catalogue = formValues.b_lu_catalogue;
		// Parse the geometry string twice to get the actual GeoJSON object
		const b_geometry = JSON.parse(
			JSON.parse(String(formValues.b_geometry)),
		) as Polygon;
		const currentYear = new Date().getFullYear();
		const defaultDate = timeframe.start
			? timeframe.start
			: `${currentYear}-01-01`;
		const b_start = defaultDate;
		const b_lu_start = defaultDate;
		const b_lu_end = undefined;
		const b_end = undefined;
		const b_acquiring_method = "unknown";

		const b_id = await addField(
			fdm,
			session.principal_id,
			b_id_farm,
			b_name,
			b_id_source,
			b_geometry,
			b_start,
			b_acquiring_method,
			b_end,
		);
		await addCultivation(
			fdm,
			session.principal_id,
			b_lu_catalogue,
			b_id,
			b_lu_start,
			b_lu_end,
		);

		if (nmiApiKey) {
			const estimates = await getSoilParameterEstimates(b_geometry, nmiApiKey);

			await addSoilAnalysis(
				fdm,
				session.principal_id,
				undefined,
				estimates.a_source,
				b_id,
				estimates.a_depth_lower,
				undefined,
				estimates,
			);
		}
        
		return redirectWithSuccess(
			`/farm/${b_id_farm}/${calendar}/field/${b_id}/fertilizer`,
			{
				message: `${b_name} is toegevoegd! 🎉`,
			},
		);
	} catch (error) {
		throw handleActionError(error);
	}
}
