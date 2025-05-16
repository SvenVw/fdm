import {
    cancelPendingInvitation,
    getOrganization,
    getOrganizationsForUser,
    getPendingInvitationsForOrganization,
    getUsersInOrganization,
    inviteUserToOrganization,
    removeUserFromOrganization,
    updateRoleOfUserAtOrganization,
} from "@svenvw/fdm-core"
import { formatDistanceToNow } from "date-fns"
import { nl } from "date-fns/locale"
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router"
import { NavLink, useLoaderData } from "react-router-dom"
import { dataWithError, dataWithSuccess } from "remix-toast"
import { z } from "zod"
import { FarmTitle } from "~/components/custom/farm/farm-title"
import { Badge } from "~/components/ui/badge"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "~/components/ui/breadcrumb"
import { Button } from "~/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { Separator } from "~/components/ui/separator"
import { SidebarTrigger } from "~/components/ui/sidebar"
import { getSession } from "~/lib/auth.server"
import { handleActionError, handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { extractFormValuesFromRequest } from "~/lib/form"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Input } from "../components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select"
import { serverConfig } from "../lib/config.server"
import { renderInvitationEmail, sendEmail } from "../lib/email.server"

export async function loader({ request, params }: LoaderFunctionArgs) {
    if (!params.slug) {
        throw handleLoaderError("not found: organization")
    }

    const session = await getSession(request)
    const organization = await getOrganization(
        fdm,
        params.slug,
        session.user.id,
    )

    if (!organization) {
        throw handleLoaderError("not found: organization")
    }

    // Get members of organization
    const members = await getUsersInOrganization(fdm, params.slug)

    // Get pending invitations of organization
    const invitations = await getPendingInvitationsForOrganization(
        fdm,
        organization.id,
    )

    return {
        organization: organization,
        invitations: invitations,
        members: members,
    }
}

