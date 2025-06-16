import { zodResolver } from "@hookform/resolvers/zod"
import {
    addFertilizer,
    addFertilizerToCatalogue,
    getFarm,
    getFarms,
    getFertilizers,
    getFertilizerParametersDescription,
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
import { FarmTitle } from "~/components/blocks/farm/farm-title"
import { FormSchema } from "~/components/blocks/fertilizer/formschema"
import { SidebarInset } from "~/components/ui/sidebar"
import { getSession } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { handleActionError, handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { extractFormValuesFromRequest } from "~/lib/form"
import { Header } from "~/components/blocks/header/base"
import { HeaderFarm } from "~/components/blocks/header/farm"
import { HeaderFertilizer } from "~/components/blocks/header/fertilizer"
import { FertilizerForm } from "@/app/components/blocks/fertilizer/form"

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
                b_name_farm: farm.b_name_farm || "",
            }
        })

        // Get selected fertilizer
        const fertilizerParameters = getFertilizerParametersDescription()

        const fertilizer = {
            p_id: undefined, // Added p_id
            p_source: b_id_farm,
            p_name_nl: undefined,
            p_type: undefined,
            p_dm: undefined,
            p_density: undefined,
            p_om: undefined,
            p_a: undefined,
            p_hc: undefined,
            p_eom: undefined,
            p_eoc: undefined,
            p_c_rt: undefined,
            p_c_of: undefined,
            p_c_if: undefined,
            p_c_fr: undefined,
            p_cn_of: undefined,
            p_n_rt: undefined,
            p_n_if: undefined,
            p_n_of: undefined,
            p_n_wc: undefined,
            p_p_rt: undefined,
            p_k_rt: undefined,
            p_mg_rt: undefined,
            p_ca_rt: undefined,
            p_ne: undefined,
            p_s_rt: undefined,
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
            p_cr_rt: undefined,
            p_cr_vi: undefined,
            p_pb_rt: undefined,
            p_hg_rt: undefined,
            p_cl_rt: undefined,
            p_app_method_options: undefined,
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
            fertilizerParameters: fertilizerParameters,
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
    const { fertilizer, fertilizerParameters } = loaderData

    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
        defaultValues: {
            p_name_nl: fertilizer.p_name_nl,
            p_type: fertilizer.p_type,
            p_dm: fertilizer.p_dm,
            p_density: fertilizer.p_density,
            p_om: fertilizer.p_om,
            p_a: fertilizer.p_a,
            p_hc: fertilizer.p_hc,
            p_eom: fertilizer.p_eom,
            p_eoc: fertilizer.p_eoc,
            p_c_rt: fertilizer.p_c_rt,
            p_c_of: fertilizer.p_c_of,
            p_c_if: fertilizer.p_c_if,
            p_c_fr: fertilizer.p_c_fr,
            p_cn_of: fertilizer.p_cn_of,
            p_n_rt: fertilizer.p_n_rt,
            p_n_if: fertilizer.p_n_if,
            p_n_of: fertilizer.p_n_of,
            p_n_wc: fertilizer.p_n_wc,
            p_p_rt: fertilizer.p_p_rt,
            p_k_rt: fertilizer.p_k_rt,
            p_mg_rt: fertilizer.p_mg_rt,
            p_ca_rt: fertilizer.p_ca_rt,
            p_ne: fertilizer.p_ne,
            p_s_rt: fertilizer.p_s_rt,
            p_s_wc: fertilizer.p_s_wc,
            p_cu_rt: fertilizer.p_cu_rt,
            p_zn_rt: fertilizer.p_zn_rt,
            p_na_rt: fertilizer.p_na_rt,
            p_si_rt: fertilizer.p_si_rt,
            p_b_rt: fertilizer.p_b_rt,
            p_mn_rt: fertilizer.p_mn_rt,
            p_ni_rt: fertilizer.p_ni_rt,
            p_fe_rt: fertilizer.p_fe_rt,
            p_mo_rt: fertilizer.p_mo_rt,
            p_co_rt: fertilizer.p_co_rt,
            p_as_rt: fertilizer.p_as_rt,
            p_cd_rt: fertilizer.p_cd_rt,
            p_cr_rt: fertilizer.p_cr_rt,
            p_cr_vi: fertilizer.p_cr_vi,
            p_pb_rt: fertilizer.p_pb_rt,
            p_hg_rt: fertilizer.p_hg_rt,
            p_cl_rt: fertilizer.p_cl_rt,
            p_app_method_options: fertilizer.p_app_method_options,
        },
    })

    useEffect(() => {
        form.reset({
            p_name_nl: fertilizer.p_name_nl,
            p_type: fertilizer.p_type,
            p_dm: fertilizer.p_dm,
            p_density: fertilizer.p_density,
            p_om: fertilizer.p_om,
            p_a: fertilizer.p_a,
            p_hc: fertilizer.p_hc,
            p_eom: fertilizer.p_eom,
            p_eoc: fertilizer.p_eoc,
            p_c_rt: fertilizer.p_c_rt,
            p_c_of: fertilizer.p_c_of,
            p_c_if: fertilizer.p_c_if,
            p_c_fr: fertilizer.p_c_fr,
            p_cn_of: fertilizer.p_cn_of,
            p_n_rt: fertilizer.p_n_rt,
            p_n_if: fertilizer.p_n_if,
            p_n_of: fertilizer.p_n_of,
            p_n_wc: fertilizer.p_n_wc,
            p_p_rt: fertilizer.p_p_rt,
            p_k_rt: fertilizer.p_k_rt,
            p_mg_rt: fertilizer.p_mg_rt,
            p_ca_rt: fertilizer.p_ca_rt,
            p_ne: fertilizer.p_ne,
            p_s_rt: fertilizer.p_s_rt,
            p_s_wc: fertilizer.p_s_wc,
            p_cu_rt: fertilizer.p_cu_rt,
            p_zn_rt: fertilizer.p_zn_rt,
            p_na_rt: fertilizer.p_na_rt,
            p_si_rt: fertilizer.p_si_rt,
            p_b_rt: fertilizer.p_b_rt,
            p_mn_rt: fertilizer.p_mn_rt,
            p_ni_rt: fertilizer.p_ni_rt,
            p_fe_rt: fertilizer.p_fe_rt,
            p_mo_rt: fertilizer.p_mo_rt,
            p_co_rt: fertilizer.p_co_rt,
            p_as_rt: fertilizer.p_as_rt,
            p_cd_rt: fertilizer.p_cd_rt,
            p_cr_rt: fertilizer.p_cr_rt,
            p_cr_vi: fertilizer.p_cr_vi,
            p_pb_rt: fertilizer.p_pb_rt,
            p_hg_rt: fertilizer.p_hg_rt,
            p_cl_rt: fertilizer.p_cl_rt,
            p_app_method_options: fertilizer.p_app_method_options,
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
            <main className="mx-auto max-w-4xl">
                <FarmTitle
                    title={"Meststof toevoegen"}
                    description={
                        "Voeg een meststof toe om deze te gebruiken op dit bedrijf."
                    }
                />
                <div className="space-y-6 p-10 pb-0">
                    <FertilizerForm
                        fertilizerParameters={fertilizerParameters}
                        form={form}
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

        const p_id_catalogue = await addFertilizerToCatalogue(
            fdm,
            session.principal_id,
            b_id_farm,
            {
                p_name_nl: formValues.p_name_nl,
                p_name_en: formValues.p_name_en,
                p_description: formValues.p_description,
                p_type: formValues.p_type,
                p_dm: formValues.p_dm,
                p_density: formValues.p_density,
                p_om: formValues.p_om,
                p_a: formValues.p_a,
                p_hc: formValues.p_hc,
                p_eom: formValues.p_eom,
                p_eoc: formValues.p_eoc,
                p_c_rt: formValues.p_c_rt,
                p_c_of: formValues.p_c_of,
                p_c_if: formValues.p_c_if,
                p_c_fr: formValues.p_c_fr,
                p_cn_of: formValues.p_cn_of,
                p_n_rt: formValues.p_n_rt,
                p_n_if: formValues.p_n_if,
                p_n_of: formValues.p_n_of,
                p_n_wc: formValues.p_n_wc,
                p_p_rt: formValues.p_p_rt,
                p_k_rt: formValues.p_k_rt,
                p_mg_rt: formValues.p_mg_rt,
                p_ca_rt: formValues.p_ca_rt,
                p_ne: formValues.p_ne,
                p_s_rt: formValues.p_s_rt,
                p_s_wc: formValues.p_s_wc,
                p_cu_rt: formValues.p_cu_rt,
                p_zn_rt: formValues.p_zn_rt,
                p_na_rt: formValues.p_na_rt,
                p_si_rt: formValues.p_si_rt,
                p_b_rt: formValues.p_b_rt,
                p_mn_rt: formValues.p_mn_rt,
                p_ni_rt: formValues.p_ni_rt,
                p_fe_rt: formValues.p_fe_rt,
                p_mo_rt: formValues.p_mo_rt,
                p_co_rt: formValues.p_co_rt,
                p_as_rt: formValues.p_as_rt,
                p_cd_rt: formValues.p_cd_rt,
                p_cr_rt: formValues.p_cr_rt,
                p_cr_vi: formValues.p_cr_vi,
                p_pb_rt: formValues.p_pb_rt,
                p_hg_rt: formValues.p_hg_rt,
                p_cl_rt: formValues.p_cl_rt,
                p_app_method_options: formValues.p_app_method_options,
            },
        )

        await addFertilizer(
            fdm,
            session.principal_id,
            p_id_catalogue,
            b_id_farm,
            undefined,
            undefined,
        )

        return redirectWithSuccess("../fertilizers", {
            message: "Meststof is toegevoegd! 🎉",
        })
    } catch (error) {
        throw handleActionError(error)
    }
}
