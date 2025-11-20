import {
    ArrowRightLeft,
    BookOpenText,
    GitPullRequestArrow,
    Landmark,
    MapIcon,
    Scale,
} from "lucide-react"
import { NavLink, useLocation, useSearchParams } from "react-router"
import { useCalendarStore } from "@/app/store/calendar"
import { useFarmStore } from "@/app/store/farm"
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

    // Check if the page or its return page contains `farm/create` in url
    const location = useLocation()
    const [searchParams] = useSearchParams()
    const isCreateFarmWizard =
        location.pathname.includes("farm/create") ||
        searchParams.get("returnUrl")?.includes("farm/create")

    let atlasLink: string | undefined
    if (isCreateFarmWizard) {
        atlasLink = undefined
    } else if (farmId) {
        atlasLink = `/farm/${farmId}/${selectedCalendar}/atlas`
    } else {
        atlasLink = `/farm/undefined/${selectedCalendar}/atlas`
    }

    let nutrientBalanceLink: string | undefined
    if (isCreateFarmWizard) {
        nutrientBalanceLink = undefined
    } else if (farmId && farmId !== "undefined") {
        nutrientBalanceLink = `/farm/${farmId}/${selectedCalendar}/balance`
    } else {
        nutrientBalanceLink = undefined
    }

    let nutrientAdviceLink: string | undefined
    if (isCreateFarmWizard) {
        nutrientAdviceLink = undefined
    } else if (farmId && farmId !== "undefined") {
        nutrientAdviceLink = `/farm/${farmId}/${selectedCalendar}/nutrient_advice`
    } else {
        nutrientAdviceLink = undefined
    }

    let normsLink: string | undefined
    if (isCreateFarmWizard) {
        normsLink = undefined
    } else if (farmId && farmId !== "undefined") {
        normsLink = `/farm/${farmId}/${selectedCalendar}/norms`
    } else {
        normsLink = undefined
    }

    let omBalanceLink: string | undefined
    if (isCreateFarmWizard) {
        omBalanceLink = undefined
    } else if (farmId && farmId !== "undefined") {
        omBalanceLink = `/farm/${farmId}/${selectedCalendar}/balance/organic-matter`
    } else {
        omBalanceLink = undefined
    }
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
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        {nutrientAdviceLink ? (
                            <SidebarMenuButton asChild>
                                <NavLink to={nutrientAdviceLink}>
                                    <BookOpenText />
                                    <span>Bemestingsadvies</span>
                                </NavLink>
                            </SidebarMenuButton>
                        ) : (
                            <SidebarMenuButton
                                asChild
                                className="hover:bg-transparent hover:text-muted-foreground active:bg-transparent active:text-muted-foreground"
                            >
                                <span className="flex items-center gap-2 cursor-default text-muted-foreground">
                                    <BookOpenText />
                                    <span>Bemestingsadvies</span>
                                </span>
                            </SidebarMenuButton>
                        )}
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        {normsLink ? (
                            <SidebarMenuButton asChild>
                                <NavLink to={normsLink}>
                                    <Landmark />
                                    <span>Gebruiksruimte</span>
                                </NavLink>
                            </SidebarMenuButton>
                        ) : (
                            <SidebarMenuButton
                                asChild
                                className="hover:bg-transparent hover:text-muted-foreground active:bg-transparent active:text-muted-foreground"
                            >
                                <span className="flex items-center gap-2 cursor-default text-muted-foreground">
                                    <Landmark />
                                    <span>Gebruiksruimte</span>
                                </span>
                            </SidebarMenuButton>
                        )}
                    </SidebarMenuItem>                   
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}
