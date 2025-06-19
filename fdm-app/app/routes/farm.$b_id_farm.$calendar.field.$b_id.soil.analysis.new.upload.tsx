import {
    addSoilAnalysis,
    getField,
    getSoilParametersDescription,
} from "@svenvw/fdm-core"
import {
    type ActionFunctionArgs,
    type LoaderFunctionArgs,
    data,
} from "react-router"
import { dataWithError, redirectWithSuccess } from "remix-toast"
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
} from "~/components/custom/soil/form-upload"

/**
 * Loader function for the soil analysis upload page.
 *
 * Fetches the field details and soil parameter descriptions.
 *
 * @param request - The HTTP request object.
 * @param params - The route parameters containing `b_id_farm` and `b_id`.
 * @returns An object containing the field details and soil parameter descriptions.
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
 * Renders the soil analysis upload form.
 *
 * @returns The JSX element for the soil analysis upload form.
 */
export default function FarmFieldSoilAnalysisUploadBlock() {
    return (
        <div className="space-y-6">
            <SoilAnalysisUploadForm />
        </div>
    )
}

/**
 * Action function for uploading a soil analysis file.
 *
 * @param request - The HTTP request object.
 * @param params - The route parameters containing `b_id_farm` and `b_id`.
 * @returns A redirect response to the soil analysis page.
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

        // Validate required fields exist
        if (!soilAnalysis.a_depth_lower) {
            throw new Error("Missing required a_depth_lower value")
        }
        if (!soilAnalysis.b_sampling_date) {
            throw new Error("Missing required b_sampling_date")
        }
        if (!soilAnalysis.a_depth_upper) {
            throw new Error("Missing required a_depth_upper value")
        }

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
