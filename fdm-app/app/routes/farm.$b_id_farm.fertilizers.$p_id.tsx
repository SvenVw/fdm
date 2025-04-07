import { zodResolver } from "@hookform/resolvers/zod"
import {
    getFarm,
    getFarms,
    getFertilizer,
    getFertilizers,
} from "@svenvw/fdm-core"
import { updateFertilizerFromCatalogue } from "@svenvw/fdm-core"
import { useEffect } from "react"
import {
    type ActionFunctionArgs,
    type LoaderFunctionArgs,
    type MetaFunction,
    data,
    useLoaderData,
} from "react-router"
import { useRemixForm } from "remix-hook-form"
import { dataWithSuccess } from "remix-toast"
import type { z } from "zod"
import { FarmHeader } from "~/components/custom/farm/farm-header"
import { FarmTitle } from "~/components/custom/farm/farm-title"
import { FertilizerForm } from "~/components/custom/fertilizer/form"
import { FormSchema } from "~/components/custom/fertilizer/formschema"
import { SidebarInset } from "~/components/ui/sidebar"
import { getSession } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { handleActionError, handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { extractFormValuesFromRequest } from "~/lib/form"

export const meta: MetaFunction = () => {
    return [
        { title: `Meststof | ${clientConfig.name}` },
        {
            name: "description",
            content: "Bekij de details van deze meststof",
        },
    ]
}

export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        // Get the farm id
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw data("invalid: b_id_farm", {
                status: 400,
                statusText: "invalid: b_id_farm",
            })
        }

        // Get the fertilizer id
        const p_id = params.p_id
        if (!p_id) {
            throw data("invalid: p_id", {
                status: 400,
                statusText: "invalid: p_id",
            })
        }

        // Get the session
        const session = await getSession(request)

        // Get details of farm
        const farm = await getFarm(fdm, session.principal_id, b_id_farm)
        if (!farm) {
            throw data("not found: b_id_farm", {
                status: 404,
                statusText: "not found: b_id_farm",
            })
        }

        // Get a list of possible farms of the user
        const farms = await getFarms(fdm, session.principal_id)
        if (!farms || farms.length === 0) {
            throw data("not found: farms", {
                status: 404,
                statusText: "not found: farms",
            })
        }

        const farmOptions = farms.map((farm) => {
            return {
                b_id_farm: farm.b_id_farm,
                b_name_farm: farm.b_name_farm,
            }
        })

        // Get selected fertilizer
        const fertilizer = await getFertilizer(fdm, p_id)

        // Get the available fertilizers
        const fertilizers = await getFertilizers(
            fdm,
            session.principal_id,
            b_id_farm,
        )
        const fertilizerOptions = fertilizers.map((fertilizer) => {
            return {
                p_id: fertilizer.p_id,
                p_name_nl: fertilizer.p_name_nl,
            }
        })

        // Set editable status
        let editable = false
        if (fertilizer.p_source === b_id_farm) {
            editable = true
        }

        // Return user information from loader
        return {
            farm: farm,
            b_id_farm: b_id_farm,
            farmOptions: farmOptions,
            fertilizerOptions: fertilizerOptions,
            fertilizer: fertilizer,
            editable: editable,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

/**
 * Renders the layout for managing farm settings.
 *
 * This component displays a sidebar that includes the farm header, navigation options, and a link to farm fields.
 * It also renders a main section containing the farm title, description, nested routes via an Outlet, and a notification toaster.
 */
export default function FarmFertilizerBlock() {
    const loaderData = useLoaderData<typeof loader>()
    const fertilizer = loaderData.fertilizer

    fertilizer.p_type = ""
    if (fertilizer.p_type_manure) {
        fertilizer.p_type = "manure"
    } else if (fertilizer.p_type_compost) {
        fertilizer.p_type = "compost"
    } else if (fertilizer.p_type_mineral) {
        fertilizer.p_type = "mineral"
    }

    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
        defaultValues: {
            p_name_nl: fertilizer.p_name_nl,
            p_type: fertilizer.p_type,
            p_n_rt: fertilizer.p_n_rt,
            p_n_wc: fertilizer.p_n_wc,
            p_p_rt: fertilizer.p_p_rt,
            p_k_rt: fertilizer.p_k_rt,
            p_om: fertilizer.p_om,
            p_eoc: fertilizer.p_eoc,
            p_s_rt: fertilizer.p_s_rt,
            p_ca_rt: fertilizer.p_ca_rt,
            p_mg_rt: fertilizer.p_mg_rt,
        },
    })

    useEffect(() => {
        form.reset({
            p_name_nl: fertilizer.p_name_nl,
            p_type: fertilizer.p_type,
            p_n_rt: fertilizer.p_n_rt,
            p_n_wc: fertilizer.p_n_wc,
            p_p_rt: fertilizer.p_p_rt,
            p_k_rt: fertilizer.p_k_rt,
            p_om: fertilizer.p_om,
            p_eoc: fertilizer.p_eoc,
            p_s_rt: fertilizer.p_s_rt,
            p_ca_rt: fertilizer.p_ca_rt,
            p_mg_rt: fertilizer.p_mg_rt,
        })
    }, [fertilizer, form.reset])

    return (
        <SidebarInset>
            <FarmHeader
                farmOptions={loaderData.farmOptions}
                b_id_farm={loaderData.b_id_farm}
                action={{
                    to: "../fertilizers",
                    label: "Terug naar overzicht",
                }}
                fertilizerOptions={loaderData.fertilizerOptions}
                p_id={loaderData.fertilizer.p_id}
            />
            <main>
                <FarmTitle
                    title={loaderData.fertilizer.p_name_nl}
                    description={"Bekijk de eigenschappen van dit product"}
                />
                <div className="space-y-6 p-10 pb-0">
                    <FertilizerForm
                        fertilizer={loaderData.fertilizer}
                        form={form}
                        editable={loaderData.editable}
                        farm={loaderData.farm}
                    />
                </div>
            </main>
        </SidebarInset>
    )
}

