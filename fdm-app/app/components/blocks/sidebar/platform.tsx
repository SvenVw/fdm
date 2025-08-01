import {
    ArrowLeft,
    Cookie,
    Languages,
    Mail,
    Sparkles,
    User,
    Users,
} from "lucide-react"
import { NavLink } from "react-router"
import { clientConfig } from "@/app/lib/config"
import { ChangelogNotification } from "@/app/components/custom/changelog-notification"
import { Button } from "~/components/ui/button"
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "~/components/ui/sidebar"

export function SidebarPlatform() {
    return (
        <>
            <SidebarGroup>
                <SidebarGroupContent>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild className="p-0">
                                <NavLink to="/farm">
                                    <Button
                                        variant="default"
                                        className="w-full justify-start"
                                    >
                                        <ArrowLeft className="" />
                                        <span>Terug naar bedrijven</span>
                                    </Button>
                                </NavLink>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
                <SidebarGroupLabel>Account</SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <NavLink to={"/user"}>
                                    <User />
                                    <span>Profiel</span>
                                </NavLink>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                className="hover:bg-transparent hover:text-muted-foreground active:bg-transparent active:text-muted-foreground"
                            >
                                <span className="flex items-center gap-2 cursor-default text-muted-foreground">
                                    <Languages />
                                    <span>Taal</span>
                                </span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton onClick={openCookieSettings}>
                                <Cookie />
                                <span>Cookies</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
                <SidebarGroupLabel>Organisaties</SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <NavLink to={"/organization"}>
                                    <Users />
                                    <span>Overzicht</span>
                                </NavLink>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <NavLink to={"/organization/invitations"}>
                                    <Mail />
                                    <span>Uitnodigingen</span>
                                </NavLink>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
                <SidebarGroupLabel>Over {clientConfig.name}</SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <NavLink to={"/about/whats-new"}>
                                    <Sparkles />
                                    <span>Wat is er nieuw?</span>
                                </NavLink>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        </>
    )
}

const openCookieSettings = () => {
    if (typeof window !== "undefined" && window.openCookieSettings) {
        window.openCookieSettings()
    }
}
