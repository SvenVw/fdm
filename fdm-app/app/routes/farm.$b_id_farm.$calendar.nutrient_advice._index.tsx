import { getFields } from "@svenvw/fdm-core"
import {
    type LoaderFunctionArgs,
    type MetaFunction,
    NavLink,
    redirect,
    useLoaderData,
} from "react-router"
import { getSession } from "~/lib/auth.server"
import { getCalendar, getTimeframe } from "~/lib/calendar"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "../components/ui/empty"
import { BookOpenText, Calendar, Icon, Square } from "lucide-react"
import { Button } from "../components/ui/button"

// Meta
export const meta: MetaFunction = () => {
    return [
        {
            title: `Bemestingsadvies | ${clientConfig.name}`,
        },
        {
            name: "description",
            content: "Bekijk je Bemestingsadvies",
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
        // Redirect to first field
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw new Error("b_id_farm is required")
        }

        // Get the session
        const session = await getSession(request)

        // Get timeframe from calendar store
        const timeframe = getTimeframe(params)
        const calendar = getCalendar(params)

        // Get the fields of the farm
        const fields = await getFields(
            fdm,
            session.principal_id,
            b_id_farm,
            timeframe,
        )
        if (fields.length > 0) {
            return redirect(`./${fields[0].b_id}`)
        }

        return {
            b_id_farm: b_id_farm,
            calendar: calendar,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

export default function FieldNutrientAdviceBlock() {
    const loaderData = useLoaderData<typeof loader>()
    const { b_id_farm, calendar } = loaderData
    return (
        <Empty>
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <BookOpenText />
                </EmptyMedia>
                <EmptyTitle>Geen percelen gevonden</EmptyTitle>
                <EmptyDescription>
                    Het lijkt erop dat er nog geen percelen zijn geregistreerd
                    voor dit bedrijf. Voeg een nieuw perceel toe om
                    bemestingsadvies te kunnen bekijken.
                </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
                <div className="flex gap-2">
                    <Button variant="default" asChild>
                        <NavLink to={`/farm/${b_id_farm}/${calendar}/field/new`}>
                            Nieuw perceel
                        </NavLink>
                    </Button>
                    <Button variant="outline" asChild>
                        <NavLink to="../">Naar bedrijfsoverzicht</NavLink>
                    </Button>
                </div>
            </EmptyContent>
        </Empty>
    )
}
