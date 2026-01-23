import type { Organization } from "better-auth/plugins"
import { Building, Cog, House, Mail, Users } from "lucide-react"
import { NavLink, useLocation } from "react-router"
import { Badge } from "~/components/ui/badge"
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "~/components/ui/sidebar"

export function SidebarOrganization({
    organization,
    roles,
}: {
    organization?: Organization
    roles?: ("owner" | "admin" | "member" | "viewer")[]
}) {
    function getSuperiorRole(
        allRoles: ("owner" | "admin" | "member" | "viewer")[],
    ) {
        if (allRoles.length > 0) {
            const ordering = ["owner", "admin", "member", "viewer"] as const
            const sorted = [...allRoles].sort(
                (a, b) => ordering.indexOf(a) - ordering.indexOf(b),
            )
            return sorted[0]
        }
        return null
    }

    const location = useLocation()

    const organizationRole = roles?.length ? getSuperiorRole(roles) : null
    // Set the farm link
    let organizationLink: string
    let organizationLinkDisplay: string
    if (organization?.slug) {
        organizationLink = `/organization/${organization.slug}`
        organizationLinkDisplay = organization?.name
            ? organization.name
            : "Organisatie"
    } else {
        organizationLink = "/organization"
        organizationLinkDisplay = "Organisatie Dashboard"
    }

    return (
        <>
            <SidebarGroup>
                <SidebarGroupLabel>Organisaties</SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={location.pathname === "/organization"}
                            >
                                <NavLink to={"/organization"}>
                                    <Users />
                                    <span>Overzicht</span>
                                </NavLink>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={location.pathname.includes(
                                    "/organization/invitations",
                                )}
                            >
                                <NavLink to={"/organization/invitations"}>
                                    <Mail />
                                    <span>Uitnodigingen</span>
                                </NavLink>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
                <SidebarGroupContent>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            {organization ? (
                                <SidebarMenuButton
                                    asChild
                                    isActive={
                                        location.pathname === organizationLink
                                    }
                                >
                                    <NavLink to={organizationLink}>
                                        <Building />
                                        <span className="truncate">
                                            {organizationLinkDisplay}
                                        </span>
                                        {organizationRole && (
                                            <Badge
                                                key={organizationRole}
                                                variant="outline"
                                                className="ml-auto"
                                            >
                                                {
                                                    {
                                                        owner: "Eigenaar",
                                                        admin: "Admin",
                                                        member: "Lid",
                                                        viewer: "Kijker",
                                                    }[organizationRole]
                                                }
                                            </Badge>
                                        )}
                                    </NavLink>
                                </SidebarMenuButton>
                            ) : (
                                <SidebarMenuButton
                                    asChild
                                    className="hover:bg-transparent hover:text-muted-foreground active:bg-transparent active:text-muted-foreground"
                                >
                                    <span className="flex items-center gap-2 cursor-default text-muted-foreground">
                                        <Building />
                                        <span>Kies een organisatie</span>
                                    </span>
                                </SidebarMenuButton>
                            )}
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            {organization ? (
                                <SidebarMenuButton
                                    asChild
                                    isActive={location.pathname.includes(
                                        "/settings",
                                    )}
                                >
                                    <NavLink
                                        to={`/organization/${organization.slug}/settings`}
                                    >
                                        <Cog />
                                        <span>Instellingen</span>
                                    </NavLink>
                                </SidebarMenuButton>
                            ) : (
                                <SidebarMenuButton
                                    asChild
                                    className="hover:bg-transparent hover:text-muted-foreground active:bg-transparent active:text-muted-foreground"
                                >
                                    <span className="flex items-center gap-2 cursor-default text-muted-foreground">
                                        <Cog />
                                        <span>Instellingen</span>
                                    </span>
                                </SidebarMenuButton>
                            )}
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            {organization ? (
                                <SidebarMenuButton
                                    asChild
                                    isActive={location.pathname.includes(
                                        "/members",
                                    )}
                                >
                                    <NavLink
                                        to={`/organization/${organization.slug}/members`}
                                    >
                                        <Users />
                                        <span>Leden</span>
                                    </NavLink>
                                </SidebarMenuButton>
                            ) : (
                                <SidebarMenuButton
                                    asChild
                                    className="hover:bg-transparent hover:text-muted-foreground active:bg-transparent active:text-muted-foreground"
                                >
                                    <span className="flex items-center gap-2 cursor-default text-muted-foreground">
                                        <Users />
                                        <span>Leden</span>
                                    </span>
                                </SidebarMenuButton>
                            )}
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            {organization ? (
                                <SidebarMenuButton
                                    asChild
                                    isActive={location.pathname.includes(
                                        "/farms",
                                    )}
                                >
                                    <NavLink
                                        to={`/organization/${organization.slug}/farms`}
                                    >
                                        <House />
                                        <span>Bedrijven</span>
                                    </NavLink>
                                </SidebarMenuButton>
                            ) : (
                                <SidebarMenuButton
                                    asChild
                                    className="hover:bg-transparent hover:text-muted-foreground active:bg-transparent active:text-muted-foreground"
                                >
                                    <span className="flex items-center gap-2 cursor-default text-muted-foreground">
                                        <House />
                                        <span>Bedrijven</span>
                                    </span>
                                </SidebarMenuButton>
                            )}
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        </>
    )
}
