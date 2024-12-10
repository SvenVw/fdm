import type { MetaFunction, ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node"
import { useLoaderData, redirect } from "@remix-run/react";
import { addFarm, getFertilizersFromCatalogue } from "@svenvw/fdm-core";

// Components
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

// Blocks
import { Farm } from "@/components/blocks/farm";

// Services
import { fdm } from "../services/fdm.server";

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
  const fertilizers = await getFertilizersFromCatalogue(fdm);

  const organicFertilizersList = fertilizers
    .filter(x => { return (x.p_type_manure || x.p_type_compost) })
    .map(x => {
      return {
        value: x.p_id_catalogue,
        label: x.p_name_nl
      }
    })

  const mineralFertilizersList = fertilizers
    .filter(x => { return (x.p_type_mineral) })
    .map(x => {
      return {
        value: x.p_id_catalogue,
        label: x.p_name_nl
      }
    })

  return json({
    values: {
      b_name_farm: null,
      b_fertilizers_organic: null,
    },
    lists: {
      organicFertilizersList: organicFertilizersList,
      mineralFertilizersList: mineralFertilizersList
    }
  });
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
                Bedrijfsgegevens
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <main>
        <Farm
          b_name_farm={loaderData.values.b_name_farm}
          b_fertilizers_organic={[]}
          b_fertilizers_mineral={[]}
          organicFertilizersList={loaderData.lists.organicFertilizersList}
          mineralFertilizersList={loaderData.lists.mineralFertilizersList}
          action={"/app/addfarm/new"}
        />
      </main>
    </SidebarInset >
  );
}

// Action
export async function action({
  request,
}: ActionFunctionArgs) {
  const formData = await request.formData();
  const b_name_farm = String(formData.get('b_name_farm')).replace(/['"]+/g, '');
  // const b_fertilizers_organic = formData.get('b_fertilizers_organic');
  // const b_fertilizers_mineral = formData.getAll('b_fertilizers_mineral');

  // Create a farm
  const b_id_farm = await addFarm(fdm, b_name_farm, null)

  return redirect(`../addfarm/${b_id_farm}/map`)
}