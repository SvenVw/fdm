import type { LoaderFunctionArgs } from "react-router"
import { NavLink, useLoaderData } from "react-router-dom"
import { FarmTitle } from "~/components/blocks/farm/farm-title"
import { Button } from "~/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { auth, getSession } from "~/lib/auth.server"
import { handleLoaderError } from "~/lib/error"

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        await getSession(request)

        const organizations = await auth.api.listOrganizations({
            headers: request.headers,
        })

        return { organizations }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

export default function OrganizationsIndex() {
    const { organizations } = useLoaderData<typeof loader>()

    return (
        <main className="container">
            <div className="max-w-3xl mx-auto px-4">
                {/* Changed this div to a flex container with justify-between */}
                <div className="mb-8 flex items-center justify-between">
                    <FarmTitle
                        title={"Mijn organisaties"}
                        description={
                            "Organisaties stellen je in staat om met anderen samen te werken. Je kunt organisaties aanmaken of lid worden om samen gegevens te beheren."
                        }
                        action={{
                            to: "/organization/new",
                            label: "Organisatie aanmaken",
                        }}
                    />
                </div>

                {organizations.length === 0 ? (
                    <div className="mx-auto flex h-full w-full items-center flex-col justify-center space-y-6 sm:w-87.5">
                        <div className="flex flex-col space-y-2 text-center">
                            <h1 className="text-2xl font-semibold tracking-tight">
                                Je bent nog geen lid van een organisatie
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Vraag bij je contactpersoon om een uitnodiging
                                of maak zelf een organisatie aan.
                            </p>
                        </div>
                        <Button asChild>
                            <NavLink to="/organization/invitations">
                                Bekijk uitnodigingen
                            </NavLink>
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4 grid-cols-1">
                        {organizations.map((org) => (
                            <Card key={org.id}>
                                <CardHeader>
                                    <CardTitle>
                                        <div className="flex items-center justify-between">
                                            {org.name}
                                        </div>
                                    </CardTitle>
                                    <CardDescription />
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground truncate">
                                        {org.metadata?.description ??
                                            "Geen beschrijving"}
                                    </p>
                                </CardContent>
                                <CardFooter>
                                    <Button asChild variant="outline" size="sm">
                                        <NavLink
                                            to={`/organization/${org.slug}`}
                                        >
                                            Meer info
                                        </NavLink>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </main>
    )
}
