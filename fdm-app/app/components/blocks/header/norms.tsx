import { useCalendarStore } from "@/app/store/calendar"
import {
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
} from "~/components/ui/breadcrumb"

export function HeaderNorms({ b_id_farm }: { b_id_farm: string }) {
    const calendar = useCalendarStore((state) => state.calendar)

    return (
        <>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/farm/${b_id_farm}/${calendar}/norms`}>
                    Gebruiksruimte
                </BreadcrumbLink>
            </BreadcrumbItem>
        </>
    )
}
