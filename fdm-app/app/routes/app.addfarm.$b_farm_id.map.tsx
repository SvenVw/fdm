import { type MetaFunction, type ActionFunctionArgs, type LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { ClientOnly } from "remix-utils/client-only"

// Components
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

// Blocks
import { FieldsMap } from "@/components/blocks/fields-map";

// FDM
import { fdm } from "../services/fdm.server";
import { Skeleton } from "@/components/ui/skeleton";


// Meta
export const meta: MetaFunction = () => {
  return [
    { title: "FDM App" },
    { name: "description", content: "Welcome to FDM!" },
  ];
};

// Loader
export async function loader({
  request,
}: LoaderFunctionArgs) {

  // Get the Mapbox token
  const mapboxToken = String(process.env.MAPBOX_TOKEN)

  return json({
    mapboxToken: mapboxToken
  })

}

// Main
export default function Index() {
  const loaderData = useLoaderData<typeof loader>();
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
  request,
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
    const data = await responseApi.json()
    response = data.data
  }
  
  return json(response)
}