export async function action({ request, params }: ActionFunctionArgs) {
    try {
        const b_id_farm = params.b_id_farm
        const p_id = params.p_id

        if (!b_id_farm) {
            throw new Error("missing: b_id_farm")
        }
        if (!p_id) {
            throw new Error("missing: p_id")
        }

        const session = await getSession(request)
        const formValues = await extractFormValuesFromRequest(
            request,
            FormSchema,
        )

        const {
            p_name_nl,
            p_type,
            p_n_rt,
            p_n_wc,
            p_p_rt,
            p_k_rt,
            p_om,
            p_eoc,
            p_s_rt,
            p_ca_rt,
            p_mg_rt,
        } = formValues

        let p_type_manure = false
        let p_type_compost = false
        let p_type_mineral = false
        if (p_type === "manure") {
            p_type_manure = true
        }
        if (p_type === "compost") {
            p_type_compost = true
        }
        if (p_type === "mineral") {
            p_type_mineral = true
        }

        const fertilizer = await getFertilizer(fdm, p_id)
        const p_id_catalogue = fertilizer.p_id_catalogue

        await updateFertilizerFromCatalogue(
            fdm,
            session.principal_id,
            b_id_farm,
            p_id_catalogue,
            {
                p_name_nl,
                p_type_manure,
                p_type_mineral,
                p_type_compost,
                p_n_rt,
                p_n_wc,
                p_p_rt,
                p_k_rt,
                p_om,
                p_eoc,
                p_s_rt,
                p_ca_rt,
                p_mg_rt,
            },
        )

        return dataWithSuccess(
            { result: "Data saved successfully" },
            { message: "Meststof is bijgewerkt! 🎉" },
        )
    } catch (error) {
        throw handleActionError(error)
    }
}
