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
import { Badge } from "@/components/ui/badge"
import { ArrowRightLeft, GitPullRequestArrow, House, Map, PawPrint, Scale, Shapes, Sprout, Square } from "lucide-react"


export function AppSidebar() {
    return (
        <Sidebar>
            <SidebarHeader >
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <a href="#">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                    <Sprout className="size-4" />
                                </div>
                                <div className="flex flex-col gap-0.5 leading-none">
                                    <span className="font-semibold">FDM</span>
                                    {/* <span className="">2024</span> */}
                                </div>
                            </a>
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
                                    <a href="./farm">
                                        <House />
                                        <span>Bedrijf</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <a href="./map">
                                        <Map />
                                        <span>Kaart</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <a href="./fields">
                                        <Square />
                                        <span>Percelen</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <a href="./cultivations">
                                        <Sprout />
                                        <span>Gewassen</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <a href="./fertilizers">
                                        <Shapes />
                                        <span>Meststoffen</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <a href="./fertilizers">
                                        <PawPrint />
                                        <span>Stal & dieren</span>
                                    </a>
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
                                <a href="#">
                                    <ArrowRightLeft />
                                    <span>MINAS2</span>
                                </a>
                            </SidebarMenuButton>
                            <SidebarMenuBadge>
                                <Badge>Binnenkort</Badge>
                            </SidebarMenuBadge>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <a href="#">
                                    <Scale />
                                    <span>OS Balans</span>
                                </a>
                            </SidebarMenuButton>
                            <SidebarMenuBadge>
                                <Badge>Binnenkort</Badge>
                            </SidebarMenuBadge>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <a href="#">
                                    <GitPullRequestArrow />
                                    <span>BAAT</span>
                                </a>
                            </SidebarMenuButton>
                            <SidebarMenuBadge>
                                <Badge>Binnenkort</Badge>
                            </SidebarMenuBadge>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroupContent>
                </SidebarGroup>
                <SidebarGroup>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter />
        </Sidebar>
    )
}
