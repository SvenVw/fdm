import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { Badge } from "~/components/ui/badge"
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
} from "~/components/ui/sidebar"
import * as Sentry from "@sentry/react"
import {
    ArrowRightLeft,
    BadgeCheck,
    ChevronsUpDown,
    GitPullRequestArrow,
    House,
    Languages,
    LifeBuoy,
    LogOut,
    Map as MapIcon,
    Scale,
    Send,
    Settings,
    Sparkles,
    Sprout,
    Square,
} from "lucide-react"
import { Button } from "~/components/ui/button"
import { useIsMobile } from "~/hooks/use-mobile"
import { useEffect, useState } from "react"
import { Form, NavLink } from "react-router"
import { toast } from "sonner"
import { useFarm } from "~/context/farm-context"
import config from "@/fdm.config"

interface SideBarAppType {
    user: {
        firstname: string
        surname: string
        name: string
        email: string
        image: string | undefined
    }
    userName: string
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
    const { farmId } = useFarm()

    let farmLink: string
    let farmLinkDisplay: string
    if (farmId) {
        farmLink = `/farm/${farmId}`
        farmLinkDisplay = "Bedrijf"
    } else {
        farmLink = "/farm"
        farmLinkDisplay = "Selecteer een bedrijf"
    }

    let fieldsLink: string | undefined
    if (farmId) {
        fieldsLink = `/farm/${farmId}/field`
    } else {
        fieldsLink = undefined
    }

    let atlasLink: string | undefined
    if (farmId) {
        atlasLink = `/farm/${farmId}/atlas`
    } else {
        atlasLink = undefined
    }

    const nutrienBalanceLink = undefined
    const omBalanceLink = undefined
    const baatLink = undefined

    try {
        Sentry.setUser({
            fullName: user.name,
            email: user.email,
        })
    } catch (error) {
        Sentry.captureException(error)
    }
    const [feedback, setFeedback] = useState<Sentry.Feedback | undefined>()
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        setFeedback(Sentry.getFeedback())
        setIsLoading(false)
    }, [])

    if (isLoading) {
        return null
    }

    const openFeedbackForm = async () => {
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
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                    <Sprout className="size-4" />
                                </div>
                                <div className="flex flex-col gap-0.5 leading-none">
                                    <span className="font-semibold">
                                        {config.name}
                                    </span>
                                    {/* <span className="">2024</span> */}
                                </div>
                            </NavLink>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Mijn bedrijf</SidebarGroupLabel>
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
                            {/* <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <NavLink to="./fertilizers">
                                        <Shapes />
                                        <span>Meststoffen</span>
                                    </NavLink>
                                </SidebarMenuButton>
                            </SidebarMenuItem> */}
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
                                            src={user.image}
                                            alt={user.name}
                                        />
                                        <AvatarFallback className="rounded-lg">
                                            {avatarInitials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">
                                            {`${user.firstname} ${user.surname}`}
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
                                            {/* <AvatarImage src={avatarInitials} alt={user.name} /> */}
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
                                <DropdownMenuItem>
                                    <LogOut />
                                    <Form method="post" action="../farm">
                                        <Button type="submit" variant="link">
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
