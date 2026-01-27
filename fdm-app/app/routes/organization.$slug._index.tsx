import { getFarms } from "@svenvw/fdm-core"
import { House, Users } from "lucide-react"
import { data, NavLink, useLoaderData } from "react-router"
import { FarmTitle } from "~/components/blocks/farm/farm-title"
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { auth } from "~/lib/auth.server"
import { getCalendarSelection } from "~/lib/calendar"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { FarmContent } from "../components/blocks/farm/farm-content"
import type { Route } from "./+types/organization.$slug._index"
import { useCalendarStore } from "../store/calendar"

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
    const selectedCalendar = useCalendarStore((store) => store.calendar)

    return (
        <main>
            <FarmTitle
                title={`Dashboard van ${loaderData.organization.name}`}
                description={"Bekijk alle informatie over deze organisatie"}
                action={{ label: "Terug naar organisaties", to: "./.." }}
            />
            <FarmContent>
                <div>
                    <div className="lg:col-span-2 space-y-8">
                        <div className="space-y-4">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Overzicht
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <NavLink to={"members"}>
                                    <Card className="transition-all hover:shadow-md">
                                        <CardHeader>
                                            <div className="flex items-center gap-4">
                                                <div className="rounded-lg bg-primary text-primary-foreground p-3">
                                                    <Users className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <CardTitle>Leden</CardTitle>
                                                    <CardDescription>
                                                        Bekijk en beheer de
                                                        gebruikers die toegang
                                                        hebben tot deze
                                                        organisatie.
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                    </Card>
                                </NavLink>
                                <NavLink to={`${selectedCalendar}/farms`}>
                                    <Card className="transition-all hover:shadow-md">
                                        <CardHeader>
                                            <div className="flex items-center gap-4">
                                                <div className="rounded-lg bg-primary text-primary-foreground p-3">
                                                    <House className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <CardTitle>
                                                        Bedrijven
                                                    </CardTitle>
                                                    <CardDescription>
                                                        Uitgebreide tabel met
                                                        bedrijven met toegang
                                                        tot deze organisatie, .
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                    </Card>
                                </NavLink>
                            </div>
                        </div>
                    </div>
                </div>
            </FarmContent>
        </main>
    )
}
