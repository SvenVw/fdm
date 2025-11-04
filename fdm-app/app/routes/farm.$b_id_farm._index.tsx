import { cowHead } from "@lucide/lab"
import { getFarm, getFarms, getFields } from "@svenvw/fdm-core"
import {
    ArrowRightLeft,
    BookOpenText,
    ChevronUp,
    Home,
    Icon,
    Landmark,
    MapIcon,
    Plus,
    ScrollText,
    Shapes,
    Square,
    Trash2,
    UserRoundCheck,
} from "lucide-react"
import {
    data,
    type LoaderFunctionArgs,
    type MetaFunction,
    NavLink,
    useLoaderData,
} from "react-router"
import { getSession } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"
import { FarmContent } from "../components/blocks/farm/farm-content"
import { FarmTitle } from "../components/blocks/farm/farm-title"
import { Header } from "../components/blocks/header/base"
import { HeaderFarm } from "../components/blocks/header/farm"
import { Button } from "../components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select"
import { SidebarInset } from "../components/ui/sidebar"
import { getCalendarSelection } from "../lib/calendar"
import { fdm } from "../lib/fdm.server"
import { useCalendarStore } from "../store/calendar"

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
    const setCalendar = useCalendarStore((state) => state.setCalendar)
    const years = getCalendarSelection()

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
                <FarmTitle
                    title={`${loaderData.b_name_farm}`}
                    description={
                        "Een overzicht van de bedrijfsgegevens, snelle acties en applicaties."
                    }
                />
                <FarmContent>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Quick Actions */}
                            <div className="space-y-4">
                                <h2 className="text-2xl font-semibold tracking-tight">
                                    Snelle acties
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <NavLink
                                        to={`${calendar}/field/fertilizer`}
                                    >
                                        <Card className="transition-all hover:shadow-md">
                                            <CardHeader>
                                                <div className="flex items-center gap-4">
                                                    <div className="rounded-lg bg-primary text-primary-foreground p-3">
                                                        <Plus className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <CardTitle>
                                                            Bemesting toevoegen
                                                        </CardTitle>
                                                        <CardDescription>
                                                            Voor één of meerdere
                                                            percelen.
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                        </Card>
                                    </NavLink>
                                    <NavLink to={`${calendar}/field`}>
                                        <Card className="transition-all hover:shadow-md">
                                            <CardHeader>
                                                <div className="flex items-center gap-4">
                                                    <div className="rounded-lg bg-primary text-primary-foreground p-3">
                                                        <Square className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <CardTitle>
                                                            Perceelsoverzicht
                                                        </CardTitle>
                                                        <CardDescription>
                                                            Uitgebreide tabel
                                                            met o.a. gewassen en
                                                            meststoffen per
                                                            perceel.
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                        </Card>
                                    </NavLink>
                                </div>
                            </div>

                            {/* Apps */}
                            <div className="space-y-4">
                                <h2 className="text-2xl font-semibold tracking-tight">
                                    Apps
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <NavLink to={`${calendar}/balance`}>
                                        <Card className="transition-all hover:shadow-md">
                                            <CardHeader>
                                                <div className="flex items-center gap-4">
                                                    <div className="rounded-lg bg-muted p-3">
                                                        <ArrowRightLeft className="h-6 w-6 text-primary" />
                                                    </div>
                                                    <div>
                                                        <CardTitle>
                                                            Nutriëntenbalans
                                                        </CardTitle>
                                                        <CardDescription>
                                                            Aanvoer, afvoer en
                                                            emissie van
                                                            stikstof.
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                        </Card>
                                    </NavLink>
                                    <NavLink to={`${calendar}/nutrient_advice`}>
                                        <Card className="transition-all hover:shadow-md">
                                            <CardHeader>
                                                <div className="flex items-center gap-4">
                                                    <div className="rounded-lg bg-muted p-3">
                                                        <BookOpenText className="h-6 w-6 text-primary" />
                                                    </div>
                                                    <div>
                                                        <CardTitle>
                                                            Bemestingsadvies
                                                        </CardTitle>
                                                        <CardDescription>
                                                            Volgens Handboek
                                                            Bodem en Bemesting
                                                            en Adviesbasis
                                                            Bemesting.
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                        </Card>
                                    </NavLink>
                                    <NavLink to={`${calendar}/norms`}>
                                        <Card className="transition-all hover:shadow-md">
                                            <CardHeader>
                                                <div className="flex items-center gap-4">
                                                    <div className="rounded-lg bg-muted p-3">
                                                        <Landmark className="h-6 w-6 text-primary" />
                                                    </div>
                                                    <div>
                                                        <CardTitle>
                                                            Gebruiksnormen
                                                        </CardTitle>
                                                        <CardDescription>
                                                            Normen op bedrijfs-
                                                            en perceelsniveau.
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                        </Card>
                                    </NavLink>
                                    <NavLink to={`${calendar}/atlas`}>
                                        <Card className="transition-all hover:shadow-md">
                                            <CardHeader>
                                                <div className="flex items-center gap-4">
                                                    <div className="rounded-lg bg-muted p-3">
                                                        <MapIcon className="h-6 w-6 text-primary" />
                                                    </div>
                                                    <div>
                                                        <CardTitle>
                                                            Atlas
                                                        </CardTitle>
                                                        <CardDescription>
                                                            Gewaspercelen op de
                                                            kaart.
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                        </Card>
                                    </NavLink>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-8">
                            {/* Overview */}
                            <div className="space-y-4">
                                <h2 className="text-2xl font-semibold tracking-tight">
                                    Overzicht
                                </h2>
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">
                                                    Aantal percelen
                                                </span>
                                                <span className="font-semibold">
                                                    {loaderData.fieldsNumber}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">
                                                    Totale oppervlakte
                                                </span>
                                                <span className="font-semibold">
                                                    {loaderData.farmArea} ha
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">
                                                    Rol
                                                </span>
                                                <span className="font-semibold">
                                                    {loaderData.roles.includes(
                                                        "owner",
                                                    )
                                                        ? "Eigenaar"
                                                        : loaderData.roles.includes(
                                                                "advisor",
                                                            )
                                                          ? "Adviseur"
                                                          : loaderData.roles.includes(
                                                                  "researcher",
                                                              )
                                                            ? "Onderzoeker"
                                                            : loaderData
                                                                  .roles[0]}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">
                                                    Jaar
                                                </span>
                                                <Select
                                                    value={calendar}
                                                    onValueChange={(value) =>
                                                        setCalendar(value)
                                                    }
                                                >
                                                    <SelectTrigger className="w-[180px]">
                                                        <SelectValue placeholder="Select a year" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {years.map((year) => (
                                                            <SelectItem
                                                                key={year}
                                                                value={year}
                                                            >
                                                                {year}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Settings */}
                            <div className="space-y-4">
                                <h2 className="text-2xl font-semibold tracking-tight">
                                    Gegevens
                                </h2>
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="space-y-1">
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start"
                                                asChild
                                            >
                                                <NavLink
                                                    to={`${calendar}/field`}
                                                >
                                                    <Square className="mr-2 h-4 w-4" />
                                                    Percelen
                                                </NavLink>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start"
                                                asChild
                                            >
                                                <NavLink to="fertilizers">
                                                    <Shapes className="mr-2 h-4 w-4" />
                                                    Meststoffen
                                                </NavLink>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start"
                                                asChild
                                            >
                                                <NavLink to="settings">
                                                    <Home className="mr-2 h-4 w-4" />
                                                    Bedrijf
                                                </NavLink>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start"
                                                asChild
                                            >
                                                <NavLink to="settings/derogation">
                                                    <ChevronUp className="mr-2 h-4 w-4" />
                                                    Derogatie
                                                </NavLink>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start"
                                                asChild
                                            >
                                                <NavLink to="settings/organic-certification">
                                                    <ScrollText className="mr-2 h-4 w-4" />
                                                    Bio-certificaat
                                                </NavLink>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start"
                                                asChild
                                            >
                                                <NavLink to="settings/grazing-intention">
                                                    <Icon
                                                        iconNode={cowHead}
                                                        className="mr-2 h-4 w-4"
                                                    />
                                                    Beweiding
                                                </NavLink>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start"
                                                asChild
                                            >
                                                <NavLink to="settings/access">
                                                    <UserRoundCheck className="mr-2 h-4 w-4" />
                                                    Toegang
                                                </NavLink>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start"
                                                asChild
                                            >
                                                <NavLink to="settings/delete">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Verwijderen
                                                </NavLink>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </FarmContent>
            </main>
        </SidebarInset>
    )
}
