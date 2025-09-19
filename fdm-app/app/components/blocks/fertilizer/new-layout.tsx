import type { ReactNode } from "react"
import { FarmTitle } from "~/components/blocks/farm/farm-title"
import { Header } from "~/components/blocks/header/base"
import { HeaderFarm } from "~/components/blocks/header/farm"
import { HeaderFertilizer } from "~/components/blocks/header/fertilizer"
import { SidebarInset } from "~/components/ui/sidebar"
import type { HeaderActionProps } from "../header/action"

interface FarmNewFertilizerLayoutLoaderData {
    b_id_farm: string
    farmOptions: { b_id_farm: string; b_name_farm: string }[]
}

/**
 * Renders the layout for managing farm settings.
 *
 * This component displays a sidebar that includes the farm header, navigation options, and a link to farm fields.
 * It also renders a main section containing the farm title, description, nested routes via an Outlet, and a notification toaster.
 */
export function FarmNewFertilizerLayout({
    loaderData,
    children,
    action,
    backlink,
}: {
    loaderData: FarmNewFertilizerLayoutLoaderData
    children: ReactNode
    action?: HeaderActionProps
    backlink: string
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
                    fertilizerOptions={[]}
                />
            </Header>
            <main className="mx-auto max-w-4xl">
                <FarmTitle
                    title={"Meststof toevoegen"}
                    description={
                        "Voeg een meststof toe om deze te gebruiken op dit bedrijf."
                    }
                    action={{
                        to: backlink,
                        label: "Terug naar overzicht",
                    }}
                />
                <div className="space-y-6 p-10 pb-0">{children}</div>
            </main>
        </SidebarInset>
    )
}
