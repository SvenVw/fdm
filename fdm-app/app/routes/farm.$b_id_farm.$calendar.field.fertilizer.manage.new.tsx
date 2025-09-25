import { getFarm, getFarms } from "@svenvw/fdm-core"
import {
    data,
    type LoaderFunctionArgs,
    type MetaFunction,
    Outlet,
    useLoaderData,
    useSearchParams,
} from "react-router"
import { FarmTitle } from "~/components/blocks/farm/farm-title"
import { Header } from "~/components/blocks/header/base"
import { HeaderFarm } from "~/components/blocks/header/farm"
import { BreadcrumbLink, BreadcrumbSeparator } from "~/components/ui/breadcrumb"
import { SidebarInset } from "~/components/ui/sidebar"
import { getSession } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import type { Route } from "./+types/farm.$b_id_farm.$calendar.field.$b_id.fertilizer.manage.new"

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

        // Get the field ids
        const searchParams = new URL(request.url).searchParams
        if (!searchParams.has("fieldIds")) {
            throw data("missing: fieldIds", {
                status: 400,
                statusText: "missing: fieldIds",
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

        // Return user information from loader
        return {
            b_id_farm: b_id_farm,
            farmOptions: farmOptions,
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
export default function FarmFertilizerBlock({ params }: Route.ComponentProps) {
    const loaderData = useLoaderData<typeof loader>()
    const [urlSearchParams] = useSearchParams()

    return (
        <SidebarInset>
            <Header
                action={{
                    label: "Terug naar bemesting toevoegen",
                    to: `/farm/${params.b_id_farm}/${params.calendar}/field/fertilizer?fieldIds=${urlSearchParams.get("fieldIds")}`,
                    disabled: false,
                }}
            >
                <HeaderFarm
                    b_id_farm={loaderData.b_id_farm}
                    farmOptions={loaderData.farmOptions}
                />
                <BreadcrumbSeparator />
                Percelen
                <BreadcrumbSeparator />
                <BreadcrumbLink
                    href={`/farm/${params.b_id_farm}/${params.calendar}/field/fertilizer?fieldIds=${urlSearchParams.get("fieldIds")}`}
                >
                    Bemesting toevoegen
                </BreadcrumbLink>
                <BreadcrumbSeparator />
                <BreadcrumbLink
                    href={`/farm/${params.b_id_farm}/${params.calendar}/field/fertilizer/manage/new?fieldIds=${urlSearchParams.get("fieldIds")}`}
                >
                    Nieuwe meststof
                </BreadcrumbLink>
            </Header>
            <main className="mx-auto max-w-4xl">
                <FarmTitle
                    title={"Meststof toevoegen"}
                    description={
                        "Voeg een meststof toe om deze te gebruiken op dit bedrijf."
                    }
                />
                <div className="space-y-6 p-10 pb-0">
                    <Outlet />
                </div>
            </main>
        </SidebarInset>
    )
}
