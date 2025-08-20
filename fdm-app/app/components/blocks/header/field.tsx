import { ChevronDown } from "lucide-react"
import { useEffect } from "react"
import { NavLink, useLocation } from "react-router"
import { useCalendarStore } from "@/app/store/calendar"
import { useFarmFieldOptionsStore } from "@/app/store/farm-field-options"
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

export function HeaderField({
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
    const farmFieldOptionsStore = useFarmFieldOptionsStore()
    useEffect(() => {
        if (fieldOptions && fieldOptions.length > 0) {
            farmFieldOptionsStore.setFieldOptions(fieldOptions)
        }
    }, [fieldOptions, farmFieldOptionsStore.setFieldOptions])

    return (
        <>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/farm/${b_id_farm}/${calendar}/field`}>
                    Perceel
                </BreadcrumbLink>
            </BreadcrumbItem>
            {fieldOptions.length > 0 ? (
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
                                            to={
                                                currentPath.includes(
                                                    "/cultivation",
                                                )
                                                    ? `/farm/${b_id_farm}/${calendar}/field/${option.b_id}/cultivation`
                                                    : b_id
                                                      ? currentPath.replace(
                                                            b_id,
                                                            option.b_id,
                                                        )
                                                      : `/farm/${b_id_farm}/${calendar}/field/${option.b_id}`
                                            }
                                        >
                                            {option.b_name}
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
                            href={`/farm/${b_id_farm}/${calendar}/field/new`}
                        >
                            Nieuwe perceel
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                </>
            )}
        </>
    )
}

export type HeaderFieldOption = {
    b_id: string
    b_name: string | undefined | null
}
