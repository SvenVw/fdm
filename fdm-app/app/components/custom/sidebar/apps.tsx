import { ArrowRightLeft, GitPullRequestArrow, MapIcon, Scale } from "lucide-react"
import { NavLink, useLocation } from "react-router"
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
import { useFarmStore } from "@/app/store/farm"
import { useCalendarStore } from "@/app/store/calendar"

export function SidebarApps() {
    const farmId = useFarmStore((state) => state.farmId)
    const selectedCalendar = useCalendarStore((state) => state.calendar)

    // Check if page contains `farm/create` in url
    const location = useLocation()
    const isCreateFarmWizard = location.pathname.includes("farm/create")

    let atlasLink: string | undefined
    if (isCreateFarmWizard) {
        atlasLink = undefined
    } else if (farmId) {
        atlasLink = `/farm/${farmId}/${selectedCalendar}/atlas`
    } else {
        atlasLink = undefined
    }

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
                            {atlasLink ? (
                                <NavLink to={atlasLink}>
                                    <MapIcon />
                                    <span>Atlas</span>
                                </NavLink>
                            ) : (
                                <span className="flex items-center gap-2 cursor-default text-muted-foreground">
                                    <MapIcon />
                                    <span>Atlas</span>
                                </span>
                            )}
                        </SidebarMenuButton>
                    </SidebarMenuItem>
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
