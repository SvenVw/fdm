import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
} from "@/components/ui/sidebar"
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
    PawPrint,
    Scale,
    Send,
    Settings,
    Shapes,
    Sparkles,
    Sprout,
    Square,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { useEffect, useState } from "react"
import { Form, NavLink } from "react-router"

interface SideBarAppType {
    user: {
        firstname: string
        surname: string
        name: string
        email: string
        image: string | undefined
        farm_active: string | undefined
    }
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
    const avatarInitials =
        props.user.firstname.slice(0, 1).toUpperCase() +
        props.user.surname.slice(0, 1).toUpperCase()
    const isMobile = useIsMobile()

    let farmLink: string
    if (user.farm_active) {
        farmLink = `/farm/${user.farm_active}`
    } else {
        farmLink = "/farm"
    }

    let fieldsLink: string
    if (user.farm_active) {
        fieldsLink = `/farm/${user.farm_active}/field`
    } else {
        fieldsLink = "/field"
    }

    let atlasLink: string
    if (user.farm_active) {
        atlasLink = `/farm/${user.farm_active}/atlas`
    } else {
        atlasLink = "#"
    }

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
                                    <span className="font-semibold">FDM</span>
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
                                        <span>Bedrijf</span>
                                    </NavLink>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <NavLink to={atlasLink}>
                                        <MapIcon />
                                        <span>Kaart</span>
                                    </NavLink>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <NavLink to={fieldsLink}>
                                        <Square />
                                        <span>Percelen</span>
                                    </NavLink>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <NavLink to="./cultivations">
                                        <Sprout />
                                        <span>Gewassen</span>
                                    </NavLink>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <NavLink to="./fertilizers">
                                        <Shapes />
                                        <span>Meststoffen</span>
                                    </NavLink>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <NavLink to="./stable">
                                        <PawPrint />
                                        <span>Stal & dieren</span>
                                    </NavLink>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                <SidebarGroup>
                    <SidebarGroupLabel>Apps</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <NavLink to="#">
                                        <ArrowRightLeft />
                                        <span>Nutriëntenbalans</span>
                                    </NavLink>
                                </SidebarMenuButton>
                                <SidebarMenuBadge>
                                    <Badge>Binnenkort</Badge>
                                </SidebarMenuBadge>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <NavLink to="#">
                                        <Scale />
                                        <span>OS Balans</span>
                                    </NavLink>
                                </SidebarMenuButton>
                                <SidebarMenuBadge>
                                    <Badge>Binnenkort</Badge>
                                </SidebarMenuBadge>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <NavLink to="#">
                                        <GitPullRequestArrow />
                                        <span>BAAT</span>
                                    </NavLink>
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
                                <SidebarMenuButton asChild size="sm">
                                    <NavLink to="#">
                                        <LifeBuoy />
                                        <span>Ondersteuning</span>
                                    </NavLink>
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
                                                {`${user.firstname} ${user.surname}`}
                                            </span>
                                            <span className="truncate text-xs">
                                                {user.email}
                                            </span>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownMenuItem>
                                        <Sparkles />
                                        Wat is er nieuw?
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownMenuItem>
                                        <BadgeCheck />
                                        Account
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Languages />
                                        Taal
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Settings />
                                        Instellingen
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
