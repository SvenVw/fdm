import { getOrganizationsForUser } from "@svenvw/fdm-core"
import type { LoaderFunctionArgs } from "react-router"
import { NavLink, useLoaderData } from "react-router-dom"
import { Button } from "~/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { getSession } from "~/lib/auth.server"
import { fdm } from "~/lib/fdm.server"
import { FarmTitle } from "../components/custom/farm/farm-title"
import { Badge } from "../components/ui/badge"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "../components/ui/breadcrumb"
import { Separator } from "../components/ui/separator"
import { SidebarTrigger } from "../components/ui/sidebar"
import { handleLoaderError } from "../lib/error"

// Define the type for a single organization based on getOrganizationsForUser return type
type OrganizationType = {
    organization_id: string
    name: string
    slug: string
    role: string
    is_verified: boolean
    description: string
}

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const session = await getSession(request)
        const organizations = await getOrganizationsForUser(
            fdm,
            session.user.id,
        )
        return { organizations }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

export default function OrganizationsIndex() {
    const { organizations } = useLoaderData<{
        organizations: OrganizationType[]
    }>()

    return (
        <main className="container">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink href="/organization">
                                Organisaties
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem className="hidden md:block">
                            Mijn organisaties
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>
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
                    <div className="mx-auto flex h-full w-full items-center flex-col justify-center space-y-6 sm:w-[350px]">
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
                        {organizations.map((org: OrganizationType) => (
                            <Card key={org.organization_id}>
                                <CardHeader>
                                    <CardTitle>
                                        <div className="flex items-center justify-between">
                                            {org.name}
                                            <Badge
                                                className="ml-auto"
                                                variant="secondary"
                                            >
                                                {org.role}
                                            </Badge>
                                        </div>
                                    </CardTitle>
                                    <CardDescription />
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground truncate">
                                        {org.description}
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
