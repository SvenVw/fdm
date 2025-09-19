import { FarmTitle } from "~/components/blocks/farm/farm-title"
import type { Fertilizer } from "~/components/blocks/fertilizer/columns"
import { columns } from "~/components/blocks/fertilizer/columns"
import { DataTable } from "~/components/blocks/fertilizer/table"
import { Header } from "~/components/blocks/header/base"
import { HeaderFarm } from "~/components/blocks/header/farm"
import { HeaderFertilizer } from "~/components/blocks/header/fertilizer"
import { SidebarInset } from "~/components/ui/sidebar"
import { HeaderActionProps } from "../header/action"

interface FertilizersIndexLoaderData {
    b_id_farm: string
    farmOptions: {
        b_id_farm: string
        b_name_farm: string | undefined | null
    }[]
    fertilizers: Fertilizer[]
}

/**
 * Renders the layout for managing farm settings.
 *
 * This component displays a sidebar that includes the farm header, navigation options, and a link to farm fields.
 * It also renders a main section containing the farm title, description, nested routes via an Outlet, and a notification toaster.
 */
export function FarmFertilizersIndexBlock({
    loaderData,
    action,
}: {
    loaderData: FertilizersIndexLoaderData
    action?: HeaderActionProps
}) {
    return (
        <SidebarInset>
            <Header action={action}>
                <HeaderFarm
                    b_id_farm={loaderData.b_id_farm}
                    farmOptions={loaderData.farmOptions}
                />
                <HeaderFertilizer
                    b_id_farm={loaderData.b_id_farm}
                    p_id={undefined}
                    fertilizerOptions={loaderData.fertilizers}
                />
            </Header>
            <main>
                <FarmTitle
                    title={"Meststoffen"}
                    description={"Beheer de meststoffen van dit bedrijf"}
                />
                <div className="space-y-6 p-10 pb-0">
                    <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                        <div className="flex-1">
                            <DataTable
                                columns={columns}
                                data={loaderData.fertilizers}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </SidebarInset>
    )
}
