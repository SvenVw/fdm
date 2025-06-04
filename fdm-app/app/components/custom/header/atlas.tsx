import { useCalendarStore } from "@/app/store/calendar"
import { ChevronDown } from "lucide-react"
import { NavLink, useLocation } from "react-router"
import {
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
} from "~/components/ui/breadcrumb"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"

export function HeaderAtlas({
    b_id_farm,
    selectedAtlasLayerId,
    atlasLayerOptions,
}: {
    b_id_farm: string
    selectedAtlasLayerId: string
    atlasLayerOptions: HeaderAtlasLayerOption[]
}) {
    const location = useLocation()
    const currentPath = String(location.pathname)
    const calendar = useCalendarStore((state) => state.calendar)

    return (
        <>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/farm/${b_id_farm}/${calendar}/atlas`}>
                    Atlas
                </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
                <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-1">
                        {selectedAtlasLayerId && atlasLayerOptions
                            ? (atlasLayerOptions.find(
                                  (option) =>
                                      option.atlasLayerId ===
                                      selectedAtlasLayerId,
                              )?.atlasLayerName ?? "Unknown layer")
                            : "Kies een kaartlaag"}
                        <ChevronDown />
                    </DropdownMenuTrigger>
                    {atlasLayerOptions && atlasLayerOptions.length > 0 ? (
                        <DropdownMenuContent align="start">
                        {atlasLayerOptions.map((option) => (
                            <DropdownMenuCheckboxItem
                                checked={
                                    selectedAtlasLayerId === option.atlasLayerId
                                }
                                key={option.atlasLayerId}
                            >
                                <NavLink
                                    to={currentPath.replace(
                                        selectedAtlasLayerId,
                                        option.atlasLayerId,
                                    )}
                                >
                                    {option.atlasLayerName}
                                </NavLink>
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                    ): null}                  
                </DropdownMenu>
            </BreadcrumbItem>
        </>
    )
}

type HeaderAtlasLayerOption = {
    atlasLayerId: string
    atlasLayerName: string
}
