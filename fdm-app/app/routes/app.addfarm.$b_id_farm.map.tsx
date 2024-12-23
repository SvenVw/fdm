import {
  type MetaFunction,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  redirect,
  data,
  useLoaderData 
} from "react-router";
import { ClientOnly } from "remix-utils/client-only"
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
import { addCultivation, addField, getFarm } from "@svenvw/fdm-core";


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
    mapboxToken: mapboxToken
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
              {/* <a href={`/app/addfarm/${loaderData.b_id_farm}/cultivations`} className="ml-auto">
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
            {() => <FieldsMap
              mapboxToken={loaderData.mapboxToken}
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
  const question = String(formData.get('question'))

  let response = null
  if (question == 'get_brp_fields') {
    const xmax = String(formData.get('xmax'))
    const xmin = String(formData.get('xmin'))
    const ymax = String(formData.get('ymax'))
    const ymin = String(formData.get('ymin'))

    const responseApi = await fetch("https://api.nmi-agro.nl/fields?" + new URLSearchParams({
      xmax: xmax,
      xmin: xmin,
      ymax: ymax,
      ymin: ymin,
      b_lu_productive: String(true)
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
    response = result.data
  } else if (question === 'submit_selected_fields') {
    const b_id_farm = params.b_id_farm

    if (!b_id_farm) {
      throw data("Farm ID is required", { status: 400, statusText: "Farm ID is required" });
    }
    const selectedFields = JSON.parse(String(formData.get('selected_fields')))

    // Add fields to farm
    await Promise.all(selectedFields.map(async (field, index) => {
      const b_id_name = 'Perceel ' + (index + 1)
      const b_id_source = field.properties.reference_id
      const b_lu_catalogue = field.properties.b_lu
      const currentYear = new Date().getFullYear()
      const defaultDate = new Date(currentYear, 0, 1)
      const b_manage_start = defaultDate.toISOString().split('T')[0]
      const b_date_sowing = defaultDate.toISOString().split('T')[0]

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
        const b_lu = await addCultivation(fdm, b_lu_catalogue, b_id, b_date_sowing)
        return { b_id, b_lu }
      } catch (error) {
        console.error(`Failed to process field ${b_id_name}:`, error)
        throw data(`Failed to add field ${b_id_name}: ${error.message}`, { status: 500, statusText: `Failed to add field ${b_id_name}` })
      }
    }))

    return redirect(`../addfarm/${b_id_farm}/fields`)

  } else {
    throw data("Invalid POST question", { status: 400, statusText: "Invalid POST question" })
  }

  if (!response) {
    throw data("No data returned", { status: 404, statusText: "No data returned" });
  }
  return response;
}