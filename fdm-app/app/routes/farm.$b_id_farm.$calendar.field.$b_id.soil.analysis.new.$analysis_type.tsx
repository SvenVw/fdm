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
import { SoilAnalysisForm } from "~/components/blocks/soil/form"
import { FormSchema } from "~/components/blocks/soil/formschema"
import { Button } from "~/components/ui/button"
import { Separator } from "~/components/ui/separator"
import { getSession } from "~/lib/auth.server"
import { handleActionError, handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { extractFormValuesFromRequest } from "~/lib/form"

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

        // Get the soil analysis type
        const soilAnalysisType = params.analysis_type
        let soilParameters = []
        if (soilAnalysisType === "standard") {
            soilParameters = [
                "a_source",
                "b_sampling_date",
                "a_depth_lower",
                "a_n_rt",
                "a_s_rt",
                "a_p_cc",
                "a_p_al",
                "a_p_wa",
                "a_k_cc",
                "a_k_co",
                "a_ca_co",
                "a_mg_cc",
                "a_mg_co",
                "a_zn_cc",
                "a_cu_cc",
                "a_ph_cc",
                "a_c_of",
                "a_som_loi",
                "a_caco3_if",
                "a_clay_mi",
                "a_silt_mi",
                "a_sand_mi",
                "a_cec_co",
                "a_n_pmn",
                "a_density_sa",
                "b_soiltype_agr",
            ]
        } else if (soilAnalysisType === "all") {
            soilParameters = [
                "a_al_ox",
                "a_c_of",
                "a_ca_co",
                "a_ca_co_po",
                "a_caco3_if",
                "a_cec_co",
                "a_clay_mi",
                "a_cn_fr",
                "a_com_fr",
                "a_cu_cc",
                "a_density_sa",
                "a_fe_ox",
                "a_k_cc",
                "a_k_co",
                "a_k_co_po",
                "a_mg_cc",
                "a_mg_co",
                "a_mg_co_po",
                "a_n_pmn",
                "a_n_rt",
                "a_nh4_cc",
                "a_nmin_cc",
                "a_no3_cc",
                "a_p_al",
                "a_p_cc",
                "a_p_ox",
                "a_p_rt",
                "a_p_sg",
                "a_p_wa",
                "a_ph_cc",
                "a_s_rt",
                "a_sand_mi",
                "a_silt_mi",
                "a_som_loi",
                "a_zn_cc",
                "b_gwl_class",
                "b_soiltype_agr",
            ]
        } else if (soilAnalysisType === "nmin") {
            soilParameters = [
                "a_source",
                "b_sampling_date",
                "a_depth_upper",
                "a_depth_lower",
                "a_no3_cc",
                "a_nh4_cc",
                "a_nmin_cc",
            ]
        } else if (soilAnalysisType === "derogation") {
            soilParameters = [
                "a_source",
                "b_sampling_date",
                "a_depth_lower",
                "a_n_rt",
                "a_cn_fr",
                "a_p_cc",
                "a_p_wa",
                "a_p_al",
                "a_c_of",
                "a_som_loi",
                "a_clay_mi",
                "a_density_sa",
            ]
        } else {
            throw data("Unsupported soil analysis type", {
                status: 400,
                statusText: "Unsupported soil analysis type",
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
        let soilParameterDescription = getSoilParametersDescription()

        // Filter soilParameterDescription based on selected soil parameters
        soilParameterDescription = soilParameterDescription.filter(
            (item: { parameter: string }) =>
                soilParameters.includes(item.parameter),
        )

        // Order soilParameterDescription based on selected soil parameters
        soilParameterDescription.sort(
            (a: { parameter: string }, b: { parameter: string }) => {
                return (
                    soilParameters.indexOf(a.parameter) -
                    soilParameters.indexOf(b.parameter)
                )
            },
        )

        // Return user information from loader
        return {
            field: field,
            soilParameterDescription: soilParameterDescription,
            soilAnalysisType: soilAnalysisType,
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
                    <h3 className="text-lg font-medium">
                        {loaderData.soilAnalysisType === "nmin"
                            ? "Bodemanalyse voor Nmin"
                            : loaderData.soilAnalysisType === "derogation"
                              ? "Bodemanalyse voor derogatie"
                              : "Bodemanalyse"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Voeg een nieuwe bodemanalyse toe
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
            <SoilAnalysisForm
                soilAnalysis={undefined}
                soilParameterDescription={loaderData.soilParameterDescription}
                action="."
            />
        </div>
    )
}

/**
 *  Action function to add a new soil analysis.
 *
 * his function creates a new soil analysis based on the provided form data.
 * It validates the data, retrieves the necessary IDs from the route parameters,
 * and uses the `addSoilAnalysis` function from `@svenvw/fdm-core` to perform the creation.
 *
 * @param params - The route parameters, including `b_id` and `b_id_farm`.
 * @returns A redirect response after successful creation.
 * @returns A redirect response after successful update.
 * @throws {Response} If any ID is missing (HTTP 400).
 * @throws {Response} If there is an error during the creation (HTTP 500).
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
