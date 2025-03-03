import {
    addFarm,
    addFertilizer,
    getFertilizersFromCatalogue,
} from "@svenvw/fdm-core"
import type {
    ActionFunctionArgs,
    LoaderFunctionArgs,
    MetaFunction,
} from "react-router"
import { useLoaderData } from "react-router"
import { z } from "zod"

// Components
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"

// Blocks
import { Farm } from "@/components/blocks/farm"

import { extractFormValuesFromRequest } from "@/lib/form"
import { dataWithError, redirectWithSuccess } from "remix-toast"
// Services
import { fdm } from "../lib/fdm.server"
import { getSession } from "@/lib/auth.server"
import { handleActionError } from "@/lib/error"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: "FDM App" },
        { name: "description", content: "Welcome to FDM!" },
    ]
}

const FormSchema = z.object({
    b_name_farm: z
        .string({
            required_error: "Naam van bedrijf is verplicht",
        })
        .min(3, {
            message: "Naam van bedrijf moet minimaal 3 karakters bevatten",
        }),
})

// Loader
export async function loader({ request }: LoaderFunctionArgs) {
    return {
        b_name_farm: null,
    }
}

/**
 * Default component for the Add Farm page.
 * Renders the farm form and passes the validation schema to the Farm component.
 * @returns The JSX element representing the add farm page.
 */
export default function AddFarmPage() {
    const loaderData = useLoaderData<typeof loader>()
    return (
        <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink>Maak een bedrijf</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden md:block" />
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink>Bedrijfsgegevens</BreadcrumbLink>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>
            <main>
                <Farm
                    b_name_farm={loaderData.b_name_farm}
                    action={"/farm/create"}
                    FormSchema={FormSchema}
                />
            </main>
        </SidebarInset>
    )
}

/**
 * Action function for handling the submission of the add farm form.
 * Processes and validates form data to create a new farm.
 * @param request - The incoming request object containing form data.
 * @returns A redirect response to the newly created farm's page.
 */
export async function action({ request }: ActionFunctionArgs) {
    try {
        // Get the session
        const session = await getSession(request)

        const formValues = await extractFormValuesFromRequest(
            request,
            FormSchema,
        )
        const { b_name_farm } = formValues

        const b_id_farm = await addFarm(
            fdm,
            session.principal_id,
            b_name_farm,
            null,
            null,
            null,
        )
        const fertilizers = await getFertilizersFromCatalogue(fdm)
        await Promise.all(
            fertilizers.map((fertilizer) =>
                addFertilizer(
                    fdm,
                    session.principal_id,
                    fertilizer.p_id_catalogue,
                    b_id_farm,
                    null,
                    null,
                ),
            ),
        )
        return redirectWithSuccess(`./${b_id_farm}/atlas`, {
            message: "Bedrijf is toegevoegd! 🎉",
        })
    } catch (error) {
        return handleActionError(error)
    }
}
