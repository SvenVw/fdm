import { getCultivationPlan, getFarm } from "@svenvw/fdm-core"
import {
    data,
    type LoaderFunctionArgs,
    type MetaFunction,
    Outlet,
    useLoaderData,
} from "react-router"
import { CultivationListPlan } from "~/components/blocks/cultivation/list-plan"
import { FarmTitle } from "~/components/blocks/farm/farm-title"
import { Header } from "~/components/blocks/header/base"
import { HeaderFarmCreate } from "~/components/blocks/header/create-farm"
import { getSession } from "~/lib/auth.server"
import { getCalendar, getTimeframe } from "~/lib/calendar"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import type { Route } from "../+types/root"
import { useFarmFieldOptionsStore } from "~/store/farm-field-options"
import { InlineErrorBoundary } from "~/components/custom/inline-error-boundary"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: `Bemesting - Bedrijf toevoegen | ${clientConfig.name}` },
        {
            name: "description",
            content: "Beheer de bemesting op je percelen.",
        },
    ]
}

export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw data("Farm ID is required", {
                status: 400,
                statusText: "Farm ID is required",
            })
        }

        const session = await getSession(request)
        const calendar = getCalendar(params)
        const timeframe = getTimeframe(params)

        const farm = await getFarm(fdm, session.principal_id, b_id_farm).catch(
            (error) => {
                throw data(`Failed to fetch farm: ${error.message}`, {
                    status: 404,
                    statusText: "Farm not found",
                })
            },
        )

        if (!farm) {
            throw data("Farm not found", {
                status: 404,
                statusText: "Farm not found",
            })
        }

        const cultivationPlan = await getCultivationPlan(
            fdm,
            session.principal_id,
            b_id_farm,
            timeframe,
        )

        return {
            cultivationPlan: cultivationPlan,
            b_id_farm: b_id_farm,
            b_name_farm: farm.b_name_farm,
            calendar: calendar,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

// Main
export default function Index() {
    const loaderData = useLoaderData<typeof loader>()

    return (
        <>
            <Header action={undefined}>
                <HeaderFarmCreate b_name_farm={loaderData.b_name_farm} />
            </Header>
            <main>
                <FarmTitle
                    title={"Bemesting in bouwplan"}
                    description={
                        "Werk de bemesting per gewas in je bouwplan bij."
                    }
                    action={{
                        to: `/farm/create/${loaderData.b_id_farm}/${loaderData.calendar}/access`,
                        label: "Doorgaan",
                    }}
                />
                <div className="space-y-6 px-8">
                    <div className="grid xl:grid-cols-3 lg:grid-cols-2 md:grid-cols-2 sm:grid-cols-1 gap-6">
                        <CultivationListPlan
                            cultivationPlan={loaderData.cultivationPlan}
                            b_id_farm={loaderData.b_id_farm}
                            calendar={loaderData.calendar}
                            basePath="fertilizers"
                        />
                        <div className="xl:col-span-2">
                            <Outlet />
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}

export function ErrorBoundary(props: Route.ErrorBoundaryProps) {
    const { params } = props
    const farmFieldOptionsStore = useFarmFieldOptionsStore()
    const cachedFarmName = farmFieldOptionsStore.getFarmById(
        params.b_id_farm,
    )?.b_name_farm

    return (
        <>
            <Header action={undefined}>
                <HeaderFarmCreate b_name_farm={cachedFarmName} />
            </Header>
            <main>
                <FarmTitle
                    title={"Bemesting in bouwplan"}
                    description={
                        "Werk de bemesting per gewas in je bouwplan bij."
                    }
                    action={{
                        to: `/farm/create/${params.b_id_farm}/${params.calendar}/access`,
                        label: "Doorgaan",
                    }}
                />
                <InlineErrorBoundary {...props} />
            </main>
        </>
    )
}
