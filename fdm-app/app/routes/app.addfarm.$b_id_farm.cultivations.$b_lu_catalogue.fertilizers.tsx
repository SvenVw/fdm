import { useLoaderData, type LoaderFunctionArgs, data, ActionFunctionArgs } from "react-router";
import { dataWithSuccess} from "remix-toast";

// Components
import { ComboboxFertilizers } from "@/components/custom/combobox-fertilizers";
import { extractFormValuesFromRequest } from "@/lib/form";
import { FormSchema } from "@/components/custom/combobox-fertilizers";

// FDM
import { fdm } from "../services/fdm.server";
import { getCultivationPlan, getFertilizers, addFertilizerApplication, getFertilizer } from "@svenvw/fdm-core";

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
    const fertilizers = await getFertilizers(fdm, b_id_farm)
    const fertilizerOptions = fertilizers.map(fertilizer => {
        return {
            value: fertilizer.p_id,
            label: fertilizer.p_name_nl
        }
    })

    return {
        b_lu_catalogue: b_lu_catalogue,
        b_id_farm: b_id_farm,
        fertilizerOptions: fertilizerOptions,
    };
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
    request, params
}: ActionFunctionArgs) {

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

    // Collect form entry
    const formValues = await extractFormValuesFromRequest(request, FormSchema)
    const { p_id, p_app_amount, p_app_date } = formValues;

    // Get the cultivation details for this cultivation
    const cultivationPlan = await getCultivationPlan(fdm, b_id_farm).catch(error => {
        throw data("Failed to fetch cultivation plan", { status: 500, statusText: error.message });
    });

    // Get the id of the fields with this cultivation
    const fields = cultivationPlan.find(cultivation => cultivation.b_lu_catalogue === b_lu_catalogue).fields

    fields.map(async (field) => {

        const b_id = field.b_id
        await addFertilizerApplication(
            fdm,
            b_id,
            p_id,
            p_app_amount,
            null,
            p_app_date
        )


    })

    return dataWithSuccess({ result: "Data saved successfully" }, { message: "Bemesting is toegevoegd! 🎉" })

}
