import {
    addSoilAnalysis,
    getField,
    getSoilParametersDescription,
} from "@svenvw/fdm-core"
import { ArrowLeft } from "lucide-react"
import {
    type ActionFunctionArgs,
    type LoaderFunctionArgs,
    NavLink,
    data,
    useLoaderData,
} from "react-router"
import { dataWithError, redirectWithSuccess } from "remix-toast"
import { Button } from "~/components/ui/button"
import { Separator } from "~/components/ui/separator"
import { getSession } from "~/lib/auth.server"
import { handleActionError, handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { type FileUpload, parseFormData } from "@mjackson/form-data-parser"
import { LocalFileStorage } from "@mjackson/file-storage/local"
import { extractSoilAnalysis } from "~/integrations/nmi"
import { fileTypeFromBuffer } from "file-type"
import {
    FormSchema,
    SoilAnalysisUploadForm,
} from "../components/custom/soil/form-upload"

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
                    <NavLink to="../soil/analysis/new">
                        <ArrowLeft />
                        Terug
                    </NavLink>
                </Button>
            </div>
            <Separator />
            <SoilAnalysisUploadForm />
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

        const fileStorage = new LocalFileStorage("./uploads/soil_analyses")

        const uploadHandler = async (fileUpload: FileUpload) => {
            if (
                fileUpload.fieldName === "soilAnalysisFile" &&
                fileUpload.type === "application/pdf"
            ) {
                // Check file type based on magic bytes
                const fileBuffer = await fileUpload.arrayBuffer()
                const fileType = await fileTypeFromBuffer(fileBuffer)

                if (fileType?.mime !== "application/pdf") {
                    throw new Error("Invalid file type (magic bytes check)")
                }

                // We need to create a new File object from the buffer
                const file = new File([fileBuffer], fileUpload.name, {
                    type: fileUpload.type,
                })
                const storageKey = crypto.randomUUID()
                await fileStorage.set(storageKey, file)

                return fileStorage.get(storageKey)
            }
            throw new Error("Invalid file type (mime check)")
        }

        const formData = await parseFormData(request, uploadHandler)
        const file = formData.get("soilAnalysisFile") as File | undefined

        // Server-side validation using Zod schema
        const parsedFile = FormSchema.safeParse({ soilAnalysisFile: file })
        if (!parsedFile.success) {
            throw data(parsedFile.error.flatten(), { status: 400 })
        }

        if (!file) {
            throw data("No file uploaded", { status: 400 })
        }

        // Submit to NMI API
        const soilAnalysis = await extractSoilAnalysis(formData)

        // Add soil analysis
        const soilAnalysisId = await addSoilAnalysis(
            fdm,
            session.principal_id,
            null,
            "other",
            b_id,
            Number(soilAnalysis.a_depth_lower),
            new Date(soilAnalysis.b_sampling_date),
            soilAnalysis,
            Number(soilAnalysis.a_depth_upper),
        )

        return redirectWithSuccess(`../soil/analysis/${soilAnalysisId}`, {
            message: "Bodemanalyse is toegevoegd! 🎉",
        })
    } catch (error) {
        if (
            error instanceof Error &&
            (error.message === "Invalid file type (magic bytes check)" ||
                error.message === "Invalid file type (mime check)")
        ) {
            return dataWithError(
                null,
                "Het bestand is ongeldig. Controleer het bestand en probeer het opnieuw",
            )
        }

        if (
            error instanceof Error &&
            error.message === "Invalid soil analysis"
        ) {
            return dataWithError(
                null,
                "Helaas is het niet gelukt om de pdf te analyseren. Controleer het bestand of neem contact op met Ondersteuning",
            )
        }

        throw handleActionError(error)
    }
}
