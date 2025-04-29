import { getFarms } from "@svenvw/fdm-core"
import {
    type LoaderFunctionArgs,
    type MetaFunction,
    NavLink,
    useLoaderData,
} from "react-router"
import { FarmHeader } from "~/components/custom/farm/farm-header"
import { FarmTitle } from "~/components/custom/farm/farm-title"
import { Button } from "~/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { Separator } from "~/components/ui/separator"
import { SidebarInset } from "~/components/ui/sidebar"
import { getSession } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { getTimeBasedGreeting } from "~/lib/greetings"
import { Badge } from "../components/ui/badge"
import { House } from "lucide-react"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: `Bedrijf | ${clientConfig.name}` },
        {
            name: "description",
            content: "Selecteer een bedrijf.",
        },
    ]
}

// Define a type for farm with added role property
type Farm = {
    b_id_farm: string
    b_name_farm: string
    b_businessid_farm: string
    b_address_farm: string
    b_postalcode_farm: string
}

/**
 * Retrieves the user session and associated farms data, including the user's role.
 *
 * The function obtains the user session from the incoming request and then fetches the user's farms using the session's principal ID. It maps the farm data into a simplified array containing each farm's identifier, name, and the user's role. It returns this alongside the user's name.
 *
 * @param request - The HTTP request object used to retrieve session information.
 * @returns An object containing:
 *   - farmsWithRoles: An array of objects, each with a farm's ID, name, and the user's role.
 *   - username: The user's name from the session data.
 *
 * @throws {Error} If retrieving the session or fetching the farm data fails.
 */
export async function loader({ request }: LoaderFunctionArgs) {
    try {
        // Get the session
        const session = await getSession(request)

        // Get a list of possible farms of the user
        const farms = await getFarms(fdm, session.principal_id)

        // Return user information from loader
        return {
            farms: farms,
            username: session.userName,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

/**
 * Renders the user interface for farm management.
 *
 * This component uses data from the loader to display a personalized greeting and either a list of available
 * farms for selection or a prompt to create a new farm if none exist. It integrates various UI elements like
 * the header, title, card layout, and navigation buttons to facilitate seamless interaction.
 */
export default function AppIndex() {
    const loaderData = useLoaderData<typeof loader>()
    const greeting = getTimeBasedGreeting()

    return (
        <SidebarInset>
            <FarmHeader
                farmOptions={loaderData.farms.map((farm) => ({
                    b_id_farm: farm.b_id_farm,
                    b_name_farm: farm.b_name_farm,
                }))}
                b_id_farm={undefined}
                action={undefined}
            />
            <main>
                {loaderData.farms.length === 0 ? (
                    <>
                        <FarmTitle
                            title={`Welkom, ${loaderData.username}! 👋`}
                            description={""}
                        />
                        <div className="mx-auto flex h-full w-full items-center flex-col justify-center space-y-6 sm:w-[350px]">
                            <div className="flex flex-col space-y-2 text-center">
                                <h1 className="text-2xl font-semibold tracking-tight">
                                    Het lijkt erop dat je nog geen bedrijf hebt
                                    :(
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Gebruik onze wizard en maak snel je eigen
                                    bedrijf aan
                                </p>
                            </div>
                            <Button asChild>
                                <NavLink to="./create">
                                    Maak een bedrijf
                                </NavLink>
                            </Button>
                            <p className="px-8 text-center text-sm text-muted-foreground">
                                De meeste gebruikers lukt het binnen 6 minuten.
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        <FarmTitle
                            title={`${greeting}, ${loaderData.username}! 👋`}
                            description={
                                "Kies een bedrijf uit de lijst om verder te gaan of maak een nieuw bedrijf aan"
                            }
                        />
                        <div className="space-y-6 p-10 pb-0">
                            <div className="flex-1 flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-4">
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {loaderData.farms.map((farm) => (
                                        <Card key={farm.b_id_farm}>
                                            <CardHeader className="flex flex-row items-center space-x-2">
                                                <House className="text-muted-foreground" />
                                                <CardTitle className="p-0">
                                                    {farm.b_name_farm}
                                                </CardTitle>
                                                <CardDescription />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid gap-2">
                                                    <div className="flex items-center">
                                                        <p className="text-muted-foreground">
                                                            Adres:
                                                        </p>
                                                        {farm.b_address_farm ? (
                                                            <p className="font-medium ml-auto">
                                                                {
                                                                    farm.b_address_farm
                                                                }
                                                            </p>
                                                        ) : (
                                                            <p className="font-small text-muted-foreground ml-auto">
                                                                {"Onbekend"}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center">
                                                        <p className="text-muted-foreground">
                                                            Postcode:
                                                        </p>
                                                        {farm.b_postalcode_farm ? (
                                                            <p className="font-medium ml-auto">
                                                                {
                                                                    farm.b_postalcode_farm
                                                                }
                                                            </p>
                                                        ) : (
                                                            <p className="font-small text-muted-foreground ml-auto">
                                                                {"Onbekend"}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {farm.b_businessid_farm && (
                                                        <div className="flex items-center">
                                                            <p className="text-muted-foreground">
                                                                KvK-nummer:
                                                            </p>
                                                            <p className="font-medium ml-auto">
                                                                {
                                                                    farm.b_businessid_farm
                                                                }
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                            <CardFooter className="flex justify-end">
                                                <Button
                                                    asChild
                                                    aria-label={`Selecteer ${farm.b_name_farm}`}
                                                >
                                                    <NavLink
                                                        to={`/farm/${farm.b_id_farm}`}
                                                    >
                                                        Selecteer
                                                    </NavLink>
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>

                                <div className="flex flex-col items-center space-y-2 mt-8">
                                    <Separator />
                                    <p className="text-muted-foreground text-sm">
                                        Of maak een nieuw bedrijf aan:
                                    </p>
                                    <NavLink to="/farm/create">
                                        <Button className="w-full md:w-auto">
                                            Nieuw bedrijf
                                        </Button>
                                    </NavLink>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </SidebarInset>
    )
}
