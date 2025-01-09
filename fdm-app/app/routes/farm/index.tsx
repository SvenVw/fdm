import { LoaderFunctionArgs, redirect, useLoaderData } from "react-router";
import { getFarms } from "@svenvw/fdm-core";
import { fdm } from "@/lib/fdm.server";
import { auth } from "@/lib/auth.server";

// Components

// Blocks
import MissingFarm from "@/components/blocks/missing-farm";

export async function loader({
    request,
}: LoaderFunctionArgs) {

    // Get the session
    const session = await auth.api.getSession({
        headers: request.headers
    })

    // Get the active farm and redirect to it
    const b_id_farm = session?.user?.farm_active
    if (b_id_farm) {
        redirect(`/farm/${b_id_farm}`)
    }

    // Get a list of possible farms of the user
    const farms = await getFarms(fdm)
    const farmOptions = farms.map(farm => {
        return {
            value: farm.b_id_farm,
            label: farm.b_name_farm
        }
    })

    // Return user information from loader
    return {
        b_id_farm: b_id_farm,
        farmOptions: farmOptions
    }
}

export default function FarmBlock() {
    const loaderData = useLoaderData<typeof loader>()

    return (
        <>
            {
                loaderData.farmOptions.length === 0 ? (
                    <MissingFarm />
                ) : (
                    // Render something else if b_id_farms is not empty
                    <div>Je hebt een bedrijf!</div>
                )
            }
        </>
    )
} 