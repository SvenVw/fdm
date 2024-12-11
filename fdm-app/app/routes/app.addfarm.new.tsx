import type { MetaFunction, ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, redirect } from "react-router";
import { z } from "zod"
import { addFarm, getFertilizersFromCatalogue } from "@svenvw/fdm-core";

// Components
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

// Blocks
import { Farm } from "@/components/blocks/farm";

// Services
import { fdm } from "../services/fdm.server";
import { extractFormValuesFromRequest } from "@/lib/form";

// Meta
export const meta: MetaFunction = () => {
  return [
    { title: "FDM App" },
    { name: "description", content: "Welcome to FDM!" },
  ];
};

const FormSchema = z.object({
  b_name_farm: z.string({
      required_error: "Naam van bedrijf is verplicht",
  }).min(3, {
      message: "Naam van bedrijf moet minimaal 3 karakters bevatten",
  }),
})

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

  return {
    values: {
      b_name_farm: null,
      b_fertilizers_organic: null,
    },
    lists: {
      organicFertilizersList: organicFertilizersList,
      mineralFertilizersList: mineralFertilizersList
    }
  };
}

/**
 * Default component for the Add Farm page.
 * Renders the farm form and passes the validation schema to the Farm component.
 * @returns The JSX element representing the add farm page.
 */
export default function AddFarmPage() {
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
          FormSchema={FormSchema}
        />
      </main>
    </SidebarInset >
  );
}

/**
 * Action function for handling the submission of the add farm form.
 * Processes and validates form data to create a new farm.
 * @param request - The incoming request object containing form data.
 * @returns A redirect response to the newly created farm's page.
 */
export async function action({
  request,
}: ActionFunctionArgs) {
  const formValues = await extractFormValuesFromRequest(request, FormSchema)
  const { b_name_farm } = formValues;

  // Create a farm
  const b_id_farm = await addFarm(fdm, b_name_farm, null)

  return redirect(`../addfarm/${b_id_farm}/map`)
}