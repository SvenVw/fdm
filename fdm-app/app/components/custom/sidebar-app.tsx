import * as Sentry from "@sentry/react"
import {
    ArrowRightLeft,
    BadgeCheck,
    Calendar,
    Check,
    ChevronRight,
    ChevronsUpDown,
    Cookie,
    GitPullRequestArrow,
    House,
    Languages,
    LifeBuoy,
    LogOut,
    Map as MapIcon,
    Scale,
    Send,
    Settings,
    Shapes,
    Sparkles,
    Square,
} from "lucide-react"
import posthog from "posthog-js"
import { useEffect, useState } from "react"
import { Form, NavLink, useLocation } from "react-router"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "~/components/ui/collapsible"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "~/components/ui/sidebar"
import { useIsMobile } from "~/hooks/use-mobile"
import { getCalendarSelection } from "~/lib/calendar"
import { clientConfig } from "~/lib/config"
import { useCalendarStore } from "~/store/calendar"
import { useFarmStore } from "~/store/farm"

interface SideBarAppUserType {
    id: string
    name: string // Full name from session.user
    email: string
    image?: string | null | undefined
    // Other properties from session.user might exist but are not needed here
}

interface SideBarAppType {
    user: SideBarAppUserType
    userName: string // Display name, potentially different from user.name
    initials: string
}

/**
 * Renders the sidebar navigation component.
 *
 * This component displays the main application sidebar with sections for farm management, apps, and support. It dynamically generates navigation links based on whether the user has an active farm and sets up Sentry for user tracking and feedback collection. The component also manages loading state to ensure feedback data is available before rendering.
 *
 * @param props - Contains user details such as first name, surname, full name, email, profile image, and active farm identifier.
 */
export function SidebarApp(props: SideBarAppType) {
    const user = props.user
    const userName = props.userName
    const avatarInitials = props.initials
    const isMobile = useIsMobile()
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

    const nutrienBalanceLink = undefined
    const omBalanceLink = undefined
    const baatLink = undefined

    if (clientConfig.analytics.sentry) {
        try {
            Sentry.setUser({
                fullName: user.name,
                email: user.email,
            })
        } catch (error) {
            Sentry.captureException(error)
        }
    }

    const [feedback, setFeedback] = useState<ReturnType<
        typeof Sentry.getFeedback
    > | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        try {
            const feedbackInstance = Sentry.getFeedback()
            if (feedbackInstance) {
                setFeedback(feedbackInstance)
            } else {
                console.warn("Sentry.getFeedback() returned null or undefined.")
            }
        } catch (error) {
            console.error("Failed to initialize Sentry feedback:", error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    if (isLoading) {
        return null
    }

    const openFeedbackForm = async () => {
        if (!feedback || typeof feedback.createForm !== "function") {
            console.error(
                "Feedback object not available or missing createForm method.",
            )
            toast.error(
                "Feedback formulier is nog niet beschikbaar. Probeer het opnieuw.",
            )
            return
        }
        try {
            const form = await feedback.createForm()
            form.appendToDom()
            form.open()
        } catch (error) {
            Sentry.captureException(error)
            toast.error(
                "Er is een fout opgetreden bij het openen van het feedbackformulier. Probeer het later opnieuw.",
            )
        }
    }

    const openCookieSettings = () => {
        if (typeof window !== "undefined" && window.openCookieSettings) {
            window.openCookieSettings()
        }
    }

    const handleSupportClick = () => {
        const supportEmail = `support@${window.location.hostname}`
        window.location.href = `mailto:${supportEmail}`
    }

    return (
        <Sidebar>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <NavLink to="/">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#122023]">
                                    <img
                                        className="size-6"
                                        src="/fdm-high-resolution-logo-transparent-no-text.png"
                                        alt={clientConfig.name}
                                    />
                                </div>
                                <div className="flex flex-col gap-0.5 leading-none">
                                    <span className="font-semibold">
                                        {clientConfig.name}
                                    </span>
                                </div>
                            </NavLink>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
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
                                                        {selectedCalendar ===
                                                        "all"
                                                            ? "Alle jaren"
                                                            : selectedCalendar}
                                                    </Badge>
                                                )}
                                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                            </SidebarMenuButton>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {calendarSelection?.map(
                                                    (item) => {
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
                                                                        setCalendar(
                                                                            item,
                                                                        )
                                                                    }
                                                                >
                                                                    <NavLink
                                                                        to={
                                                                            newUrl
                                                                        }
                                                                        className="flex items-center"
                                                                    >
                                                                        <span>
                                                                            {item ===
                                                                            "all"
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
                                                    },
                                                )}
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
                <SidebarGroup className="mt-auto">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem key="support">
                                <SidebarMenuButton
                                    size="sm"
                                    onClick={handleSupportClick}
                                >
                                    <LifeBuoy />
                                    <span>Ondersteuning</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            {clientConfig.analytics.sentry ? (
                                <SidebarMenuItem key="feedback">
                                    <SidebarMenuButton
                                        asChild
                                        size="sm"
                                        onClick={openFeedbackForm}
                                    >
                                        <NavLink to="#">
                                            <Send />
                                            <span>Feedback</span>
                                        </NavLink>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ) : null}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                >
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarImage
                                            src={user.image ?? undefined}
                                            alt={user.name}
                                        />
                                        <AvatarFallback className="rounded-lg">
                                            {avatarInitials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">
                                            {userName}
                                        </span>
                                        <span className="truncate text-xs">
                                            {user.email}
                                        </span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                                side={isMobile ? "bottom" : "right"}
                                align="end"
                                sideOffset={4}
                            >
                                <DropdownMenuLabel className="p-0 font-normal">
                                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                        <Avatar className="h-8 w-8 rounded-lg">
                                            <AvatarFallback className="rounded-lg">
                                                {avatarInitials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="grid flex-1 text-left text-sm leading-tight">
                                            <span className="truncate font-semibold">
                                                {userName}
                                            </span>
                                            <span className="truncate text-xs">
                                                {user.email}
                                            </span>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownMenuItem asChild>
                                        <NavLink to="/farm/account">
                                            <BadgeCheck className="mr-2 h-4 w-4" />
                                            Account
                                        </NavLink>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={openCookieSettings}
                                    >
                                        <Cookie className="mr-2 h-4 w-4" />
                                        Cookies
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        {/* <NavLink to="#">
                                            <Languages className="mr-2 h-4 w-4" />
                                            Taal
                                        </NavLink> */}
                                        <span className="flex items-center gap-2 cursor-default text-muted-foreground">
                                            <Languages className="mr-2 h-4 w-4" />
                                            <span>Taal</span>
                                        </span>
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownMenuItem asChild>
                                        {/* <NavLink to="/farm/whats-new">
                                            <Settings className="mr-2 h-4 w-4" />
                                            Instellingen
                                        </NavLink> */}
                                        <span className="flex items-center gap-2 cursor-default text-muted-foreground">
                                            <Settings className="mr-2 h-4 w-4" />
                                            <span>Instellingen</span>
                                        </span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <NavLink to="/farm/whats-new">
                                            <Sparkles className="mr-2 h-4 w-4" />
                                            Wat is er nieuw?
                                        </NavLink>
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Form method="post" action="../farm">
                                        <Button
                                            type="submit"
                                            variant="link"
                                            onClick={() => {
                                                if (
                                                    clientConfig.analytics
                                                        .posthog
                                                ) {
                                                    posthog.reset()
                                                }
                                            }}
                                        >
                                            <LogOut />
                                            Uitloggen
                                        </Button>
                                    </Form>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
