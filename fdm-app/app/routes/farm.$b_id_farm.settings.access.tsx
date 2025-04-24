import {
    data,
    LoaderFunctionArgs,
    useLoaderData,
    useParams,
    type MetaFunction,
} from "react-router"
import { Separator } from "~/components/ui/separator"
import { clientConfig } from "~/lib/config"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../components/ui/card"
import { Input } from "../components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select"
import { Button } from "../components/ui/button"
import { handleLoaderError } from "../lib/error"
import { getSession } from "../lib/auth.server"
import { isAllowedToShareFarm, listPrincipalsForFarm } from "@svenvw/fdm-core"
import { fdm } from "../lib/fdm.server"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Badge } from "../components/ui/badge"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: `Toegang - Instellingen - Bedrijf | ${clientConfig.name}` },
        {
            name: "description",
            content: "Bekijk en bewerk de toegang tot je bedrijf.",
        },
    ]
}

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

        // Get principals with access to this farm
        const principals = await listPrincipalsForFarm(
            fdm,
            session.principal_id,
            b_id_farm,
        )
        console.log(principals)

        // Check if user has share permission
        const hasSharePermission = isAllowedToShareFarm(
            fdm,
            session.principal_id,
            b_id_farm,
        )

        // Return user information from loader
        return {
            b_id_farm: b_id_farm,
            principals: principals,
            hasSharePermission: hasSharePermission,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

export default function FarmSettingsAccessBlock() {
    const { b_id_farm, principals, hasSharePermission } = useLoaderData()

    return (
        <div className="space-y-6">
            {/* <div>
                <h3 className="text-lg font-medium">Toegang</h3>
                <p className="text-sm text-muted-foreground">
                    Helaas, je hebt geen rechten om de toegang van dit bedrijf
                    te beheren
                </p>
            </div> */}
            {/* <Separator /> */}
            <Card>
                <CardHeader>
                    <CardTitle>Toegang</CardTitle>
                    <CardDescription>
                        Nodig nieuwe leden uit en zie welke uitnodigingen nog
                        open staan.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {hasSharePermission ? (
                        <InvitationForm b_id_farm={b_id_farm} />
                    ) : null}
                    <Separator className="my-4" />
                    <div className="space-y-4">
                        <div className="text-sm font-medium">
                            Gebruikers en organisaties met toegang tot dit
                            bedrijf
                        </div>
                        <div className="grid gap-6">
                            {principals.map((principal) => (
                                <PrincipalRow
                                    key={principal.username}
                                    username={principal.username}
                                    displayUserName={principal.displayUserName}
                                    image={principal.image}
                                    initials={principal.initials}
                                    role={principal.role}
                                    type={principal.type}
                                    hasSharePermission={hasSharePermission}
                                />
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

const InvitationForm = ({ b_id_farm }: { b_id_farm: string }) => {
    return (
        <form method="post" className="flex space-x-2">
            <input type="hidden" name="organization_id" value={b_id_farm} />
            <Input
                type="email"
                placeholder="Vul een emailadres in"
                name="email"
            />
            <Select defaultValue="advisor" name="role">
                <SelectTrigger className="ml-auto w-[110px]">
                    <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="owner">Eigenaar</SelectItem>
                    <SelectItem value="advisor">Adviseur</SelectItem>
                    <SelectItem value="onderzoeker">Onderzoeker</SelectItem>
                </SelectContent>
            </Select>
            <Button
                variant="default"
                className="shrink-0"
                name="intent"
                value="invite_user"
            >
                Uitnodigen
            </Button>
        </form>
    )
}

const PrincipalRow = ({
    key,
    username,
    displayUserName,
    image,
    initials,
    role,
    type,
    hasSharePermission,
}: {
    key: string
    username: string
    displayUserName: string
    image: string | undefined
    initials: string
    role: "owner" | "advisor" | "researcher"
    type: "user" | "organization"
    hasSharePermission: boolean
}) => {
    return (
        <div key={key} className="flex items-center justify-between space-x-4">
            <div className="flex items-center space-x-4">
                <Avatar>
                    <AvatarImage src={image} />
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-sm font-medium leading-none">
                        {displayUserName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {type === "user"
                            ? "Gebruiker"
                            : type === "organization"
                              ? "Organisatie"
                              : "Onbekend"}
                    </p>
                </div>
            </div>
            {hasSharePermission ? (
                <form method="post" className="flex items-center space-x-4">
                    <input type="hidden" name="username" value={username} />
                    <Select defaultValue={role} name="role">
                        <SelectTrigger className="ml-auto w-[110px]">
                            <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="owner">Eigenaar</SelectItem>
                            <SelectItem value="advisor">Adviseur</SelectItem>
                            <SelectItem value="researcher">
                                Onderzoeker
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        type="submit"
                        className="shrink-0"
                        name="intent"
                        value="update_role"
                    >
                        Bijwerken
                    </Button>
                    {/* {permissions.canRemoveUser ? ( */}
                    <Button
                        variant="destructive"
                        className="shrink-0"
                        name="intent"
                        value="remove_user"
                    >
                        Verwijder
                    </Button>
                    {/* ) : null} */}
                </form>
            ) : (
                <p className="text-sm font-medium leading-none">
                    <Badge>
                        {" "}
                        {role === "owner"
                            ? "Eigenaar"
                            : role === "advisor"
                              ? "Adviseur"
                              : role === "researcher"
                                ? "Onderzoeker"
                                : "Onbekend"}
                    </Badge>
                </p>
            )}
        </div>
    )
}
