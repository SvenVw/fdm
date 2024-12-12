import { useLoaderData, type LoaderFunctionArgs, data, ActionFunctionArgs } from "react-router";
import { extractFormValuesFromRequest } from "@/lib/form";
import { FormSchema } from "@/components/custom/combobox-fertilizers";

// Components
import { ComboboxFertilizers } from "@/components/custom/combobox-fertilizers";

// FDM
import { fdm } from "../services/fdm.server";
import { getCultivationPlan, getCultivationsFromCatalogue, getFertilizersFromCatalogue } from "@svenvw/fdm-core";

// Loader
export async function loader({
    request, params
}: LoaderFunctionArgs) {

    // Get the Id of the farm
    const b_id_farm = params.b_id_farm
    if (!b_id_farm) {
        throw data("Farm ID is required", { status: 400, statusText: "Farm ID is required" });
    }

    // Get the cultivation
    const b_lu_catalogue = params.b_lu_catalogue
    if (!b_lu_catalogue) {
        throw data("Cultivation catalogue ID is required", { status: 400, statusText: "Cultivation catalogue ID is required" });
    }

    // Fertilizer options
    const fertilizersCatalogue = await getFertilizersFromCatalogue(fdm)
    const fertilizerOptions = fertilizersCatalogue.map(fertilizer => {
        return {
            value: fertilizer.p_id_catalogue,
            label: fertilizer.p_name_nl
        }
    })


    return {
        b_lu_catalogue: b_lu_catalogue,
        b_id_farm: b_id_farm,
        fertilizerOptions: fertilizerOptions
    }
}

export default function Index() {
    const loaderData = useLoaderData<typeof loader>();

    return (
        <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
                Vul de bemesting op bouwplanniveau in voor dit gewas.
            </p>
            <ComboboxFertilizers
                action={`/app/addfarm/${loaderData.b_id_farm}/cultivations/${loaderData.b_lu_catalogue}/fertilizers`}
                options={loaderData.fertilizerOptions}
            />
        </div>
    )
}

export async function action({
    request,
  }: ActionFunctionArgs) {
    console.log("action")
  
    const formValues = await extractFormValuesFromRequest(request, FormSchema)
    console.log(formValues)

    const {p_app_amount, p_app_date} = formValues;
    console.log(format(p_app_date))
    
    return {
        ok: true,
    }
  
  }