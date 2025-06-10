import {
    getField,
    getSoilParametersDescription,
} from "@svenvw/fdm-core"
import { ArrowLeft } from "lucide-react"
import {
    type LoaderFunctionArgs,
    NavLink,
    data,
    useLoaderData,
} from "react-router"
import { Button } from "~/components/ui/button"
import { Separator } from "~/components/ui/separator"
import { getSession } from "~/lib/auth.server"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { SoilAnalysisFormSelection } from "~/components/blocks/soil/form-selection"

/**
 * Loader function for the soil data page of a specific farm field.
 *
 * This function fetches the necessary data for rendering the soil data page, including
 * field details, soil analyses, current soil data, and soil parameter descriptions.
 * It validates the presence of the farm ID (`b_id_farm`) and field ID (`b_id`) in the
 * route parameters and retrieves the user session.
 *
 * @param request - The HTTP request object.
 * @param params - The route parameters, including `b_id_farm` and `b_id`.
 * @returns An object containing the field details, current soil data, soil parameter descriptions, and soil analyses.
 *
 * @throws {Response} If the farm ID is missing (HTTP 400).
 * @throws {Error} If the field ID is missing (HTTP 400).
 * @throws {Error} If the field is not found (HTTP 404).
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        // Get the farm id
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw data("Farm ID is required", {
                status: 400,
                statusText: "Farm ID is required",
            })
        }

        // Get the field id
        const b_id = params.b_id
        if (!b_id) {
            throw data("Field ID is required", {
                status: 400,
                statusText: "Field ID is required",
            })
        }

        // Get the session
        const session = await getSession(request)

        // Get details of field
        const field = await getField(fdm, session.principal_id, b_id)
        if (!field) {
            throw data("Field is not found", {
                status: 404,
                statusText: "Field is not found",
            })
        }

        // Get soil parameter descriptions
        const soilParameterDescription = getSoilParametersDescription()

        // Return user information from loader
        return {
            field: field,
            soilParameterDescription: soilParameterDescription,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

/**
 * Component that renders the soil analysis creation form for a specific field.
 *
 * This component displays a page header with description, a back button,
 * and the SoilAnalysisForm component for adding a new soil analysis.
 * It uses data loaded by the loader function to provide soil parameter descriptions.
 */
export default function FarmFieldSoilOverviewBlock() {
    const loaderData = useLoaderData<typeof loader>()

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-medium">Bodem</h3>
                    <p className="text-sm text-muted-foreground">
                        Kies het type bodemanalyse voor uw formulier
                    </p>
                </div>
                <Button asChild>
                    <NavLink to="../soil">
                        <ArrowLeft />
                        Terug
                    </NavLink>
                </Button>
            </div>
            <Separator />
            <SoilAnalysisFormSelection />
        </div>
    )
}
