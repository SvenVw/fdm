import { useCalendarStore } from "@/app/store/calendar"
import { useFarmStore } from "@/app/store/farm"
import {
    ArrowRightLeft,
    GitPullRequestArrow,
    MapIcon,
    Scale,
} from "lucide-react"
import { NavLink, useLocation } from "react-router"
import { Badge } from "~/components/ui/badge"
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
} from "~/components/ui/sidebar"

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

    let nutrientBalanceLink: string | undefined
    if (isCreateFarmWizard) {
        nutrientBalanceLink = undefined
    } else if (farmId) {
        nutrientBalanceLink = `/farm/${farmId}/${selectedCalendar}/balance`
    } else {
        nutrientBalanceLink = undefined
    }

    let nutrientAdviceLink: string | undefined
    if (isCreateFarmWizard) {
        nutrientAdviceLink = undefined
    } else if (farmId) {
        nutrientAdviceLink = `/farm/${farmId}/${selectedCalendar}/nutrient_advice`
    } else {
        nutrientAdviceLink = undefined
    }

    const omBalanceLink = undefined
    const baatLink = undefined
    return (
        <SidebarGroup>
            <SidebarGroupLabel>Apps</SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    <SidebarMenuItem>
                        {atlasLink ? (
                            <SidebarMenuButton asChild>
                                <NavLink to={atlasLink}>
                                    <MapIcon />
                                    <span>Atlas</span>
                                </NavLink>
                            </SidebarMenuButton>
                        ) : (
                            <SidebarMenuButton
                                asChild
                                className="hover:bg-transparent hover:text-muted-foreground active:bg-transparent active:text-muted-foreground"
                            >
                                <span className="flex items-center gap-2 cursor-default text-muted-foreground">
                                    <MapIcon />
                                    <span>Atlas</span>
                                </span>
                            </SidebarMenuButton>
                        )}
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        {nutrientBalanceLink ? (
                            <SidebarMenuButton asChild>
                                <NavLink to={nutrientBalanceLink}>
                                    <ArrowRightLeft />
                                    <span>Nutriëntenbalans</span>
                                </NavLink>
                            </SidebarMenuButton>
                        ) : (
                            <SidebarMenuButton
                                asChild
                                className="hover:bg-transparent hover:text-muted-foreground active:bg-transparent active:text-muted-foreground"
                            >
                                <span className="flex items-center gap-2 cursor-default text-muted-foreground">
                                    <ArrowRightLeft />
                                    <span>Nutriëntenbalans</span>
                                </span>
                            </SidebarMenuButton>
                        )}
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        {nutrientAdviceLink ? (
                            <SidebarMenuButton asChild>
                                <NavLink to={nutrientAdviceLink}>
                                    <ArrowRightLeft />
                                    <span>Bemestingsadvies</span>
                                </NavLink>
                            </SidebarMenuButton>
                        ) : (
                            <SidebarMenuButton
                                asChild
                                className="hover:bg-transparent hover:text-muted-foreground active:bg-transparent active:text-muted-foreground"
                            >
                                <span className="flex items-center gap-2 cursor-default text-muted-foreground">
                                    <ArrowRightLeft />
                                    <span>Bemestingsadvies</span>
                                </span>
                            </SidebarMenuButton>
                        )}
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        {omBalanceLink ? (
                            <SidebarMenuButton asChild>
                                <NavLink to={omBalanceLink}>
                                    <Scale />
                                    <span>OS Balans</span>
                                </NavLink>
                            </SidebarMenuButton>
                        ) : (
                            <SidebarMenuButton
                                asChild
                                className="hover:bg-transparent hover:text-muted-foreground active:bg-transparent active:text-muted-foreground"
                            >
                                <span className="flex items-center gap-2 cursor-default text-muted-foreground">
                                    <Scale />
                                    <span>OS Balans</span>
                                </span>
                            </SidebarMenuButton>
                        )}
                        <SidebarMenuBadge>
                            <Badge>Binnenkort</Badge>
                        </SidebarMenuBadge>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        {baatLink ? (
                            <SidebarMenuButton asChild>
                                <NavLink to={baatLink}>
                                    <GitPullRequestArrow />
                                    <span>BAAT</span>
                                </NavLink>
                            </SidebarMenuButton>
                        ) : (
                            <SidebarMenuButton
                                asChild
                                className="hover:bg-transparent hover:text-muted-foreground active:bg-transparent active:text-muted-foreground"
                            >
                                <span className="flex items-center gap-2 cursor-default text-muted-foreground">
                                    <GitPullRequestArrow />
                                    <span>BAAT</span>
                                </span>
                            </SidebarMenuButton>
                        )}
                        <SidebarMenuBadge>
                            <Badge>Binnenkort</Badge>
                        </SidebarMenuBadge>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}
