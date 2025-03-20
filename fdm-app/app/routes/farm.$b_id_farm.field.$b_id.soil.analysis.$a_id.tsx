import { SoilAnalysisForm } from "@/components/custom/soil/form"
import { generateFormSchema } from "@/components/custom/soil/formschema"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { getSession } from "@/lib/auth.server"
import { handleLoaderError } from "@/lib/error"
import { fdm } from "@/lib/fdm.server"
import {
    getField,
    getSoilAnalysis,
    getSoilParametersDescription,
} from "@svenvw/fdm-core"
import { ArrowLeft } from "lucide-react"
import {
    type LoaderFunctionArgs,
    NavLink,
    data,
    useFetcher,
    useLoaderData,
} from "react-router"

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

        // Get the analysis id
        const a_id = params.a_id
        if (!a_id) {
            throw data("Analysis ID is required", {
                status: 400,
                statusText: "Analysis ID is required",
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

        // Get the soil analyses
        const soilAnalysis = await getSoilAnalysis(
            fdm,
            session.principal_id,
            a_id,
        )

        // Get soil parameter descriptions
        const soilParameterDescription = getSoilParametersDescription()

        // Get the FormSchema
        const FormSchema = generateFormSchema(soilParameterDescription)

        // Return user information from loader
        return {
            field: field,
            soilParameterDescription: soilParameterDescription,
            soilAnalysis: soilAnalysis,
            FormSchema: FormSchema,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

/**
 * Component that renders the soil data overview for a farm field..
 *
 * This component displays the soil data section, including a title, description, and
 * a list of soil data cards. It also handles the case where no soil analyses are available.
 *
 */
export default function FarmFieldSoilOverviewBlock() {
    const loaderData = useLoaderData<typeof loader>()
    const fetcher = useFetcher()

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-medium">Bodem</h3>
                    <p className="text-sm text-muted-foreground">
                        Bekijk en bewerk de gegevens van deze bodemanalyse
                    </p>
                </div>
                <Button asChild>
                    <NavLink to="../">
                        <ArrowLeft />
                        Terug
                    </NavLink>
                </Button>
            </div>
            <Separator />
            <SoilAnalysisForm
                soilAnalysis={loaderData.soilAnalysis}
                soilParameterDescription={loaderData.soilParameterDescription}
                FormSchema={loaderData.FormSchema}
                action=""
                fetcher={fetcher}
            />
        </div>
    )
}
