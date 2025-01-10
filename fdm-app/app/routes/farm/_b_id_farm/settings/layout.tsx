import { data, LoaderFunctionArgs, useLoaderData } from "react-router";
import { getFarm, getFarms } from "@svenvw/fdm-core";
import { fdm } from "@/lib/fdm.server";
import { auth } from "@/lib/auth.server";

// Components
import { ContentLayout } from "@/components/custom/farm-layout/content";

// Blocks

export async function loader({
    request, params
}: LoaderFunctionArgs) {

    // Get the farm id
    const b_id_farm = params.b_id_farm
    if (!b_id_farm) {
        throw data("Farm ID is required", { status: 400, statusText: "Farm ID is required" });
    }

    // Get details of farm
    let farm;
    try {
        const farm = await getFarm(fdm, b_id_farm)
        if (!farm) {
            throw data("Farm is not found", { status: 404, statusText: "Farm is not found" });
        }
    } catch (error) {
        console.error("Failed to fetch farm details:", error);
        throw data("Failed to fetch farm details", {
            status: 500,
            statusText: "Internal Server Error"
        });
    }

    // Set farm to active
    try {
        await auth.api.updateUser({
            body: {
                farm_active: b_id_farm,
            },
            headers: request.headers
        })
    } catch (error) {
        console.error("Failed to update active farm:", error);
        throw data("Failed to update active farm", {
            status: 500,
            statusText: "Internal Server Error"
        });
    }

    // Get a list of possible farms of the user
    const farms = await getFarms(fdm)
    const farmOptions = farms.map(farm => {
        return {
            value: farm.b_id_farm,
            label: farm.b_name_farm
        }
    })

    // Create the items for sidebar page
    const sidebarPageItems = [
        {
            to: `/farm/${farm.b_id_farm}/settings/properties`,
            title: "Gegevens"
        },
        {
            to: `/farm/${farm.b_id_farm}/settings/access`,
            title: "Toegang"
        },
        {
            to: `/farm/${farm.b_id_farm}/settings/delete`,
            title: "Verwijderen"
        }
    ]



    // Return user information from loader
    return {
        farm: farm,
        farmOptions: farmOptions,
        sidebarPageItems: sidebarPageItems
    }
}

export default function FarmSettingsLayout() {
    const loaderData = useLoaderData<typeof loader>();

    return (
        <ContentLayout
            title="Bedrijf"
            description="Beheer de gegevens en instellingen van dit bedrijf"
            sidebarItems={loaderData.sidebarPageItems}
        />
    );
}