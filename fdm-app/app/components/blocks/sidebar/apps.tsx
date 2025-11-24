import {
    ArrowRightLeft,
    BookOpenText,
    Landmark,
    MapIcon,
    Minus,
    Plus,
} from "lucide-react"
import { NavLink, useLocation, useSearchParams } from "react-router"
import { useCalendarStore } from "@/app/store/calendar"
import { useFarmStore } from "@/app/store/farm"
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "~/components/ui/sidebar"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "~/components/ui/collapsible"

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

    let nitrogenBalanceLink: string | undefined
    if (isCreateFarmWizard) {
        nitrogenBalanceLink = undefined
    } else if (farmId && farmId !== "undefined") {
        nitrogenBalanceLink = `/farm/${farmId}/${selectedCalendar}/balance/nitrogen`
    } else {
        nitrogenBalanceLink = undefined
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
                    <Collapsible
                        defaultOpen={true}
                        className="group/collapsible"
                    >
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton>
                                    <ArrowRightLeft />
                                    <span>Balans</span>
                                    <Plus className="ml-auto group-data-[state=open]/collapsible:hidden" />
                                    <Minus className="ml-auto group-data-[state=closed]/collapsible:hidden" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    <SidebarMenuSubItem>
                                        {nitrogenBalanceLink ? (
                                            <SidebarMenuSubButton asChild>
                                                <NavLink
                                                    to={nitrogenBalanceLink}
                                                >
                                                    <span>Stikstof</span>
                                                </NavLink>
                                            </SidebarMenuSubButton>
                                        ) : (
                                            <SidebarMenuSubButton
                                                asChild
                                                className="hover:bg-transparent hover:text-muted-foreground active:bg-transparent active:text-muted-foreground"
                                            >
                                                <span className="flex items-center gap-2 cursor-default text-muted-foreground">
                                                    <span>Stikstof</span>
                                                </span>
                                            </SidebarMenuSubButton>
                                        )}
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        {omBalanceLink ? (
                                            <SidebarMenuSubButton asChild>
                                                <NavLink to={omBalanceLink}>
                                                    <span>Organische stof</span>
                                                </NavLink>
                                            </SidebarMenuSubButton>
                                        ) : (
                                            <SidebarMenuSubButton
                                                asChild
                                                className="hover:bg-transparent hover:text-muted-foreground active:bg-transparent active:text-muted-foreground"
                                            >
                                                <span className="flex items-center gap-2 cursor-default text-muted-foreground">
                                                    <span>Organische stof</span>
                                                </span>
                                            </SidebarMenuSubButton>
                                        )}
                                    </SidebarMenuSubItem>
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
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
