import { ChevronDown } from "lucide-react"
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
import { NavLink, useLocation } from "react-router"

export function HeaderFarm({
    b_id_farm,
    farmOptions,
}: {
    b_id_farm: string | undefined
    farmOptions: HeaderFarmOption[]
}) {
    const location = useLocation()
    const currentPath = String(location.pathname)

    return (
        <>
            <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/farm/${b_id_farm}`}>
                    Bedrijf
                </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
                <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-1">
                        {b_id_farm && farmOptions
                            ? (farmOptions.find(
                                  (option) => option.b_id_farm === b_id_farm,
                              )?.b_name_farm ?? "Unknown farm")
                            : "Kies een bedrijf"}
                        <ChevronDown />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        {farmOptions.map((option) => (
                            <DropdownMenuCheckboxItem
                                checked={b_id_farm === option.b_id_farm}
                                key={option.b_id_farm}
                            >
                                <NavLink
                                    to={currentPath.replace(
                                        b_id_farm,
                                        option.b_id_farm,
                                    )}
                                >
                                    {option.b_name_farm}
                                </NavLink>
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </BreadcrumbItem>
        </>
    )
}

type HeaderFarmOption = {
    b_id_farm: string
    b_name_farm: string | undefined | null
}
