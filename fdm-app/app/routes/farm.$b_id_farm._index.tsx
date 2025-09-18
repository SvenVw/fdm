import {
    data,
    NavLink,
    Outlet,
    useLoaderData,
    type LoaderFunctionArgs,
    type MetaFunction,
} from "react-router"
import { getSession } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { handleActionError, handleLoaderError } from "~/lib/error"
import { useCalendarStore } from "../store/calendar"
import { SidebarInset } from "../components/ui/sidebar"
import { Header } from "../components/blocks/header/base"
import { HeaderFarm } from "../components/blocks/header/farm"
import { FarmTitle } from "../components/blocks/farm/farm-title"
import { FarmContent } from "../components/blocks/farm/farm-content"
import { getFarm, getFarms } from "@svenvw/fdm-core"
import { fdm } from "../lib/fdm.server"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "../components/ui/card"
import { Button } from "../components/ui/button"
import { ArrowRightLeft, BookOpenText, Landmark, MapIcon } from "lucide-react"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: `Bedrijf | ${clientConfig.name}` },
        {
            name: "description",
            content: "Bekijk en bewerk de gegevens van je bedrijf.",
        },
    ]
}

/**
 * Processes a request to retrieve a farm's session details.
 *
 * This function extracts the farm ID from the route parameters and throws an error with a 400 status
 * if the ID is missing. When a valid farm ID is provided, it retrieves the session associated with the
 * incoming request and returns an object containing both the farm ID and the session information.
 *
 * @returns An object with "farmId" and "session" properties.
 *
 * @throws {Response} If the farm ID is not provided.
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

        // Get the session
        const session = await getSession(request)

        // Get the farm details
        const farm = await getFarm(fdm, session.principal_id, b_id_farm)

        // Get a list of possible farms of the user
        const farms = await getFarms(fdm, session.principal_id)
        const farmOptions = farms.map((farm) => {
            return {
                b_id_farm: farm.b_id_farm,
                b_name_farm: farm.b_name_farm,
            }
        })

        // Return the farm ID and session info
        return {
            b_id_farm: b_id_farm,
            b_name_farm: farm.b_name_farm,
            farmOptions: farmOptions,
            roles: farm.roles,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

export default function FarmDashboardIndex() {
    const loaderData = useLoaderData<typeof loader>()

    const calendar = useCalendarStore((state) => state.calendar)

    return (
        <SidebarInset>
            <Header
                action={{
                    to: "/",
                    label: "Naar overzicht bedrijven",
                    disabled: false,
                }}
            >
                <HeaderFarm
                    b_id_farm={loaderData.b_id_farm}
                    farmOptions={loaderData.farmOptions}
                />
            </Header>
            <main>
                <FarmTitle title={loaderData.b_name_farm} description={""} />
                <FarmContent>
                    <Card className="w-1/2">
                        <CardHeader>
                            <CardTitle>Apps</CardTitle>
                            <CardDescription>
                                Bekijk welke apps er beschikbaar zijn voor dit
                                bedrijf.
                            </CardDescription>              
                        </CardHeader>
                        <CardContent className="grid lg:grid-cols-2 gap-4">
                            <NavLink to={`${calendar}/balance`}>
                                <Card>
                                    <CardHeader className="flex items-start">
                                        <div className="flex items-center gap-4">
                                            <div className="rounded-lg bg-muted p-2">
                                                <ArrowRightLeft className="h-8 w-8 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle>
                                                    Nutriententenbalans
                                                </CardTitle>
                                                <CardDescription>
                                                    Inzicht in aanvoer, afvoer
                                                    en emissie van stikstof
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                </Card>
                            </NavLink>
                            <NavLink to={`${calendar}/nutrient_advice`}>
                                <Card>
                                    <CardHeader className="flex items-start">
                                        <div className="flex items-center gap-4">
                                            <div className="rounded-lg bg-muted p-2">
                                                <BookOpenText className="h-8 w-8 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle>
                                                    Bemestingsadvies
                                                </CardTitle>
                                                <CardDescription className="">
                                                    Advies volgens Handboek
                                                    Bodem en Bemesting (CBAV) en
                                                    Adviesbasis Bemesting
                                                    (CBGV).
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                </Card>
                            </NavLink>
                            <NavLink to={`${calendar}/norms`}>
                                <Card>
                                    <CardHeader className="flex items-start">
                                        <div className="flex items-center gap-4">
                                            <div className="rounded-lg bg-muted p-2">
                                                <Landmark className="h-8 w-8 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle>
                                                    Gebruiksnormen
                                                </CardTitle>
                                                <CardDescription>
                                                    Gebruiksnormen op bedrijdfs-
                                                    en perceelsniveau
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                </Card>
                            </NavLink>
                            <NavLink to={`${calendar}/atlas`}>
                                <Card>
                                    <CardHeader className="flex items-start">
                                        <div className="flex items-center gap-4">
                                            <div className="rounded-lg bg-muted p-2">
                                                <MapIcon className="h-8 w-8 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle>Atlas</CardTitle>
                                                <CardDescription>
                                                    Bekijk gewaspercelen op de
                                                    kaart
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                </Card>
                            </NavLink>
                        </CardContent>
                    </Card>

                    <Card className="w-full max-w-sm">
                        <CardHeader>
                            <CardTitle>Overzicht</CardTitle>
                            <CardDescription></CardDescription>                  
                        </CardHeader>
                        <CardContent>
                            Mijn rol: {loaderData.roles}
                            Adres: KvK nummer: Derogatie:
                        </CardContent>
                        <CardFooter className="flex-col gap-2">
                            <Button className="w-full" asChild>
                                <NavLink to={"./settings/properties"}>
                                    Naar bedrijfsgegevens
                                </NavLink>
                            </Button>
                        </CardFooter>
                    </Card>
                </FarmContent>
            </main>
        </SidebarInset>
    )
}
