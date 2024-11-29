import { type MetaFunction, type ActionFunctionArgs, type LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { useNavigation, useLoaderData, useParams } from "@remix-run/react";
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
import { fdm } from "../services/fdm.server";
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
    throw new Response("Farm ID is required", { status: 400 });
  }
  const farm = await getFarm(fdm, b_id_farm)

  // Get the Mapbox token
  const mapboxToken = String(process.env.MAPBOX_TOKEN)

  return json({
    b_name_farm: farm.b_name_farm,
    mapboxToken: mapboxToken
  })

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
        <ClientOnly
          fallback={
            <Skeleton className="h-full w-full rounded-xl" />
          }                        >
          {() => <FieldsMap
            mapboxToken={loaderData.mapboxToken}
          />
          }
        </ClientOnly>
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
      throw new Error(`Failed to fetch fields data: ${responseApi.status} ${responseApi.statusText}`);
    }

    const data = await responseApi.json()
    response = data.data
  } else if (question === 'submit_selected_fields') {
    const b_id_farm = params.b_id_farm
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
        throw new Error('Future dates are not allowed')
      }
      if (new Date(b_date_sowing) < new Date(b_manage_start)) {
        throw new Error('Sowing should happen after field started to be managed')
      }
      const fieldGeometry = wkx.Geometry.parseGeoJSON(field.geometry)
      const b_geometry = fieldGeometry.toWkt()

      try {
        const b_id = await addField(fdm, b_id_farm, b_id_name, b_id_source, b_geometry, b_manage_start, null, null)
        const b_lu = await addCultivation(fdm, b_lu_catalogue, b_id, b_date_sowing)
        return { b_id, b_lu }
      } catch (error) {
        console.error(`Failed to process field ${b_id_name}:`, error)
        throw new Error(`Failed to add field ${b_id_name}: ${error.message}`)
      }
    }))

    return redirect(`../addfarm/${b_id_farm}/fields`)

  } else {
    throw new Error("Invalid POST question")
  }
  return json(response)
}