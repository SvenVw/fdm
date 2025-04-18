// Show on this page the details of an organization. Start with the name and description, which might later be expanded with other information. Add a section that show the users that are part of the organization and their role. If the user is the admin or owner of the organization it should be able to alter the role of the user or to remove the user from the organization. Add another section that shows the current invites that are pending for this organization. Make it also possible to invite a new user by providing their email

import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router"
import { NavLink, useLoaderData } from "react-router-dom"
import {
    getOrganizationsForUser,
    getPendingInvitationsForOrganization,
    getPendingInvitationsforUser,
    getUsersInOrganization,
    inviteUserToOrganization,
    updateRoleInOrganization,
    removeUserFromOrganization,
    revokeInvitation,
} from "@svenvw/fdm-core"
import { Button } from "~/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { getSession } from "~/lib/auth.server"
import { fdm } from "~/lib/fdm.server"
import { Badge } from "~/components/ui/badge"
import { SidebarTrigger } from "~/components/ui/sidebar"
import { Separator } from "~/components/ui/separator"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "~/components/ui/breadcrumb"
import { FarmTitle } from "~/components/custom/farm/farm-title"
import { handleActionError, handleLoaderError } from "~/lib/error"
import { Input } from "../components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select"
import { formatDistanceToNow } from "date-fns"
import { nl } from "date-fns/locale"
import { extractFormValuesFromRequest } from "~/lib/form"
import { z } from "zod"
import { dataWithSuccess } from "remix-toast"
import { renderInvitationEmail, sendEmail } from "../lib/email.server"
import { serverConfig } from "../lib/config.server"

export async function loader({ request, params }: LoaderFunctionArgs) {
    const session = await getSession(request)
    const organizations = await getOrganizationsForUser(fdm, session.user.id)
    const organization = organizations.find((x) => x.slug === params.slug)

    if (!organization || !params.slug) {
        throw handleLoaderError("not found: organization")
    }

    // Get members of organization
    const members = await getUsersInOrganization(fdm, params.slug)

    // Check organization permissions
    const permissions = {
        canEdit: organization.role === "owner" || organization.role === "admin",
        canDelete: organization.role === "owner",
        canInvite:
            organization.role === "owner" || organization.role === "admin",
        canUpdateRoleUser:
            organization.role === "owner" || organization.role === "admin",
        canRemoveUser:
            organization.role === "owner" || organization.role === "admin",
    }

    // Get pending invitations of organization
    const invitations = await getPendingInvitationsForOrganization(
        fdm,
        organization.organization_id,
    )

    return {
        organization: organization,
        invitations: invitations,
        members: members,
        permissions: permissions,
    }
}

export default function OrganizationIndex() {
    const { organization, invitations, members, permissions } =
        useLoaderData<typeof loader>()

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
                            {organization.name}
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>
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
                                    organizationId={
                                        organization.organization_id
                                    }
                                />
                                <Separator className="my-4" />
                                <div className="space-y-4">
                                    <div className="text-sm font-medium">
                                        Openstaande uitnodigingen:
                                    </div>
                                    <div className="grid gap-6">
                                        {invitations.map((invitation) => (
                                            <InvitationRow
                                                key={invitation.invitation_id}
                                                invitation={invitation}
                                                permissions={permissions}
                                            />
                                        ))}
                                    </div>
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
        initials: string
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
        <div className="flex items-center justify-between space-x-4">
            <div className="flex items-center space-x-4">
                <Avatar>
                    <AvatarImage src={member.image} />
                    <AvatarFallback>{member.initials}</AvatarFallback>
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
        id: string
        firstname: string
        surname: string
        email: string
        role: string
        image: string
        initials: string
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
            <input type="hidden" name="user_id" value={member.id} />
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
        <div className="flex items-center justify-between space-x-4">
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
                    value="revoke_invite"
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
    email: z.string().email(),
    role: z.enum(["owner", "admin", "member"]),
    user_id: z.string().optional(),
    invitation_id: z.string().optional(),
    organization_id: z.string(),
    intent: z.enum([
        "invite_user",
        "update_role",
        "remove_user",
        "revoke_invite",
    ]),
})

export async function action({ request, params }: ActionFunctionArgs) {
    try {
        const formValues = await extractFormValuesFromRequest(
            request,
            FormSchema,
        )
        const session = await getSession(request)
        const organizations = await getOrganizationsForUser(
            fdm,
            session.user.id,
        )
        const organization = organizations.find((x) => x.slug === params.slug)
        if (!organization || !params.slug) {
            throw handleActionError("not found: organization")
        }

        if (formValues.intent === "invite_user") {
            const invitation_id = await inviteUserToOrganization(
                fdm,
                session.user.id,
                formValues.email,
                formValues.role,
                formValues.organization_id,
            )
            const acceptUrl = `${serverConfig.url}/organization/${params.slug}/invitation/${invitation_id}`
            const rejectUrl = `${serverConfig.url}/organization/${params.slug}/invitation/${invitation_id}/reject`

            const invitationEmail = await renderInvitationEmail(
                formValues.email,
                {
                    firstname: session.user.firstname,
                    surname: session.user.surname,
                },
                organization.name,
                acceptUrl,
                rejectUrl,
            )
            await sendEmail(invitationEmail)

            return dataWithSuccess(null, {
                message: `Gebruiker ${formValues.email} is uitgenodigd! 🎉`,
            })
        }
        if (formValues.intent === "update_role") {
            await updateRoleInOrganization(
                fdm,
                params.slug,
                formValues.user_id,
                formValues.role,
            )
            return dataWithSuccess(null, {
                message: "Rol is bijgewerkt! 🎉",
            })
        }
        if (formValues.intent === "remove_user") {
            await removeUserFromOrganization(
                fdm,
                session.user.id,
                formValues.organization_id,
                formValues.email,
            )
            return dataWithSuccess(null, {
                message: `Gebruiker ${formValues.email} is verwijderd`,
            })
        }
        if (formValues.intent === "revoke_invite") {
            await revokeInvitation(fdm, formValues.invitation_id)
            return dataWithSuccess(null, {
                message: `Uitnodiging voor ${formValues.email} is ingetrokken`,
            })
        }
        throw new Error("invalid intent")
    } catch (error) {
        throw handleActionError(error)
    }
}
