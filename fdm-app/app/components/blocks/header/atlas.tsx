import { useCalendarStore } from "@/app/store/calendar"
import {
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
} from "~/components/ui/breadcrumb"

export function HeaderAtlas({ b_id_farm }: { b_id_farm: string }) {
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
            <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink
                    href={`/farm/${b_id_farm}/${calendar}/atlas/fields`}
                >
                    Percelen
                </BreadcrumbLink>
            </BreadcrumbItem>
        </>
    )
}

type HeaderAtlasLayerOption = {
    atlasLayerId: string
    atlasLayerName: string
}
