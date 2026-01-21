import { getFarms } from "@svenvw/fdm-core"
import { CheckIcon, House, MapIcon, PlusCircle, PlusIcon } from "lucide-react"
import { data, NavLink, useLoaderData } from "react-router"
import { FarmTitle } from "~/components/blocks/farm/farm-title"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { auth } from "~/lib/auth.server"
import { getCalendarSelection } from "~/lib/calendar"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { getTimeBasedGreeting } from "~/lib/greetings"
import type { Route } from "./+types/organization.$slug._index"

export async function loader({ params, request }: Route.LoaderArgs) {
    try {
        const organizations = await auth.api.listOrganizations({
            headers: request.headers,
        })

        const organization = organizations.find(
            (org) => org.slug === params.slug,
        )

        if (!organization) {
            throw data("Organisatie niet gevonden.", 404)
        }

        // Get a list of possible farms of the user
        const farms = await getFarms(fdm, organization.id)

        // Get latest available year
        const calendar = getCalendarSelection()[0] ?? "all"

        return {
            farms: farms,
            calendar: calendar,
            slug: params.slug,
            organization: organization,
        }
    } catch (e) {
        throw handleLoaderError(e)
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
        <main>
            {loaderData.farms.length === 0 ? (
                <div className="flex h-[calc(100vh-8rem)] flex-col">
                    <FarmTitle
                        title={`${loaderData.organization.name} Dashboard`}
                        description="Kies een van de onderstaande opties om verder te gaan."
                    />
                    <div className="grid grow grid-cols-1 gap-6 p-10 lg:grid-cols-2">
                        <Card className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <PlusCircle className="h-8 w-8 text-primary" />
                                    <span className="text-2xl">
                                        Nieuw bedrijf aanmaken
                                    </span>
                                </CardTitle>
                                <CardDescription>
                                    Start met het aanmaken van je bedrijf en
                                    voeg je percelen toe.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grow space-y-4 text-muted-foreground">
                                <p>
                                    Een bedrijf vormt de basis voor al je
                                    analyses en adviezen. Krijg toegang tot:
                                </p>
                                <ul className="space-y-2">
                                    <li className="flex items-start gap-2">
                                        <CheckIcon className="mt-1 h-5 w-5 shrink-0 text-primary" />
                                        <span>
                                            Toegang tot de <b>Stikstofbalans</b>
                                            , <b>Bemestingsadvies</b> en{" "}
                                            <b>Gebruiksruimte</b>.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckIcon className="mt-1 h-5 w-5 shrink-0 text-primary" />
                                        <span>
                                            Beheer van meerdere jaren voor een
                                            compleet overzicht.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckIcon className="mt-1 h-5 w-5 shrink-0 text-primary" />
                                        <span>
                                            Een uitgebreide lijst van
                                            meststoffen die je zelf kunt
                                            aanpassen en uitbreiden.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckIcon className="mt-1 h-5 w-5 shrink-0 text-primary" />
                                        <span>
                                            De mogelijkheid om je adviseur
                                            toegang te geven tot je
                                            bedrijfsgegevens.
                                        </span>
                                    </li>
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button asChild className="w-full">
                                    <NavLink to="/farm/create">
                                        Start wizard
                                    </NavLink>
                                </Button>
                            </CardFooter>
                        </Card>
                        <Card className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapIcon className="h-8 w-8 text-primary" />
                                    <span className="text-2xl">
                                        Verken de Atlas
                                    </span>
                                </CardTitle>
                                <CardDescription>
                                    Bekijk percelen op de kaart en ontdek
                                    gedetailleerde informatie.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grow space-y-4 text-muted-foreground">
                                <p>
                                    De Atlas is een handige tool om percelen te
                                    analyseren, zelfs zonder een eigen bedrijf.
                                    Ontdek bijvoorbeeld:
                                </p>
                                <ul className="space-y-2">
                                    <li className="flex items-start gap-2">
                                        <CheckIcon className="mt-1 h-5 w-5 shrink-0 text-primary" />
                                        <span>
                                            De volledige teelthistorie van
                                            percelen tot 2009.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckIcon className="mt-1 h-5 w-5 shrink-0 text-primary" />
                                        <span>
                                            Of een perceel in een gebied met
                                            beperkingen voor de gebruiksruimte
                                            valt.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckIcon className="mt-1 h-5 w-5 shrink-0 text-primary" />
                                        <span>
                                            Een inschatting van de bodemtextuur
                                            en het grondwaterpeil.
                                        </span>
                                    </li>
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    asChild
                                    className="w-full"
                                    variant="secondary"
                                >
                                    <NavLink
                                        to={`/farm/undefined/${loaderData.calendar}/atlas/fields`}
                                    >
                                        Naar de Atlas
                                    </NavLink>
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            ) : (
                <>
                    <FarmTitle
                        title={`${greeting}, ${loaderData.username}! 👋`}
                        description={
                            "Kies een bedrijf uit de lijst om verder te gaan of maak een nieuw bedrijf aan"
                        }
                    />
                    <div className="space-y-6 p-10 pb-0">
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {loaderData.farms.map((farm) => (
                                <Card
                                    key={farm.b_id_farm}
                                    className="transition-all hover:shadow-md"
                                >
                                    <NavLink
                                        to={`/farm/${farm.b_id_farm}`}
                                        className="flex h-full flex-col"
                                    >
                                        <CardHeader>
                                            <CardTitle className="flex items-center">
                                                <div className="flex items-center gap-2">
                                                    <div className="rounded-lg bg-muted p-2">
                                                        <House className="h-5 w-5 text-muted-foreground" />
                                                    </div>
                                                    {farm.b_name_farm}
                                                </div>
                                                <div className="ml-auto flex space-x-2">
                                                    {farm.roles.map((role) => (
                                                        <Badge
                                                            key={role}
                                                            variant="outline"
                                                        >
                                                            {role === "owner"
                                                                ? "Eigenaar"
                                                                : role ===
                                                                    "advisor"
                                                                  ? "Adviseur"
                                                                  : role ===
                                                                      "researcher"
                                                                    ? "Onderzoeker"
                                                                    : "Onbekend"}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </CardTitle>
                                            <CardDescription />
                                        </CardHeader>
                                        <CardContent className="grow">
                                            <div className="grid gap-2">
                                                <div className="flex items-center text-sm text-muted-foreground">
                                                    <p>Adres:</p>
                                                    {farm.b_address_farm ? (
                                                        <p className="ml-auto">
                                                            {
                                                                farm.b_address_farm
                                                            }
                                                        </p>
                                                    ) : (
                                                        <p className="ml-auto">
                                                            {"Onbekend"}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex items-center text-sm text-muted-foreground">
                                                    <p>Postcode:</p>
                                                    {farm.b_postalcode_farm ? (
                                                        <p className="ml-auto">
                                                            {
                                                                farm.b_postalcode_farm
                                                            }
                                                        </p>
                                                    ) : (
                                                        <p className="ml-auto">
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
                                        <CardFooter>
                                            <span className="text-sm font-semibold text-primary">
                                                Selecteer →
                                            </span>
                                        </CardFooter>
                                    </NavLink>
                                </Card>
                            ))}
                            <Card
                                key="new-farm"
                                className="transition-all hover:shadow-md"
                            >
                                <NavLink
                                    to={"/farm/create"}
                                    className="flex h-full flex-col"
                                >
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <div className="rounded-lg bg-muted p-2">
                                                <PlusIcon className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <span>Nieuw bedrijf</span>
                                        </CardTitle>
                                        <CardDescription />
                                    </CardHeader>
                                    <CardContent className="grow text-sm text-muted-foreground">
                                        <p>
                                            Maak een nieuw bedrijf aan en beheer
                                            je percelen, gewassen en
                                            meststoffen.
                                        </p>
                                        <p>
                                            Hiermee kun je dan voor dit bedrijf
                                            de Nutriëntenbalans,
                                            Bemestingsadvies en Gebruiksruimte
                                            gaan gebruiken.
                                        </p>
                                    </CardContent>
                                    <CardFooter>
                                        <span className="text-sm font-semibold text-primary">
                                            Naar nieuw Bedrijf →
                                        </span>
                                    </CardFooter>
                                </NavLink>
                            </Card>
                            <Card
                                key="atlas"
                                className="transition-all hover:shadow-md"
                            >
                                <NavLink
                                    to={`/farm/undefined/${loaderData.calendar}/atlas/fields`}
                                    className="flex h-full flex-col"
                                >
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <div className="rounded-lg bg-muted p-2">
                                                <MapIcon className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <span>Atlas</span>
                                        </CardTitle>
                                        <CardDescription />
                                    </CardHeader>
                                    <CardContent className="grow">
                                        <p className="text-sm text-muted-foreground">
                                            Bekijk alle percelen op de kaart en
                                            selecteer een perceel voor meer
                                            details, zoals gewashistorie.
                                        </p>
                                    </CardContent>
                                    <CardFooter>
                                        <span className="text-sm font-semibold text-primary">
                                            Naar Atlas →
                                        </span>
                                    </CardFooter>
                                </NavLink>
                            </Card>
                        </div>
                    </div>
                </>
            )}
        </main>
    )
}
