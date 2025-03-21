import { FormSchema } from "@/components/custom/soil/formschema"
import { SoilAnalysisForm } from "@/components/custom/soil/form"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { getSession } from "@/lib/auth.server"
import { handleActionError, handleLoaderError } from "@/lib/error"
import { fdm } from "@/lib/fdm.server"
import { extractFormValuesFromRequest } from "@/lib/form"
import {
    addSoilAnalysis,
    getField,
    getSoilAnalysis,
    getSoilParametersDescription,
    updateSoilAnalysis,
} from "@svenvw/fdm-core"
import { ArrowLeft } from "lucide-react"
import {
    type ActionFunctionArgs,
    type LoaderFunctionArgs,
    NavLink,
    data,
    useFetcher,
    useLoaderData,
} from "react-router"
import { redirectWithSuccess } from "remix-toast"

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
 * Component that renders the soil analysis form.
 *
 * This component displays the soil analysis form
 *
 */
export default function FarmFieldSoilOverviewBlock() {
    const loaderData = useLoaderData<typeof loader>()

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-medium">Bodem</h3>
                    <p className="text-sm text-muted-foreground">
                        Voeg een nieuwe bodemanalyse toe
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
            <SoilAnalysisForm
                soilAnalysis={undefined}
                soilParameterDescription={loaderData.soilParameterDescription}
                action="."
            />
        </div>
    )
}

/**
 * Action function to update the soil analysis.
 *
 * This function updates a soil analysis based on the provided form data.
 * It validates the data, retrieves the necessary IDs from the route parameters,
 * and uses the `updateSoilAnalysis` function from `@svenvw/fdm-core` to perform the update.
 *
 * @param request - The HTTP request object.
 * @param params - The route parameters, including `a_id`, `b_id`, and `b_id_farm`.
 * @returns A redirect response after successful update.
 * @throws {Response} If any ID is missing (HTTP 400).
 * @throws {Response} If there is an error during the update (HTTP 500).
 */
export async function action({ request, params }: ActionFunctionArgs) {
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

    try {
        // Get the session
        const session = await getSession(request)

        // Get from values
        const formValues = await extractFormValuesFromRequest(
            request,
            FormSchema,
        )

        // add soil analysis
        await addSoilAnalysis(
            fdm,
            session.principal_id,
            undefined,
            formValues.a_source,
            b_id,
            undefined,
            formValues.b_sampling_date,
            formValues,
        )

        return redirectWithSuccess("../soil", {
            message: "Bodemanalyse is toegevoegd! 🎉",
        })
    } catch (error) {
        throw handleActionError(error)
    }
}
