import {
    data,
    LoaderFunctionArgs,
    useLoaderData,
    useParams,
    type MetaFunction,
    ActionFunctionArgs,
    Form,
    useFetcher,
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
import { handleLoaderError, handleActionError } from "../lib/error"
import { getSession } from "../lib/auth.server"
import {
    getFarm,
    isAllowedToShareFarm,
    listPrincipalsForFarm,
    grantRoleToFarm,
    updateRoleOfPrincipalAtFarm,
    revokePrincipalFromFarm,
} from "@svenvw/fdm-core"
import { fdm } from "../lib/fdm.server"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Badge } from "../components/ui/badge"
import { extractFormValuesFromRequest } from "../lib/form"
import { z } from "zod"
import { dataWithSuccess, dataWithError } from "remix-toast"
import { useEffect, useRef, useState } from "react"
import { RemixFormProvider, useRemixForm } from "remix-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AutoComplete } from "../components/custom/autocomplete"
import { User, Users } from "lucide-react"

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

        // Get the farm details ( to check if has access to farm)
        const farm = getFarm(fdm, session.principal_id, b_id_farm)
        if (!farm) {
            throw data("Farm is not found", {
                status: 404,
                statusText: "Farm is not found",
            })
        }

        // Get principals with access to this farm
        const principals = await listPrincipalsForFarm(
            fdm,
            session.principal_id,
            b_id_farm,
        )

        // Check if user has share permission
        const hasSharePermission = await isAllowedToShareFarm(
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
    const { b_id_farm, principals, hasSharePermission } =
        useLoaderData<typeof loader>()

    return (
        <div className="space-y-6">
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
                        <InvitationForm principals={principals} />
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
                                    b_id_farm={b_id_farm}
                                />
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

const InvitationForm = ({ principals }: { principals: any }) => {
    const fetcher = useFetcher()
    const [searchValue, setSearchValue] = useState<string>("")
    const [selectedValue, setSelectedValue] = useState<string>("")
    const [items, setItems] = useState<{ value: string; label: string }[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(false)

    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
    })

    useEffect(() => {
        if (searchValue.length >= 1) {
            setIsLoading(true)
        }
        fetcher.submit(
            { identifier: searchValue },
            { method: "post", action: "/api/lookup/principal" },
        )
    }, [searchValue, fetcher.submit])

    useEffect(() => {
        if (fetcher.data) {
            if (fetcher.data.length > 0) {
                setItems(
                    fetcher.data
                        // Do not return principals that already have access
                        .filter((item) => {
                            return !principals.some(
                                (principal: { username: string }) =>
                                    principal.username === item.value,
                            )
                        })
                        // Do not return the user itself
                        // .filter((item) => item.value !== session.user.username)
                        .map(
                            (item: {
                                username: string
                                displayUserName: string
                                type: "user" | "organization"
                            }) => ({
                                label: item.displayUserName,
                                icon: item.type === "user" ? User : Users,
                                value: item.username,
                            }),
                        ),
                )
                setIsLoading(false)
            } else {
                setItems([])
                setIsLoading(false)
            }
        }
    }, [fetcher.data, principals])

    return (
        <RemixFormProvider {...form}>
            <Form method="post" className="flex space-x-2">
                <AutoComplete
                    selectedValue={selectedValue}
                    onSelectedValueChange={setSelectedValue}
                    searchValue={searchValue}
                    onSearchValueChange={setSearchValue}
                    items={items ?? []}
                    isLoading={isLoading}
                    emptyMessage="Geen gebruikers gevonden"
                    placeholder="Zoek naar een gebruiker of vul een e-mailadres in"
                    form={form}
                    name="username"
                />
                <Select
                    defaultValue="advisor"
                    name="role"
                    onValueChange={form.setValue("role")}
                >
                    <SelectTrigger className="ml-auto w-[110px]">
                        <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="owner">Eigenaar</SelectItem>
                        <SelectItem value="advisor">Adviseur</SelectItem>
                        <SelectItem value="researcher">Onderzoeker</SelectItem>
                    </SelectContent>
                </Select>
                <Button
                    variant="default"
                    className="shrink-0"
                    name="intent"
                    value="invite_user"
                    type="submit"
                >
                    Uitnodigen
                </Button>
            </Form>
        </RemixFormProvider>
    )
}

const PrincipalRow = ({
    username,
    displayUserName,
    image,
    initials,
    role,
    type,
    hasSharePermission,
}: {
    username: string
    displayUserName: string
    image: string | undefined
    initials: string
    role: "owner" | "advisor" | "researcher"
    type: "user" | "organization"
    hasSharePermission: boolean
    b_id_farm: string
}) => {
    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
        defaultValues: {
            role: role,
            intent: "update_role",
        },
    })

    const handleRemove = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault()
        await form.handleSubmit((e) => {})(
            new SubmitEvent("submit", {
                submitter: {
                    name: "remove_user",
                    value: "remove_user",
                } as HTMLButtonElement,
            }),
        )
    }

    const handleSelectChange = async (value: string) => {
        form.setValue("role", value)
        await form.handleSubmit((e) => {})(new SubmitEvent("submit"))
    }

    return (
        <div
            key={username}
            className="flex items-center justify-between space-x-4"
        >
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
                <RemixFormProvider {...form}>
                    <Form method="post" className="flex items-center space-x-4">
                        <input
                            type="hidden"
                            value={username}
                            {...form.register("username")}
                        />
                        <input
                            type="hidden"
                            name="intent"
                            value="update_role"
                        />
                        <input
                            type="hidden"
                            name="remove_user"
                            value="remove_user"
                        />

                        <Select
                            defaultValue={role}
                            name="role"
                            onValueChange={handleSelectChange}
                        >
                            <SelectTrigger className="ml-auto w-[110px]">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="owner">Eigenaar</SelectItem>
                                <SelectItem value="advisor">
                                    Adviseur
                                </SelectItem>
                                <SelectItem value="researcher">
                                    Onderzoeker
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            type="submit"
                            variant="destructive"
                            className="shrink-0"
                            name="intent"
                            value="remove_user"
                            onClick={handleRemove}
                        >
                            Verwijder
                        </Button>
                    </Form>
                </RemixFormProvider>
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

const FormSchema = z.object({
    email: z.string().email().optional(),
    username: z.string().optional(),
    role: z.enum(["owner", "advisor", "researcher"]).optional(),
    intent: z.enum(["invite_user", "update_role", "remove_user"]),
})

export async function action({ request, params }: ActionFunctionArgs) {
    try {
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw new Error("missing: b_id_farm")
        }
        const formValues = await extractFormValuesFromRequest(
            request,
            FormSchema,
        )

        const session = await getSession(request)

        if (formValues.intent === "invite_user") {
            if (!formValues.username) {
                return dataWithError(
                    null,
                    "Vul een gebruikers- of organisatieanaam in om uit te nodigen",
                )
            }
            if (!formValues.role) {
                return handleActionError("missing: role")
            }
            await grantRoleToFarm(
                fdm,
                session.user.id,
                formValues.username,
                b_id_farm,
                formValues.role,
            )

            return dataWithSuccess(null, {
                message: `${formValues.username} is uitgenodigd! 🎉`,
            })
        }

        if (formValues.intent === "update_role") {
            if (!formValues.username) {
                return handleActionError("missing: email")
            }
            if (!formValues.role) {
                return handleActionError("missing: role")
            }
            await updateRoleOfPrincipalAtFarm(
                fdm,
                session.user.id,
                b_id_farm,
                formValues.username,
                formValues.role,
            )
            return dataWithSuccess(null, {
                message: "Rol is bijgewerkt! 🎉",
            })
        }

        if (formValues.intent === "remove_user") {
            if (!formValues.username) {
                return handleActionError("missing: username")
            }
            await revokePrincipalFromFarm(
                fdm,
                session.user.id,
                b_id_farm,
                formValues.username,
            )
            return dataWithSuccess(null, {
                message: `Gebruiker ${formValues.username} is verwijderd`,
            })
        }
        throw new Error("invalid intent")
    } catch (error) {
        console.error(error)
        return dataWithError(null, "Er is iets misgegaan")
        // throw handleActionError(error)
    }
}
