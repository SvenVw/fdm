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
import { redirectWithSuccess } from "remix-toast"
import { Button } from "~/components/ui/button"
import { Separator } from "~/components/ui/separator"
import { getSession } from "~/lib/auth.server"
import { handleActionError, handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { Form } from "react-router"
import { RemixFormProvider, useRemixForm } from "remix-hook-form"
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { z } from "zod"
import { Input } from "../components/ui/input"
import { FileUpload, parseFormData } from "@mjackson/form-data-parser"
import { LocalFileStorage } from "@mjackson/file-storage/local"
import { extractSoilAnalysis} from "~/integrations/nmi"

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

    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
        defaultValues: {},
    })

    useEffect(() => {
        if (form.formState.isSubmitSuccessful) {
            form.reset()
        }
    }, [form.formState, form.reset])

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-medium">Upload bodemanalyse</h3>
                    <p className="text-sm text-muted-foreground">
                        Upload een bodemanalyse en check de gegevens
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
            <RemixFormProvider {...form}>
                <Form
                    id="soilAnalysisUploadForm"
                    onSubmit={form.handleSubmit}
                    method="post"
                    encType="multipart/form-data"
                >
                    <fieldset disabled={form.formState.isSubmitting}>
                        <div className="space-y-6">
                            <p className="text-sm text-muted-foreground">
                                Vul de gegevens van de bodemanalyse in.
                            </p>
                            <div className="grid md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="soilAnalysisFile"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>file</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        {...field}
                                                        type="file"
                                                        placeholder=""
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormDescription>
                                                hoi
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="flex justify-end mt-4">
                                <Button type="submit">
                                    {form.formState.isSubmitting ? (
                                        <div className="flex items-center space-x-2">
                                            {/* <LoadingSpinner /> */}
                                            <span>Opslaan...</span>
                                        </div>
                                    ) : (
                                        "Opslaan"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </fieldset>
                </Form>
            </RemixFormProvider>
        </div>
    )
}

const FormSchema = z.object({
    soilAnalysisFile: z.instanceof(FileUpload),
})

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

        const uploadHandler = async (fileUpload: FileUpload) => {
            if (
                fileUpload.fieldName === "soilAnalysisFile" &&
                fileUpload.type === "application/pdf"
            ) {
                // process the upload and return a File
                console.log("processing the file...")

                const storageKey = crypto.randomUUID()
                await fileStorage.set(storageKey, fileUpload)

                // // Check the magic bytes of file
                // const file = await fileStorage.get(storageKey)
                // const fileType = filetype(file)
                // console.log(fileType)

                return fileStorage.get(storageKey)
            }
        }

        const formData = await parseFormData(request, uploadHandler)
        const file = formData.get("soilAnalysisFile")

        // Submit to NMI API
        const soilAnalysis = await extractSoilAnalysis(formData)

        // Add soil analysis
        const soilAnalysisId = await addSoilAnalysis(
            fdm,
            session.principal_id,
            null,
            'other',
            b_id,
            soilAnalysis.a_depth_lower,
            soilAnalysis.b_sampling_date,
            soilAnalysis,
            soilAnalysis.a_depth_upper
        )

        return redirectWithSuccess(`../soil/analysis/${soilAnalysisId}`, {
            message: "Bodemanalyse is toegevoegd! 🎉",
        })
    } catch (error) {
        throw handleActionError(error)
    }
}

export const fileStorage = new LocalFileStorage("./uploads/soil_analyses")
