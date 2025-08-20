import type { Route } from "../+types/root"
import { Header } from "~/components/blocks/header/base"
import { HeaderFarm } from "~/components/blocks/header/farm"
import { HeaderFertilizer } from "~/components/blocks/header/fertilizer"
import { InlineErrorBoundary } from "~/components/custom/inline-error-boundary"
import { useFarmFieldOptionsStore } from "~/store/farm-field-options"

export function ErrorBoundary(props: Route.ErrorBoundaryProps) {
    const { params } = props

    const farmFieldOptionsStore = useFarmFieldOptionsStore()

    return (
        <>
            <Header action={undefined}>
                <HeaderFarm
                    b_id_farm={params.b_id_farm}
                    farmOptions={farmFieldOptionsStore.farmOptions}
                />
                <HeaderFertilizer
                    b_id_farm={params.b_id_farm}
                    p_id={undefined}
                    fertilizerOptions={undefined}
                />
            </Header>
            <main>
                <InlineErrorBoundary {...props} />
            </main>
        </>
    )
}
