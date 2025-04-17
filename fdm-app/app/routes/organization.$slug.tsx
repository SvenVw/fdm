// Show on this page the details of an organization. Start with the name and description, which might later be expanded with other information. Add a section that show the users that are part of the organization and their role. If the user is the admin or owner of the organization it should be able to alter the role of the user or to remove the user from the organization. Add another section that shows the current invites that are pending for this organization. Make it also possible to invite a new user by providing their email

import type { LoaderFunctionArgs } from "react-router"
import { NavLink, useLoaderData } from "react-router-dom"
import {
    getOrganizationsForUser,
    getPendingInvitationsForOrganization,
    getPendingInvitationsforUser,
    getUsersInOrganization,
} from "@svenvw/fdm-core"
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
import { handleLoaderError } from "~/lib/error"
import { Input } from "../components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select"

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
    const { organization, invitations, members, permissions } = useLoaderData()

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
                                        <div
                                            key={member.id}
                                            className="flex items-center justify-between space-x-4"
                                        >
                                            <div className="flex items-center space-x-4">
                                                <Avatar>
                                                    <AvatarImage
                                                        src={member.image}
                                                    />
                                                    <AvatarFallback>
                                                        {member.initials}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-medium leading-none">
                                                        {member.firstname}{" "}
                                                        {member.surname}
                                                    </p>
                                                    {/* <p className="text-sm text-muted-foreground"></p> */}
                                                </div>
                                            </div>
                                            {!permissions.canUpdateRoleUser ? (
                                                <Select
                                                    defaultValue={member.role}
                                                >
                                                    <SelectTrigger className="ml-auto w-[110px]">
                                                        <SelectValue placeholder="Select" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="owner">
                                                            Owner
                                                        </SelectItem>
                                                        <SelectItem value="admin">
                                                            Admin
                                                        </SelectItem>
                                                        <SelectItem value="member">
                                                            Member
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <Badge variant="secondary">
                                                    {member.role}
                                                </Badge>
                                            )}
                                        </div>
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
                                    Zie wie er is uitgenodigd voor de
                                    organisatie.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex space-x-2">
                                    <Input
                                        type="email"
                                        placeholder="Vul een emailadres in"
                                    />
                                    <Select defaultValue="member">
                                        <SelectTrigger className="ml-auto w-[110px]">
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="owner">
                                                Owner
                                            </SelectItem>
                                            <SelectItem value="admin">
                                                Admin
                                            </SelectItem>
                                            <SelectItem value="member">
                                                Member
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="default"
                                        className="shrink-0"
                                    >
                                        Uitnodigen
                                    </Button>
                                </div>
                                <Separator className="my-4" />
                                <div className="space-y-4">
                                    <div className="text-sm font-medium">
                                        People with access
                                    </div>
                                    <div className="grid gap-6">
                                        {invitations.map((invitation) => (
                                            <div
                                                key={invitation.id}
                                                className="flex items-center justify-between space-x-4"
                                            >
                                                <div className="flex items-center space-x-4">
                                                    <Avatar>
                                                        {/* <AvatarImage src="/avatars/03.png" /> */}
                                                        <AvatarFallback>
                                                            {invitation.email
                                                                .charAt(0)
                                                                .toUpperCase()}
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
                                                {invitation.expires_at}
                                                <Button>
                                                    Annuleer uitnodiging
                                                </Button>
                                            </div>
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
