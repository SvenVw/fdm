import { getCalendarSelection } from "@/app/lib/calendar"
import { useCalendarStore } from "@/app/store/calendar"
import { useFarmStore } from "@/app/store/farm"
import {
    Calendar,
    Check,
    ChevronRight,
    House,
    Shapes,
    Square,
} from "lucide-react"
import { useState } from "react"
import { NavLink, useLocation } from "react-router"
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

export function SidebarFarm() {
    const farmId = useFarmStore((state) => state.farmId)

    const selectedCalendar = useCalendarStore((state) => state.calendar)
    const setCalendar = useCalendarStore((state) => state.setCalendar)
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)
    const calendarSelection = getCalendarSelection()

    // Check if page contains `farm/create` in url
    const location = useLocation()
    const isCreateFarmWizard = location.pathname.includes("farm/create")

    // Set the farm link
    let farmLink: string
    let farmLinkDisplay: string
    if (isCreateFarmWizard) {
        farmLink = "/farm"
        farmLinkDisplay = "Terug naar bedrijven"
    } else if (farmId) {
        farmLink = `/farm/${farmId}`
        farmLinkDisplay = "Bedrijf"
    } else {
        farmLink = "/farm"
        farmLinkDisplay = "Selecteer een bedrijf"
    }

    let fieldsLink: string | undefined
    if (isCreateFarmWizard) {
        fieldsLink = undefined
    } else if (farmId) {
        fieldsLink = `/farm/${farmId}/${selectedCalendar}/field`
    } else {
        fieldsLink = undefined
    }

    let fertilizersLink: string | undefined
    if (farmId) {
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
                        <SidebarMenuButton asChild>
                            <NavLink to={farmLink}>
                                <House />
                                <span>{farmLinkDisplay}</span>
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
                                className="hover:bg-transparant hover:text-muted-foreground active:bg-transparant active:text-muted-foreground"
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
                            <SidebarMenuButton asChild>
                                <NavLink to={fieldsLink}>
                                    <Square />
                                    <span>Percelen</span>
                                </NavLink>
                            </SidebarMenuButton>
                        ) : (
                            <SidebarMenuButton
                                asChild
                                className="hover:bg-transparant hover:text-muted-foreground active:bg-transparant active:text-muted-foreground"
                            >
                                <span className="flex items-center gap-2 cursor-default text-muted-foreground">
                                    <Square />
                                    <span>Percelen</span>
                                </span>
                            </SidebarMenuButton>
                        )}
                    </SidebarMenuItem>
                    {/* <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <NavLink to="./cultivations">
                                        <Sprout />
                                        <span>Gewassen</span>
                                    </NavLink>
                                </SidebarMenuButton>
                            </SidebarMenuItem> */}
                    <SidebarMenuItem>
                        {fertilizersLink ? (
                            <SidebarMenuButton asChild>
                                <NavLink to={fertilizersLink}>
                                    <Shapes />
                                    <span>Meststoffen</span>
                                </NavLink>
                            </SidebarMenuButton>
                        ) : (
                            <SidebarMenuButton
                                asChild
                                className="hover:bg-transparant hover:text-muted-foreground active:bg-transparant active:text-muted-foreground"
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
