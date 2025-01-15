import {
  type MetaFunction,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  redirect,
  data,
  useLoaderData
} from "react-router";
import { ClientOnly } from "remix-utils/client-only"
import { centroid } from "@turf/centroid";
import wkx from 'wkx'

// Components
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

// Blocks
import { FieldsMap } from "@/components/blocks/fields-map";

// FDM
import { fdm } from "../lib/fdm.server";
import { addCultivation, addField, getFarm, addSoilAnalysis } from "@svenvw/fdm-core";
import { redirectWithSuccess } from "remix-toast";
import { AtlasFields } from "@/components/custom/atlas-fields";


// Meta
export const meta: MetaFunction = () => {
  return [
    { title: "FDM App" },
    { name: "description", content: "Welcome to FDM!" },
  ];
};

// Loader
export async function loader({
  request, params
}: LoaderFunctionArgs) {

  // Get the Id and name of the farm
  const b_id_farm = params.b_id_farm
  if (!b_id_farm) {
    throw data("Farm ID is required", { status: 400, statusText: "Farm ID is required" });
  }
  const farm = await getFarm(fdm, b_id_farm)

  if (!farm) {
    throw data("Farm not found", { status: 404, statusText: "Farm not found" });
  }

  // Get the Mapbox token
  const mapboxToken = String(process.env.MAPBOX_TOKEN)

  return {
    b_name_farm: farm.b_name_farm,
    mapboxToken: mapboxToken,
    fieldsAvailableUrl: process.env.AVAILABLE_FIELDS_URL
  }

}

// Main
export default function Index() {
  const loaderData = useLoaderData<typeof loader>();
  // const navigation = useNavigation();

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink>
                Maak een bedrijf
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink>
                {loaderData.b_name_farm}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink>
                Selecteer percelen
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <main>
        <div className="space-y-6 p-10 pb-0">
          <div className="flex items-center">
            <div className="space-y-0.5">
              <h2 className="text-2xl font-bold tracking-tight">Kaart</h2>
              <p className="text-muted-foreground">
                Zoom in en selecteer je percelen
              </p>
            </div>

            <div className="ml-auto">
              {/* <a href={`/farm/create/${loaderData.b_id_farm}/cultivations`} className="ml-auto">
                <Button>Doorgaan</Button>
              </a> */}
            </div>
          </div>
          <Separator className="my-6" />
        </div>
        <div>
          <ClientOnly
            fallback={
              <Skeleton className="h-full w-full rounded-xl" />
            }                        >
            {() => <AtlasFields
              height= "calc(100vh - 64px - 123px)"
              width="100%"
              interactive={true}
              mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
              mapboxToken={loaderData.mapboxToken}
              fieldsSelected={null}
              fieldsAvailableUrl={loaderData.fieldsAvailableUrl}
            />
            }
          </ClientOnly>
        </div>

      </main>
    </SidebarInset >
  );
}

// Action
export async function action({
  request, params
}: ActionFunctionArgs) {

  const formData = await request.formData()
  const b_id_farm = params.b_id_farm

  if (!b_id_farm) {
    throw data("Farm ID is required", { status: 400, statusText: "Farm ID is required" });
  }
  const selectedFields = JSON.parse(String(formData.get('selected_fields')))
  console.log(selectedFields)

  // Add fields to farm
  const b_ids = await Promise.all(selectedFields.features.map(async (field, index) => {
    const b_id_name = 'Perceel ' + (index + 1)
    const b_id_source = field.properties.b_id_source
    const b_lu_catalogue = 'nl_' + field.properties.b_lu_catalogue //TEMPORARY
    const currentYear = new Date().getFullYear()
    const defaultDate = new Date(currentYear, 0, 1)
    const b_manage_start = defaultDate.toISOString().split('T')[0]
    const b_date_sowing = defaultDate

    // Validate dates
    if (new Date(b_manage_start) > new Date() || new Date(b_date_sowing) > new Date()) {
      throw data('Future dates are not allowed', { status: 400, statusText: 'Future dates are not allowed' })
    }
    if (new Date(b_date_sowing) < new Date(b_manage_start)) {
      throw data('Sowing should happen after field started to be managed', { status: 400, statusText: 'Sowing should happen after field started to be managed' })
    }
    const fieldGeometry = wkx.Geometry.parseGeoJSON(field.geometry)
    const b_geometry = fieldGeometry.toWkt()

    try {
      const b_id = await addField(fdm, b_id_farm, b_id_name, b_id_source, b_geometry, b_manage_start, null, null)
      await addCultivation(fdm, b_lu_catalogue, b_id, b_date_sowing)

      if (process.env.NMI_API_KEY) {

        const fieldCentroid = centroid(field.geometry)
        const a_lon = fieldCentroid.geometry.coordinates[0]
        const a_lat = fieldCentroid.geometry.coordinates[1]

        const responseApi = await fetch("https://api.nmi-agro.nl/estimates?" + new URLSearchParams({
          a_lat: a_lat.toString(),
          a_lon: a_lon.toString()
        }),
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${process.env.NMI_API_KEY}`,
            },
          })

        if (!responseApi.ok) {
          throw data(responseApi.statusText, { status: responseApi.status, statusText: responseApi.statusText })
        }

        const result = await responseApi.json()
        const response = result.data

        await addSoilAnalysis(fdm, defaultDate, 'NMI', b_id, 30, defaultDate, { a_p_al: response.a_p_al, a_p_cc: response.a_p_cc, a_som_loi: response.a_som_loi, b_soiltype_agr: response.b_soiltype_agr, b_gwl_class: response.b_gwl_class })

      }

      return b_id

    } catch (error) {
      console.error(`Failed to process field ${b_id_name}:`, error)
      throw data(`Failed to add field ${b_id_name}: ${error.message}`, { status: 500, statusText: `Failed to add field ${b_id_name}` })
    }
  }))

  return redirectWithSuccess(`../addfarm/${b_id_farm}/fields/${b_ids[0]}`, { message: "Percelen zijn toegevoegd! 🎉" });
}