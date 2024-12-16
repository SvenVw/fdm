import { useLoaderData, type LoaderFunctionArgs, data, ActionFunctionArgs } from "react-router";
import { dataWithSuccess } from "remix-toast";

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

    // Extract farm ID from URL parameters
    const b_id_farm = params.b_id_farm
    if (!b_id_farm) {
        throw data("Farm ID is required", { status: 400, statusText: "Farm ID is required" });
    }

     // Extract cultivation catalogue ID from URL parameters
    const b_lu_catalogue = params.b_lu_catalogue
    if (!b_lu_catalogue) {
        throw data("Cultivation catalogue ID is required", { status: 400, statusText: "Cultivation catalogue ID is required" });
    }

    // Fetch available fertilizers for the farm
    const fertilizers = await getFertilizers(fdm, b_id_farm)
    // Map fertilizers to options for the combobox
    const fertilizerOptions = fertilizers.map(fertilizer => {
        return {
            value: fertilizer.p_id,
            label: fertilizer.p_name_nl
        }
    })

     // Fetch the cultivation plan for the farm
    const cultivationPlan = await getCultivationPlan(fdm, b_id_farm).catch(error => {
        throw data("Failed to fetch cultivation plan", { status: 500, statusText: error.message });
    });

    // Find the target cultivation within the cultivation plan
    const targetCultivation = cultivationPlan.find(c => c.b_lu_catalogue === b_lu_catalogue);
    if (!targetCultivation) {
        throw data("Cultivation not found", { status: 404 });
    }

    // Combine similar fertilizer applications across all fields of the target cultivation.
    const fertilizerApplications = targetCultivation.fields.reduce((accumulator, field) => {
        field.fertilizer_applications.forEach(app => {
            // Create a key based on application properties to identify similar applications.
            const applicationKey = JSON.stringify({
                p_id_catalogue: app.p_id_catalogue,
                p_app_amount: app.p_app_amount,
                p_app_method: app.p_app_method,
                p_app_date: app.p_app_date,
            });

            // Check if a similar application already exists in the accumulator.
            const existingApplication = accumulator.find(
                (existingApp) => JSON.stringify({
                    p_id_catalogue: existingApp.p_id_catalogue,
                    p_app_amount: existingApp.p_app_amount,
                    p_app_method: existingApp.p_app_method,
                    p_app_date: existingApp.p_app_date,
                }) === applicationKey
            );

            if (existingApplication) {
                // If similar application exists, add the current p_app_id to its p_app_ids array.
                existingApplication.p_app_ids.push(app.p_app_id);
            } else {
                // If it's a new application, add it to the accumulator with a new p_app_ids array.
                accumulator.push({ ...app, p_app_ids: [app.p_app_id] });
            }
        });

        return accumulator;
    }, []);

    return {
        b_lu_catalogue: b_lu_catalogue,
        b_id_farm: b_id_farm,
        fertilizerOptions: fertilizerOptions,
        fertilizerApplications: fertilizerApplications
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
                fertilizerApplications={loaderData.fertilizerApplications}
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