export default function OrganizationIndex() {
    const { organization, invitations, members } =
        useLoaderData<typeof loader>()
    const permissions = organization.permissions

    return (
        <main className="container">           
            <div className="max-w-3xl mx-auto px-4">
                {/* Changed this div to a flex container with justify-between */}
                <div className="mb-8 flex items-center justify-between">
                    <FarmTitle
                        title={organization.name}
                        description={organization.description || ""}
                    />
                </div>
                <div className="grid lg:grid-cols-1 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Leden</CardTitle>
                            <CardDescription>
                                Zie wie er onderdeel uitmaakt van deze
                                organisatie.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Separator className="my-4" />
                            <div className="space-y-4">
                                <div className="text-sm font-medium">
                                    {/* People with access */}
                                </div>
                                <div className="grid gap-6">
                                    {members.map((member) => (
                                        <MemberRow
                                            key={member.id}
                                            member={member}
                                            permissions={permissions}
                                            slug={organization.slug}
                                        />
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    {permissions.canInvite ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>Uitnodigingen</CardTitle>
                                <CardDescription>
                                    Nodig nieuwe leden uit en zie welke
                                    uitnodigingen nog open staan.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <InvitationForm
                                    organizationId={organization.id}
                                />
                                <Separator className="my-4" />
                                <div className="space-y-4">
                                    <div className="text-sm font-medium">
                                        Openstaande uitnodigingen:
                                    </div>
                                    {invitations.length === 0 ? (
                                        <div className="text-sm text-muted-foreground">
                                            <p className="text-sm text-center text-muted-foreground">
                                                Er zijn op dit moment geen
                                                openstaande uitnodigingen.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-6">
                                            {invitations.map((invitation) => (
                                                <InvitationRow
                                                    key={
                                                        invitation.invitation_id
                                                    }
                                                    invitation={invitation}
                                                    permissions={permissions}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ) : null}
                </div>
            </div>
        </main>
    )
}

const MemberRow = ({
    member,
    permissions,
}: {
    member: {
        id: string
        firstname: string
        surname: string
        email: string
        role: string
        image: string
    }
    permissions: {
        canEdit: boolean
        canDelete: boolean
        canInvite: boolean
        canUpdateRoleUser: boolean
        canRemoveUser: boolean
    }
}) => {
    const initials = member.firstname.charAt(0) + member.surname.charAt(0)
    return (
        <div
            key={member.email}
            className="flex items-center justify-between space-x-4"
        >
            <div className="flex items-center space-x-4">
                <Avatar>
                    <AvatarImage src={member.image} />
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-sm font-medium leading-none">
                        {member.firstname} {member.surname}
                    </p>
                    {!permissions.canUpdateRoleUser ? (
                        <p className="text-sm text-muted-foreground">
                            {member.role}
                        </p>
                    ) : null}
                </div>
            </div>
            {permissions.canUpdateRoleUser ? (
                <MemberAction member={member} permissions={permissions} />
            ) : null}
        </div>
    )
}

const MemberAction = ({
    member,
    permissions,
}: {
    member: {
        firstname: string
        surname: string
        email: string
        role: string
        image: string
    }
    permissions: {
        canEdit: boolean
        canDelete: boolean
        canInvite: boolean
        canUpdateRoleUser: boolean
        canRemoveUser: boolean
    }
}) => {
    return (
        <form method="post" className="flex items-center space-x-4">
            <input type="hidden" name="email" value={member.email} />
            <Select defaultValue={member.role} name="role">
                <SelectTrigger className="ml-auto w-[110px]">
                    <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                </SelectContent>
            </Select>
            {permissions.canRemoveUser ? (
                <Button
                    variant="destructive"
                    className="shrink-0"
                    name="intent"
                    value="remove_user"
                >
                    Verwijder
                </Button>
            ) : null}
            <Button
                type="submit"
                className="shrink-0"
                name="intent"
                value="update_role"
            >
                Bijwerken
            </Button>
        </form>
    )
}

const InvitationRow = ({
    invitation,
}: {
    invitation: {
        email: string
        role: string
        expires_at: Date
        inviter_firstname: string
        inviter_surname: string
        invitation_id: string
    }
}) => {
    return (
        <div
            key={invitation.invitation_id}
            className="flex items-center justify-between space-x-4"
        >
            <div className="flex items-center space-x-4">
                <Avatar>
                    <AvatarFallback>
                        {invitation.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-sm font-medium leading-none">
                        {invitation.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {invitation.role}
                    </p>
                </div>
            </div>
            <div>
                <p className="text-sm font-medium leading-none">
                    Verloopt{" "}
                    {formatDistanceToNow(invitation.expires_at, {
                        addSuffix: true,
                        locale: nl,
                    })}
                </p>
                <p className="text-sm text-muted-foreground">
                    {`Uitgenodigd door: ${invitation.inviter_firstname} ${invitation.inviter_surname}`}
                </p>
            </div>
            <form method="post">
                <input
                    type="hidden"
                    name="invitation_id"
                    value={invitation.invitation_id}
                />
                <Button
                    variant="destructive"
                    className="shrink-0"
                    name="intent"
                    value="cancel_invite"
                >
                    Annuleer
                </Button>
            </form>
        </div>
    )
}

const InvitationForm = ({ organizationId }: { organizationId: string }) => {
    return (
        <form method="post" className="flex space-x-2">
            <input
                type="hidden"
                name="organization_id"
                value={organizationId}
            />
            <Input
                type="email"
                placeholder="Vul een emailadres in"
                name="email"
            />
            <Select defaultValue="member" name="role">
                <SelectTrigger className="ml-auto w-[110px]">
                    <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
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

const FormSchema = z.object({
    email: z.string().email().optional(),
    role: z.enum(["owner", "admin", "member"]).optional(),
    user_id: z.string().optional(),
    invitation_id: z.string().optional(),
    organization_id: z.string().optional(),
    intent: z.enum([
        "invite_user",
        "update_role",
        "remove_user",
        "cancel_invite",
    ]),
})

export async function action({ request, params }: ActionFunctionArgs) {
    try {
        if (!params.slug) {
            throw handleActionError("not found: organization")
        }
        const formValues = await extractFormValuesFromRequest(
            request,
            FormSchema,
        )
        const session = await getSession(request)
        const organization = await getOrganization(
            fdm,
            params.slug,
            session.user.id,
        )
        if (!organization) {
            throw handleActionError("not found: organization")
        }

        if (formValues.intent === "invite_user") {
            if (!formValues.email) {
                return dataWithError(
                    null,
                    "Vul een e-mailadres in om iemand uit te nodigen",
                )
            }
            if (!formValues.role) {
                return handleActionError("missing: role")
            }
            await inviteUserToOrganization(
                fdm,
                session.user.id,
                formValues.email,
                formValues.role,
                organization.id,
            )
            const invitationEmail = await renderInvitationEmail(
                formValues.email,
                {
                    firstname: session.user.firstname,
                    surname: session.user.surname,
                },
                organization.name,
            )
            await sendEmail(invitationEmail)

            return dataWithSuccess(null, {
                message: `Gebruiker ${formValues.email} is uitgenodigd! 🎉`,
            })
        }
        if (formValues.intent === "update_role") {
            if (!formValues.email) {
                return handleActionError("missing: email")
            }
            if (!formValues.role) {
                return handleActionError("missing: role")
            }
            await updateRoleOfUserAtOrganization(
                fdm,
                session.user.id,
                organization.id,
                formValues.email,
                formValues.role,
            )
            return dataWithSuccess(null, {
                message: "Rol is bijgewerkt! 🎉",
            })
        }
        if (formValues.intent === "remove_user") {
            if (!formValues.email) {
                return handleActionError("missing: email")
            }
            await removeUserFromOrganization(
                fdm,
                session.user.id,
                organization.id,
                formValues.email,
            )
            return dataWithSuccess(null, {
                message: `Gebruiker ${formValues.email} is verwijderd`,
            })
        }
        if (formValues.intent === "cancel_invite") {
            if (!formValues.invitation_id)
                throw new Error("invalid invitation_id")
            await cancelPendingInvitation(
                fdm,
                formValues.invitation_id,
                session.user.id,
            )
            return dataWithSuccess(null, {
                message: `Uitnodiging voor ${formValues.email} is ingetrokken`,
            })
        }
        throw new Error("invalid intent")
    } catch (error) {
        throw handleActionError(error)
    }
}
