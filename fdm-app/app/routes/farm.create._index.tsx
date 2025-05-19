import {
    PrincipalId,
    addFarm,
    addFertilizer,
    enableCultivationCatalogue,
    enableFertilizerCatalogue,
    getFertilizersFromCatalogue,
} from "@svenvw/fdm-core"
import type {
    ActionFunctionArgs,
    LoaderFunctionArgs,
    MetaFunction,
} from "react-router"
import { useLoaderData } from "react-router"
import { redirectWithSuccess } from "remix-toast"
import { z } from "zod"
import { Farm } from "~/components/blocks/farm"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "~/components/ui/breadcrumb"
import { Separator } from "~/components/ui/separator"
import { SidebarInset, SidebarTrigger } from "~/components/ui/sidebar"
import { getSession } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { handleActionError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { extractFormValuesFromRequest } from "~/lib/form"
import { HeaderFarmCreate } from "../components/custom/header/create-farm"
import { Header } from "../components/custom/header/base"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: `Bedrijf toevoegen | ${clientConfig.name}` },
        {
            name: "description",
            content: "Voeg een nieuw bedrijf toe.",
        },
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
            <Header action={undefined}>
                <HeaderFarmCreate b_name_farm={undefined} />
            </Header>
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
 * Handles the submission of the add farm form by creating a new farm and attaching default fertilizers.
 *
 * This function retrieves the user session from the request, extracts and validates form data using a predefined schema,
 * and creates a new farm with the provided name. It then fetches available fertilizers from a catalogue and associates them
 * with the newly created farm. On success, it returns a redirect response to the farm's atlas page with a confirmation message.
 *
 * @param request - The incoming request containing form data and session details.
 * @returns A redirect response to the newly created farm's atlas page.
 * @throws {Error} Throws an error if the form processing, farm creation, or fertilizer attachment fails.
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
        await enableFertilizerCatalogue(
            fdm,
            session.principal_id,
            b_id_farm,
            "srm",
        )
        // Enable catalogue with custom user fertilizers
        await enableFertilizerCatalogue(
            fdm,
            session.principal_id,
            b_id_farm,
            b_id_farm,
        )
        await enableCultivationCatalogue(
            fdm,
            session.principal_id,
            b_id_farm,
            "brp",
        )
        const fertilizers = await getFertilizersFromCatalogue(
            fdm,
            session.principal_id,
            b_id_farm,
        )
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

        // Get current year
        const year = new Date().getFullYear()

        return redirectWithSuccess(`./${b_id_farm}/${year}/atlas`, {
            message: "Bedrijf is toegevoegd! 🎉",
        })
    } catch (error) {
        throw handleActionError(error)
    }
}
