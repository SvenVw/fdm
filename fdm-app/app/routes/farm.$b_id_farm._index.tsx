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
import { getFarm, getFarms, getFields } from "@svenvw/fdm-core"
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
import {
    ArrowRightLeft,
    BookOpenText,
    ChevronsUp,
    ChevronUp,
    Landmark,
    MapIcon,
    Plus,
    Settings,
    Shapes,
    Square,
    UserRoundCheck,
    Zap,
} from "lucide-react"

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

        // Get the list of fields
        const fields = await getFields(fdm, session.principal_id, b_id_farm)

        // Calculate total area for this farm
        const farmArea = fields.reduce((acc, field) => acc + field.b_area, 0)

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
            fieldsNumber: fields.length,
            farmArea: Math.round(farmArea),
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
                    <div className="grid  gap-4">
                        <Card className="w-full">
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                    <div className="rounded-lg bg-muted p-2">
                                        <Zap className="h-8 w-8 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle>Snelle acties</CardTitle>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="grid lg:grid-cols-2 gap-4">
                                <NavLink to="#">
                                    <Card>
                                        <CardHeader className="flex items-start">
                                            <div className="flex items-center gap-4">
                                                <div className="rounded-lg bg-muted p-2">
                                                    <Plus className="h-8 w-8 text-primary" />
                                                </div>
                                                <div>
                                                    <CardTitle>
                                                        Bemesting
                                                    </CardTitle>
                                                    <CardDescription>
                                                        Voeg een bemesting toe
                                                        voor één of meerdere
                                                        percelen.
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                    </Card>
                                </NavLink>
                                <NavLink to="#">
                                    <Card>
                                        <CardHeader className="flex items-start">
                                            <div className="flex items-center gap-4">
                                                <div className="rounded-lg bg-muted p-2">
                                                    <Plus className="h-8 w-8 text-primary" />
                                                </div>
                                                <div>
                                                    <CardTitle>Oogst</CardTitle>
                                                    <CardDescription className="">
                                                        Voeg een oogst toe voor
                                                        één of meerdere
                                                        percelen.
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                    </Card>
                                </NavLink>
                            </CardContent>
                        </Card>
                        <div className="grid lg:grid-cols-2 gap-4">
                            <Card className="w-full">
                                <CardHeader>
                                    <CardTitle>Apps</CardTitle>
                                    <CardDescription>
                                        Bekijk welke apps er beschikbaar zijn
                                        voor dit bedrijf.
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
                                                            Inzicht in aanvoer,
                                                            afvoer en emissie
                                                            van stikstof
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
                                                            Advies volgens
                                                            Handboek Bodem en
                                                            Bemesting (CBAV) en
                                                            Adviesbasis
                                                            Bemesting (CBGV).
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
                                                            Gebruiksnormen op
                                                            bedrijdfs- en
                                                            perceelsniveau
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
                                                        <CardTitle>
                                                            Atlas
                                                        </CardTitle>
                                                        <CardDescription>
                                                            Bekijk gewaspercelen
                                                            op de kaart
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                        </Card>
                                    </NavLink>
                                </CardContent>
                            </Card>

                            <Card className="w-full">
                                <CardHeader>
                                    <CardTitle>Gegevens</CardTitle>
                                    <CardDescription>
                                        Bekijk welke gegevens er zijn over dit
                                        bedrijf.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid lg:grid-cols-2 gap-4">
                                    <NavLink to={`${calendar}/field`}>
                                        <Card>
                                            <CardHeader className="flex items-start">
                                                <div className="flex items-center gap-4">
                                                    <div className="rounded-lg bg-muted p-2">
                                                        <Square className="h-8 w-8 text-primary" />
                                                    </div>
                                                    <div>
                                                        <CardTitle>
                                                            Percelen
                                                        </CardTitle>
                                                        <CardDescription>
                                                            {loaderData.fieldsNumber ===
                                                            0
                                                                ? `Dit bedrijf heeft geen percelen ${calendar}`
                                                                : loaderData.fieldsNumber ===
                                                                    1
                                                                  ? `Dit bedrijf heeft 1 perceel in ${calendar}`
                                                                  : `Dit bedrijf heeft ${loaderData.fieldsNumber} percelen en ${loaderData.farmArea} ha in ${calendar}.`}
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                        </Card>
                                    </NavLink>
                                    <NavLink to="fertilizers">
                                        <Card>
                                            <CardHeader className="flex items-start">
                                                <div className="flex items-center gap-4">
                                                    <div className="rounded-lg bg-muted p-2">
                                                        <Shapes className="h-8 w-8 text-primary" />
                                                    </div>
                                                    <div>
                                                        <CardTitle>
                                                            Meststoffen
                                                        </CardTitle>
                                                        <CardDescription className="">
                                                            Bekijk en beheer de
                                                            meststoffen voor dit
                                                            bedrijf
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                        </Card>
                                    </NavLink>
                                    <NavLink to="settings/access">
                                        <Card>
                                            <CardHeader className="flex items-start">
                                                <div className="flex items-center gap-4">
                                                    <div className="rounded-lg bg-muted p-2">
                                                        <UserRoundCheck className="h-8 w-8 text-primary" />
                                                    </div>
                                                    <div>
                                                        <CardTitle>
                                                            Toegang
                                                        </CardTitle>
                                                        <CardDescription>
                                                            {loaderData
                                                                .roles[0] ===
                                                            "owner"
                                                                ? "Je hebt de rol Eigenaar voor dit bedrijf."
                                                                : loaderData
                                                                        .roles[0] ===
                                                                    "advisor"
                                                                  ? "Je hebt de rol Adviseur voor dit bedrijf."
                                                                  : loaderData
                                                                          .roles[0] ===
                                                                      "researcher"
                                                                    ? "Je hebt de rol Onderzoeker voor dit bedrijf."
                                                                    : `Je hebt de rol ${loaderData.roles[0]} voor dit bedrijf.`}
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                        </Card>
                                    </NavLink>
                                    <NavLink to="settings">
                                        <Card>
                                            <CardHeader className="flex items-start">
                                                <div className="flex items-center gap-4">
                                                    <div className="rounded-lg bg-muted p-2">
                                                        <Settings className="h-8 w-8 text-primary" />
                                                    </div>
                                                    <div>
                                                        <CardTitle>
                                                            Instellingen
                                                        </CardTitle>
                                                        <CardDescription>
                                                            Pas de instellingen
                                                            voor dit bedrijf
                                                            aan.
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                        </Card>
                                    </NavLink>
                                    <NavLink to="settings/derogation">
                                        <Card>
                                            <CardHeader className="flex items-start">
                                                <div className="flex items-center gap-4">
                                                    <div className="rounded-lg bg-muted p-2">
                                                        <ChevronUp className="h-8 w-8 text-primary" />
                                                    </div>
                                                    <div>
                                                        <CardTitle>
                                                            Derogatie
                                                        </CardTitle>
                                                        <CardDescription>
                                                            Beheer derogatie
                                                            voor dit bedrijf.
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                        </Card>
                                    </NavLink>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </FarmContent>
            </main>
        </SidebarInset>
    )
}
