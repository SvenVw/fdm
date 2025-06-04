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
            {b_id_farm ? (
                <BreadcrumbLink href={`/farm/${b_id_farm}`}>Bedrijf</BreadcrumbLink>
            ) : "Bedrijf"}
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
                    {farmOptions ? (
                        <DropdownMenuContent align="start">
                            {farmOptions.map((option) => (
                                <DropdownMenuCheckboxItem
                                    checked={b_id_farm === option.b_id_farm}
                                    key={option.b_id_farm}
                                >
                                    <NavLink
                                        to={
                                            b_id_farm
                                                ? currentPath.replace(
                                                      b_id_farm,
                                                      option.b_id_farm,
                                                  )
                                                : `/farm/${option.b_id_farm}`
                                        }
                                    >
                                        {option.b_name_farm}
                                    </NavLink>
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    ) : null}
                </DropdownMenu>
            </BreadcrumbItem>
        </>
    )
}

type HeaderFarmOption = {
    b_id_farm: string
    b_name_farm: string | undefined | null
}
