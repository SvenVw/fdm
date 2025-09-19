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
 * Renders the layout for adding a new fertilizer.
 *
 * This component includes the page header and a centered section containing another header and the new fertilizer wizard.
 *
 * @param action when specified it shows an action button in the page header
 * @param backlink path to navigate to when the user tries to go back to the fertilizer list
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
