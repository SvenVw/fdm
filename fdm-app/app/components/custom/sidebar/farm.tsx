import { Calendar, Check, ChevronRight, House, MapIcon, Shapes, Square } from "lucide-react"
import { NavLink, useLocation } from "react-router"
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from "~/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible"
import { Badge } from "~/components/ui/badge"
import { useFarmStore } from "@/app/store/farm"
import { useCalendarStore } from "@/app/store/calendar"
import { getCalendarSelection } from "@/app/lib/calendar"
import { useState } from "react"

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

    let atlasLink: string | undefined
    if (isCreateFarmWizard) {
        atlasLink = undefined
    } else if (farmId) {
        atlasLink = `/farm/${farmId}/${selectedCalendar}/atlas`
    } else {
        atlasLink = undefined
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
                                tooltip={"Kalender"}
                                className="cursor-default text-muted-foreground"
                            >
                                <Calendar />
                                <span>Kalender</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )}
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            {atlasLink ? (
                                <NavLink to={atlasLink}>
                                    <MapIcon />
                                    <span>Kaart</span>
                                </NavLink>
                            ) : (
                                <span className="flex items-center gap-2 cursor-default text-muted-foreground">
                                    <MapIcon />
                                    <span>Kaart</span>
                                </span>
                            )}
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            {fieldsLink ? (
                                <NavLink to={fieldsLink}>
                                    <Square />
                                    <span>Percelen</span>
                                </NavLink>
                            ) : (
                                <span className="flex items-center gap-2 cursor-default text-muted-foreground">
                                    <Square />
                                    <span>Percelen</span>
                                </span>
                            )}
                        </SidebarMenuButton>
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
                        <SidebarMenuButton asChild>
                            {fertilizersLink ? (
                                <NavLink to={fertilizersLink}>
                                    <Shapes />
                                    <span>Meststoffen</span>
                                </NavLink>
                            ) : (
                                <span className="flex items-center gap-2 cursor-default text-muted-foreground">
                                    <Shapes />
                                    <span>Meststoffen</span>
                                </span>
                            )}
                        </SidebarMenuButton>
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
