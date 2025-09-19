import { zodResolver } from "@hookform/resolvers/zod"
import type { Fertilizer } from "@svenvw/fdm-core"
import { useRemixForm } from "remix-hook-form"
import type { z } from "zod"
import {
    FertilizerForm,
    type FertilizerParameterDescription,
} from "@/app/components/blocks/fertilizer/form"
import { FarmTitle } from "~/components/blocks/farm/farm-title"
import { FormSchema } from "~/components/blocks/fertilizer/formschema"
import { Header } from "~/components/blocks/header/base"
import { HeaderFarm } from "~/components/blocks/header/farm"
import { HeaderFertilizer } from "~/components/blocks/header/fertilizer"
import { SidebarInset } from "~/components/ui/sidebar"

interface FarmFertilizerLoaderData {
    p_id: string
    b_id_farm: string
    farmOptions: {
        b_id_farm: string
        b_name_farm: string | null
    }[]
    fertilizerOptions: {
        p_id: string
        p_name_nl: string
    }[]
    fertilizer: Fertilizer
    editable: boolean
    fertilizerParameters: FertilizerParameterDescription
}

/**
 * Renders the layout for managing farm settings.
 *
 * This component displays a sidebar that includes the farm header, navigation options, and a link to farm fields.
 * It also renders a main section containing the farm title, description, nested routes via an Outlet, and a notification toaster.
 */
export function FarmFertilizerBlock({
    loaderData,
    backlink,
}: {
    loaderData: FarmFertilizerLoaderData
    backlink: string
}) {
    const { fertilizer, fertilizerParameters, editable } = loaderData

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
            p_no3_rt: fertilizer.p_no3_rt,
            p_nh4_rt: fertilizer.p_nh4_rt,
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
            p_app_method_options: fertilizer.p_app_method_options || [],
        },
    })

    return (
        <SidebarInset>
            <Header
                action={{
                    to: backlink,
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
                    p_id={loaderData.p_id}
                    fertilizerOptions={loaderData.fertilizerOptions}
                />
            </Header>
            <main>
                <FarmTitle
                    title={loaderData.fertilizer.p_name_nl}
                    description={"Bekijk de eigenschappen van dit product"}
                />
                <div className="space-y-6 p-10 pb-0">
                    <FertilizerForm
                        fertilizerParameters={fertilizerParameters}
                        form={form}
                        editable={editable}
                    />
                </div>
            </main>
        </SidebarInset>
    )
}
