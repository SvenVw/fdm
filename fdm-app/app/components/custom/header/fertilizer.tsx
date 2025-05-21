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

export function HeaderFertilizer({
    b_id_farm,
    p_id,
    fertilizerOptions,
}: {
    b_id_farm: string
    p_id: string | undefined
    fertilizerOptions: HeaderFertilizerOption[]
}) {
    const location = useLocation()
    const currentPath = String(location.pathname)

    return (
        <>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/farm/${b_id_farm}/fertilizer`}>
                    Meststof
                </BreadcrumbLink>
            </BreadcrumbItem>
            {fertilizerOptions.length > 0 ? (
                <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center gap-1">
                                {p_id && fertilizerOptions
                                    ? (fertilizerOptions.find(
                                          (option) => option.p_id === p_id,
                                      )?.p_name_nl ?? "Unknown field")
                                    : "Kies een meststof"}
                                <ChevronDown />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                {fertilizerOptions.map((option) => (
                                    <DropdownMenuCheckboxItem
                                        checked={p_id === option.p_id}
                                        key={option.p_id}
                                    >
                                        <NavLink
                                            to={
                                                p_id
                                                    ? currentPath.replace(
                                                          p_id,
                                                          option.p_id,
                                                      )
                                                    : `/farm/${b_id_farm}/fertilizers/${option.p_id}/`
                                            }
                                        >
                                            {option.p_name_nl}
                                        </NavLink>
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </BreadcrumbItem>
                </>
            ) : (
                <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink
                            href={`farm/${b_id_farm}/fertilizers/new`}
                        >
                            Nieuwe meststof
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                </>
            )}
        </>
    )
}

type HeaderFertilizerOption = {
    p_id: string
    p_name_nl: string | undefined | null
}
