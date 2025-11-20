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
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"

export function HeaderBalance({
    b_id_farm,
    b_id,
    fieldOptions,
}: {
    b_id_farm: string
    b_id: string | undefined
    fieldOptions: HeaderFieldOption[]
}) {
    const location = useLocation()
    const currentPath = String(location.pathname)
    const calendar = useCalendarStore((state) => state.calendar)

    return (
        <>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/farm/${b_id_farm}/${calendar}/balance`}>
                    Nutriëntenbalans
                </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
                <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-1">
                        {currentPath.includes("/balance/nitrogen") ? "Stikstof" : "Organische Stof"}
                        <ChevronDown className="text-muted-foreground h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuCheckboxItem
                            checked={currentPath.includes("/balance/nitrogen")}
                            key={"nitrogen"}
                        >
                             <NavLink to={`/farm/${b_id_farm}/${calendar}/balance/nitrogen`}>
                                Stikstof
                             </NavLink>
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                            checked={currentPath.includes("/balance/organic-matter")}
                            key={"organic-matter"}
                        >
                            <NavLink to={`/farm/${b_id_farm}/${calendar}/balance/organic-matter`}>
                                Organische Stof
                            </NavLink>
                        </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </BreadcrumbItem>
            {b_id ? (
                <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center gap-1">
                                {b_id && fieldOptions
                                    ? (fieldOptions.find(
                                          (option) => option.b_id === b_id,
                                      )?.b_name ?? "Unknown field")
                                    : "Kies een perceel"}
                                <ChevronDown className="text-muted-foreground h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                {fieldOptions.map((option) => (
                                    <DropdownMenuCheckboxItem
                                        checked={b_id === option.b_id}
                                        key={option.b_id}
                                    >
                                        <NavLink
                                            to={`/farm/${b_id_farm}/${calendar}/balance/${currentPath.includes('nitrogen') ? 'nitrogen' : 'organic-matter'}/${option.b_id}`}
                                        >
                                            {option.b_name}
                                        </NavLink>
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </BreadcrumbItem>
                </>
            ) : null}
        </>
    )
}

type HeaderFieldOption = {
    b_id: string
    b_name: string | undefined | null
}
