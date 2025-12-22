import { ChevronDown } from "lucide-react"
import { NavLink, useLocation } from "react-router"
import { useCalendarStore } from "@/app/store/calendar"
import {
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
} from "~/components/ui/breadcrumb"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"

export function HeaderAtlas({ b_id_farm }: { b_id_farm: string | undefined }) {
    const calendar = useCalendarStore((state) => state.calendar)
    const location = useLocation()

    const isElevation = location.pathname.includes("/elevation")
    const currentName = isElevation ? "Hoogtekaart" : "Gewaspercelen"

    return (
        <>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/farm/${b_id_farm}/${calendar}/atlas`}>
                    Atlas
                </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="hidden md:block">
                <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-1">
                        {currentName}
                        <ChevronDown className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuItem asChild>
                            <NavLink
                                to={`/farm/${b_id_farm}/${calendar}/atlas/fields`}
                            >
                                Gewaspercelen
                            </NavLink>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <NavLink
                                to={`/farm/${b_id_farm}/${calendar}/atlas/elevation`}
                            >
                                Hoogtekaart
                            </NavLink>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </BreadcrumbItem>
        </>
    )
}

type HeaderAtlasLayerOption = {
    atlasLayerId: string
    atlasLayerName: string
}
