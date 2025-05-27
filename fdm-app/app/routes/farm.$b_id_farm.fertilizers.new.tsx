import { zodResolver } from "@hookform/resolvers/zod"
import {
    addFertilizerToCatalogue,
    getFarm,
    getFarms,
    getFertilizers,
} from "@svenvw/fdm-core"
import { useEffect } from "react"
import {
    type ActionFunctionArgs,
    type LoaderFunctionArgs,
    type MetaFunction,
    data,
    useLoaderData,
} from "react-router"
import { useRemixForm } from "remix-hook-form"
import { redirectWithSuccess } from "remix-toast"
import type { z } from "zod"
import { FarmTitle } from "~/components/custom/farm/farm-title"
import { FertilizerForm } from "~/components/custom/fertilizer/form"
import { FormSchema } from "~/components/custom/fertilizer/formschema"
import { SidebarInset } from "~/components/ui/sidebar"
import { getSession } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { handleActionError, handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { extractFormValuesFromRequest } from "~/lib/form"
import { HeaderFarm } from "../components/custom/header/farm"
import { HeaderFertilizer } from "../components/custom/header/fertilizer"
import { Header } from "../components/custom/header/base"

export const meta: MetaFunction = () => {
    return [
        { title: `Meststof toevoegen | ${clientConfig.name}` },
        {
            name: "description",
            content:
                "Voeg een meststof toe om deze te gebruiken op dit bedrijf.",
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
        const fertilizer = {
            p_source: b_id_farm,
            p_name_nl: undefined,
            p_type: undefined,
            p_n_rt: undefined,
            p_n_wc: undefined,
            p_p_rt: undefined,
            p_k_rt: undefined,
            p_om: undefined,
            p_eoc: undefined,
            p_s_rt: undefined,
            p_ca_rt: undefined,
            p_mg_rt: undefined,
        }

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

        // Return user information from loader
        return {
            farm: farm,
            b_id_farm: b_id_farm,
            farmOptions: farmOptions,
            fertilizerOptions: fertilizerOptions,
            fertilizer: fertilizer,
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
            <Header
                action={{
                    to: "../fertilizers",
                    label: "Terug naar overzicht",
                    disabled: false,
                }}
            >
                <HeaderFarm
                    b_id_farm={loaderData.b_id_farm}
                    farmOptions={loaderData.farmOptions}
                />
                <HeaderFertilizer
                    b_id_farm={loaderData.b_id_farm}
                    p_id={undefined}
                    fertilizerOptions={[]}
                />
            </Header>
            <main>
                <FarmTitle
                    title={"Meststof toevoegen"}
                    description={
                        "Voeg een meststof toe om deze te gebruiken op dit bedrijf."
                    }
                />
                <div className="space-y-6 p-10 pb-0">
                    <FertilizerForm
                        fertilizer={loaderData.fertilizer}
                        form={form}
                        editable={true}
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

        if (!b_id_farm) {
            throw new Error("missing: b_id_farm")
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

        await addFertilizerToCatalogue(fdm, session.principal_id, b_id_farm, {
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
            p_name_en: undefined,
            p_description: undefined,
            p_dm: undefined,
            p_density: undefined,
            p_a: undefined,
            p_hc: undefined,
            p_eom: undefined,
            p_c_rt: undefined,
            p_c_of: undefined,
            p_c_if: undefined,
            p_c_fr: undefined,
            p_cn_of: undefined,
            p_n_if: undefined,
            p_n_of: undefined,
            p_ne: undefined,
            p_s_wc: undefined,
            p_cu_rt: undefined,
            p_zn_rt: undefined,
            p_na_rt: undefined,
            p_si_rt: undefined,
            p_b_rt: undefined,
            p_mn_rt: undefined,
            p_ni_rt: undefined,
            p_fe_rt: undefined,
            p_mo_rt: undefined,
            p_co_rt: undefined,
            p_as_rt: undefined,
            p_cd_rt: undefined,
            pr_cr_rt: undefined,
            p_cr_vi: undefined,
            p_pb_rt: undefined,
            p_hg_rt: undefined,
            p_cl_rt: undefined,
        })

        return redirectWithSuccess("../fertilizers", {
            message: "Meststof is toegevoegd! 🎉",
        })
    } catch (error) {
        throw handleActionError(error)
    }
}
