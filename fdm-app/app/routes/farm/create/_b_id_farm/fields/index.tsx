import { type LoaderFunctionArgs, data, redirect } from "react-router";

// FDM
import { fdm } from "@/lib/fdm.server";
import { getFields } from "@svenvw/fdm-core";


// Loader
export async function loader({
    request, params
}: LoaderFunctionArgs) {

    // Get the Id and name of the farm
    const b_id_farm = params.b_id_farm
    if (!b_id_farm) {
        throw data("Farm ID is required", { status: 400, statusText: "Farm ID is required" });
    }
    // const farm = await getFarm(fdm, b_id_farm)

    // Get the fields
    const fields = await getFields(fdm, b_id_farm)

    // Sort by name
    fields.sort((a, b) => a.b_name.localeCompare(b.b_name));

    // Redirect to the first field
    return redirect(`/farm/create/${b_id_farm}/fields/${fields[0].b_id}`)
}