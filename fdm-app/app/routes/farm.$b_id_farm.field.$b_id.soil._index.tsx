import { SoilDataCards } from "@/components/custom/soil/cards"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getSession } from "@/lib/auth.server"
import { handleLoaderError } from "@/lib/error"
import { fdm } from "@/lib/fdm.server"
import {
    getField,
    getSoilAnalyses,
    getSoilParametersDescription,
} from "@svenvw/fdm-core"
import { getCurrentSoilData } from "@svenvw/fdm-core"
import { Plus } from "lucide-react"
import {
    type LoaderFunctionArgs,
    NavLink,
    data,
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
        const soilAnalyses = await getSoilAnalyses(
            fdm,
            session.principal_id,
            b_id,
        )

        // Get current soil data
        const currentSoilData = await getCurrentSoilData(
            fdm,
            session.principal_id,
            b_id,
        )

        // Get soil parameter descriptions
        const soilParameterDescription = getSoilParametersDescription()

        // Return user information from loader
        return {
            field: field,
            currentSoilData: currentSoilData,
            soilParameterDescription: soilParameterDescription,
            soilAnalyses: soilAnalyses,
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

    return (
        <Tabs defaultValue="parameters" className="space-y-6">
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-medium">Bodem</h3>
                    <p className="text-sm text-muted-foreground">
                        In de gegevens hieronder vind je meest recente waarde
                        gemeten voor elke bodemparameter
                    </p>
                </div>
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="parameters">Parameters</TabsTrigger>
                        <TabsTrigger value="analyses">Analyses</TabsTrigger>
                    </TabsList>
                    <Button asChild>
                        <NavLink to="./analysis">
                            <Plus />
                            Bodemanalyse toevoegen
                        </NavLink>
                    </Button>
                </div>
            </div>
            <Separator />
            <div className="">
                <TabsContent value="parameters">
                    {loaderData.soilAnalyses.length === 0 ? (
                        <div className="mx-auto flex h-full w-full items-center flex-col justify-center space-y-6 sm:w-[350px]">
                            <div className="flex flex-col space-y-2 text-center">
                                <h1 className="text-2xl font-semibold tracking-tight">
                                    Dit perceel heeft nog geen bodemanalyse
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Voeg een analyse toe om gegevens over de
                                    bodem bij te houden
                                </p>
                            </div>
                            <Button asChild>
                                <NavLink to="./analysis">
                                    Bodemanalyse toevoegen
                                </NavLink>
                            </Button>
                        </div>
                    ) : (
                        <SoilDataCards
                            currentSoilData={loaderData.currentSoilData}
                            soilParameterDescription={
                                loaderData.soilParameterDescription
                            }
                        />
                    )}
                </TabsContent>
                <TabsContent value="analyses">
                    <Button asChild>
                        <NavLink to="./analysis">
                            <Plus />
                            Bodemanalyse toevoegen
                        </NavLink>
                    </Button>
                </TabsContent>
            </div>
        </Tabs>
    )
}
