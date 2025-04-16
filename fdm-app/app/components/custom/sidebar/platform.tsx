import { clientConfig } from "@/app/lib/config"
import {
    ArrowLeft,
    ArrowRight,
    Cookie,
    House,
    Languages,
    Sparkles,
    User,
    Users,
} from "lucide-react"
import { NavLink } from "react-router"
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "~/components/ui/sidebar"
import { Button } from "~/components/ui/button"

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
                <SidebarGroupLabel>Mijn account</SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <NavLink to={"/user"}>
                                    <User />
                                    <span>Gegevens</span>
                                </NavLink>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton onClick={openCookieSettings}>
                                <Cookie />
                                <span>Cookies</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <NavLink to={"#"}>
                                    <Languages />
                                    <span>Taal</span>
                                </NavLink>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
                <SidebarGroupLabel>Mijn organisaties</SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <NavLink to={"#"}>
                                    <Users />
                                    <span>Overzicht</span>
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
