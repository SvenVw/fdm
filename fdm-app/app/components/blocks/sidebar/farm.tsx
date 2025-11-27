import type { getFarm } from "@svenvw/fdm-core"
import {
    Calendar,
    Check,
    ChevronRight,
    House,
    Shapes,
    Sprout,
    Square,
} from "lucide-react"
import { useState } from "react"
import { NavLink, useLocation, useSearchParams } from "react-router"
import { getCalendarSelection } from "@/app/lib/calendar"
import { useCalendarStore } from "@/app/store/calendar"
import { useFarmStore } from "@/app/store/farm"
import { Badge } from "~/components/ui/badge"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "~/components/ui/collapsible"
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

export function SidebarFarm({
    farm,
}: {
    farm: Awaited<ReturnType<typeof getFarm>> | undefined
}) {
    function getSuperiorRole(allRoles: ("owner" | "advisor" | "researcher")[]) {
        if (allRoles.length > 0) {
            const ordering = ["owner", "advisor", "researcher"] as const
            const sorted = [...allRoles].sort(
                (a, b) => ordering.indexOf(a) - ordering.indexOf(b),
            )
            return sorted[0]
        }
        return null
    }

    const farmId = useFarmStore((state) => state.farmId)

    const selectedCalendar = useCalendarStore((state) => state.calendar)
    const setCalendar = useCalendarStore((state) => state.setCalendar)
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)
    const calendarSelection = getCalendarSelection()

    const location = useLocation()
    const [searchParams] = useSearchParams()
    // Check if the page or its return page contains `farm/create` in url
    const isCreateFarmWizard =
        location.pathname.includes("farm/create") ||
        searchParams.get("returnUrl")?.includes("farm/create")
    const farmRole = farm ? getSuperiorRole(farm.roles) : null
    // Set the farm link
    let farmLink: string
    let farmLinkDisplay: string
    if (isCreateFarmWizard) {
        farmLink = "/farm"
        farmLinkDisplay = "Terug naar bedrijven"
    } else if (farmId && farmId !== "undefined") {
        farmLink = `/farm/${farmId}`
        farmLinkDisplay = farm?.b_name_farm ? farm.b_name_farm : "Bedrijf"
    } else {
        farmLink = "/farm"
        farmLinkDisplay = "Overzicht bedrijven"
    }

    let fieldsLink: string | undefined
    if (isCreateFarmWizard) {
        fieldsLink = undefined
    } else if (farmId && farmId !== "undefined") {
        fieldsLink = `/farm/${farmId}/${selectedCalendar}/field`
    } else {
        fieldsLink = undefined
    }

    let rotationLink: string | undefined
    if (isCreateFarmWizard) {
        rotationLink = undefined
    } else if (farmId && farmId !== "undefined") {
        rotationLink = `/farm/${farmId}/${selectedCalendar}/rotation`
    } else {
        rotationLink = undefined
    }

    let fertilizersLink: string | undefined
    if (farmId && farmId !== "undefined") {
        fertilizersLink = `/farm/${farmId}/fertilizers`
    } else {
        fertilizersLink = undefined
    }

    return (
        <SidebarGroup>
            <SidebarGroupLabel>Bedrijf</SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={
                                location.pathname === farmLink ||
                                location.pathname.includes(
                                    `/farm/${farmId}/settings`,
                                )
                            }
                        >
                            <NavLink to={farmLink}>
                                <House />
                                <span className="truncate">
                                    {farmLinkDisplay}
                                </span>
                                {farmRole && (
                                    <Badge
                                        key={farmRole}
                                        variant="outline"
                                        className="ml-auto"
                                    >
                                        {farmRole === "owner"
                                            ? "Eigenaar"
                                            : farmRole === "advisor"
                                              ? "Adviseur"
                                              : farmRole === "researcher"
                                                ? "Onderzoeker"
                                                : "Onbekend"}
                                    </Badge>
                                )}
                            </NavLink>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    {/* Conditionally render the Kalender item */}
                    {farmId && !isCreateFarmWizard ? (
                        <Collapsible
                            asChild
                            defaultOpen={false}
                            className="group/collapsible"
                            onOpenChange={setIsCalendarOpen}
                        >
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton
                                        tooltip={"Kalender"}
                                        className="flex items-center"
                                    >
                                        <Calendar />
                                        <span>Kalender </span>
                                        {!isCalendarOpen && (
                                            <Badge className="ml-1">
                                                {selectedCalendar === "all"
                                                    ? "Alle jaren"
                                                    : selectedCalendar}
                                            </Badge>
                                        )}
                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        {calendarSelection?.map((item) => {
                                            // Construct the new URL with the selected calendar
                                            const newUrl =
                                                location.pathname.replace(
                                                    /\/(\d{4}|all)/,
                                                    `/${item}`,
                                                )
                                            return (
                                                <SidebarMenuSubItem
                                                    key={item}
                                                    className={
                                                        selectedCalendar ===
                                                        item
                                                            ? "bg-accent text-accent-foreground"
                                                            : ""
                                                    }
                                                >
                                                    <SidebarMenuSubButton
                                                        asChild
                                                        onClick={() =>
                                                            setCalendar(item)
                                                        }
                                                    >
                                                        <NavLink
                                                            to={newUrl}
                                                            className="flex items-center"
                                                        >
                                                            <span>
                                                                {item === "all"
                                                                    ? "Alle jaren"
                                                                    : item}
                                                            </span>
                                                            {selectedCalendar ===
                                                                item && (
                                                                <Check className="ml-auto h-4 w-4" />
                                                            )}
                                                        </NavLink>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            )
                                        })}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                    ) : (
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                className="hover:bg-transparent hover:text-muted-foreground active:bg-transparent active:text-muted-foreground"
                            >
                                <span className="flex items-center gap-2 cursor-default text-muted-foreground">
                                    <Calendar />
                                    <span>Kalender</span>
                                </span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )}
                    <SidebarMenuItem>
                        {fieldsLink ? (
                            <SidebarMenuButton
                                asChild
                                isActive={location.pathname.includes(
                                    fieldsLink,
                                )}
                            >
                                <NavLink to={fieldsLink}>
                                    <Square />
                                    <span>Percelen</span>
                                </NavLink>
                            </SidebarMenuButton>
                        ) : (
                            <SidebarMenuButton
                                asChild
                                className="hover:bg-transparent hover:text-muted-foreground active:bg-transparent active:text-muted-foreground"
                            >
                                <span className="flex items-center gap-2 cursor-default text-muted-foreground">
                                    <Square />
                                    <span>Percelen</span>
                                </span>
                            </SidebarMenuButton>
                        )}
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        {rotationLink ? (
                            <SidebarMenuButton
                                asChild
                                isActive={location.pathname.includes(
                                    rotationLink,
                                )}
                            >
                                <NavLink to={rotationLink}>
                                    <Sprout />
                                    <span>Bouwplan</span>
                                </NavLink>
                            </SidebarMenuButton>
                        ) : (
                            <SidebarMenuButton
                                asChild
                                className="hover:bg-transparent hover:text-muted-foreground active:bg-transparent active:text-muted-foreground"
                            >
                                <span className="flex items-center gap-2 cursor-default text-muted-foreground">
                                    <Sprout />
                                    <span>Bouwplan</span>
                                </span>
                            </SidebarMenuButton>
                        )}
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        {fertilizersLink ? (
                            <SidebarMenuButton
                                asChild
                                isActive={location.pathname.includes(
                                    fertilizersLink,
                                )}
                            >
                                <NavLink to={fertilizersLink}>
                                    <Shapes />
                                    <span>Meststoffen</span>
                                </NavLink>
                            </SidebarMenuButton>
                        ) : (
                            <SidebarMenuButton
                                asChild
                                className="hover:bg-transparent hover:text-muted-foreground active:bg-transparent active:text-muted-foreground"
                            >
                                <span className="flex items-center gap-2 cursor-default text-muted-foreground">
                                    <Shapes />
                                    <span>Meststoffen</span>
                                </span>
                            </SidebarMenuButton>
                        )}
                    </SidebarMenuItem>
                    {/* <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <NavLink to="./stable">
                                        <PawPrint />
                                        <span>Stal & dieren</span>
                                    </NavLink>
                                </SidebarMenuButton>
                            </SidebarMenuItem> */}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}
