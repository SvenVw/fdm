import { ArrowRightLeft, GitPullRequestArrow, Scale } from "lucide-react"
import { NavLink } from "react-router"
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
} from "~/components/ui/sidebar"
import { Badge } from "~/components/ui/badge"

export function SidebarApps() {
    const nutrienBalanceLink = undefined
    const omBalanceLink = undefined
    const baatLink = undefined

    return (
        <SidebarGroup>
            <SidebarGroupLabel>Apps</SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            {nutrienBalanceLink ? (
                                <NavLink to={nutrienBalanceLink}>
                                    <ArrowRightLeft />
                                    <span>Nutriëntenbalans</span>
                                </NavLink>
                            ) : (
                                <span className="flex items-center gap-2 cursor-default text-muted-foreground">
                                    <ArrowRightLeft />
                                    <span>Nutriëntenbalans</span>
                                </span>
                            )}
                        </SidebarMenuButton>
                        <SidebarMenuBadge>
                            <Badge>Binnenkort</Badge>
                        </SidebarMenuBadge>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            {omBalanceLink ? (
                                <NavLink to={omBalanceLink}>
                                    <Scale />
                                    <span>OS Balans</span>
                                </NavLink>
                            ) : (
                                <span className="flex items-center gap-2 cursor-default text-muted-foreground">
                                    <Scale />
                                    <span>OS Balans</span>
                                </span>
                            )}
                        </SidebarMenuButton>
                        <SidebarMenuBadge>
                            <Badge>Binnenkort</Badge>
                        </SidebarMenuBadge>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            {baatLink ? (
                                <NavLink to={baatLink}>
                                    <GitPullRequestArrow />
                                    <span>BAAT</span>
                                </NavLink>
                            ) : (
                                <span className="flex items-center gap-2 cursor-default text-muted-foreground">
                                    <GitPullRequestArrow />
                                    <span>BAAT</span>
                                </span>
                            )}
                        </SidebarMenuButton>
                        <SidebarMenuBadge>
                            <Badge>Binnenkort</Badge>
                        </SidebarMenuBadge>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}
