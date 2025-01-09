import { fdm } from "@/lib/fdm.server";
import { getCultivationPlan, getCultivationsFromCatalogue } from "@svenvw/fdm-core";
import { data, LoaderFunctionArgs, redirect } from "react-router";

// Loader
export async function loader({
    request, params
}: LoaderFunctionArgs) {

    // Get the Id of the farm
    const b_id_farm = params.b_id_farm
    if (!b_id_farm) {
        throw data("Farm ID is required", { status: 400, statusText: "Farm ID is required" });
    }

    // Get the cultivation details for this cultivation
    const cultivationPlan = await getCultivationPlan(fdm, b_id_farm).catch(error => {
        throw data("Failed to fetch cultivation plan", { status: 500, statusText: error.message });
    });

    // Sort the cultivations by name
    cultivationPlan.sort((a, b) => a.b_lu_name.localeCompare(b.b_lu_name))

    if (cultivationPlan.length === 0) {
        throw data("No cultivations found", {
            status: 404,
            statusText: "No cultivations available for this farm"
        });
    }

    // Get the first cultivation and redirect to it
    const firstCultivation = cultivationPlan[0].b_lu_catalogue
    return redirect(`/farm/create/${b_id_farm}/cultivations/${firstCultivation}`)
}

