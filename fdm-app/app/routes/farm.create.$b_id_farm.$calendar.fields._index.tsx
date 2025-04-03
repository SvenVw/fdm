import { getSession } from "~/lib/auth.server"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { useCalendarStore } from "@/store/calendar"
import { getTimeframe } from "@/lib/calendar"
import { getFields } from "@svenvw/fdm-core"
import {
    type LoaderFunctionArgs,
    type MetaFunction,
    redirect,
} from "react-router"
import { clientConfig } from "~/lib/config"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: `Percelen beheren - Bedrijf toevoegen | ${clientConfig.name}` },
        {
            name: "description",
            content:
                "Beheer de percelen van je bedrijf. Pas namen aan en bekijk perceelsinformatie.",
        },
    ]
}

/**
 * Loads the user's session and associated fields for a specified farm, redirecting to the route of the first field.
 *
 * The function validates the presence of the "b_id_farm" parameter, retrieves the user session,
 * and fetches the fields linked to the given farm identifier. If fields are found, it redirects to
 * the route corresponding to the first field. If the farm identifier is missing or no fields are found,
 * an error is thrown.
 *
 * @throws {Error} If the "b_id_farm" parameter is missing.
 * @throws {Error} If no fields are found for the specified farm.
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        // Redirect to first cultivation
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw new Error("b_id_farm is required")
        }

        // Get the session
        const session = await getSession(request)

        // Get timeframe from calendar store
        const timeframe = getTimeframe(params)

        const fields = await getFields(
            fdm,
            session.principal_id,
            b_id_farm,
            timeframe,
        )
        if (!fields.length) {
            throw new Error("No fields found for this farm")
        }
        return redirect(`./${fields[0].b_id}`)
    } catch (error) {
        throw handleLoaderError(error)
    }
}
