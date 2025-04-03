import { getSession } from "~/lib/auth.server"
import { handleLoaderError } from "~/lib/error"
import { type LoaderFunctionArgs, type MetaFunction, useLoaderData } from "react-router"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { Separator } from "~/components/ui/separator"
import { SidebarTrigger } from "~/components/ui/sidebar"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
} from "~/components/ui/breadcrumb"
import { FarmTitle } from "~/components/custom/farm/farm-title"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { clientConfig } from "~/lib/config"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: `Account | ${clientConfig.name}` },
        {
            name: "description",
            content: "Bekijk en bewerk de gegevens van je account.",
        },
    ]
}

/**
 * Retrieves the user session data.
 *
 * @param request - The HTTP request object used to retrieve session information.
 * @returns An object containing:
 *   - user: The user's information from the session data.
 *
 * @throws {Error} If retrieving the session fails.
 */
export async function loader({ request }: LoaderFunctionArgs) {
    try {
        // Get the session
        const session = await getSession(request)

        // Return user information from loader
        return {
            user: session.user,
            initials: session.initials,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

/**
 * Renders the user interface for the Account page.
 *
 * This component uses data from the loader to display the user's account details.
 */
export default function Account() {
    const loaderData = useLoaderData<typeof loader>()
    const user = loaderData.user

    const avatarInitials = loaderData.initials

    return (
        <main className="container">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink href="/farm/account">
                                Account
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>
            <div className="max-w-3xl mx-auto px-4">
                <div className="mb-8">
                    <FarmTitle
                        title={"Accountgegevens"}
                        description={"Hier vind je jouw accountgegevens."}
                    />
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Jouw gegevens</CardTitle>
                        <CardDescription>
                            Hieronder vind je jouw accountgegevens.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-4">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={user.image} alt={user.name} />
                                <AvatarFallback>
                                    {avatarInitials}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {user.email}
                                </p>
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                            <p className="text-sm font-medium">
                                Voornaam:{" "}
                                <span className="font-normal text-muted-foreground">
                                    {user.firstname}
                                </span>
                            </p>
                            <p className="text-sm font-medium">
                                Achternaam:{" "}
                                <span className="font-normal text-muted-foreground">
                                    {user.surname}
                                </span>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </main>
    )
}
