import {
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
} from "~/components/ui/breadcrumb"
import { useLocation } from "react-router"

export function HeaderFarmCreate({
    b_name_farm,
}: {
    b_name_farm: string | undefined | null
}) {
    const location = useLocation()
    const currentPath = String(location.pathname)

    return (
        <>
            <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={"/farm/create"}>
                    Maak een bedrijf
                </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            {!b_name_farm ? (
                <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink>Algemene gegevens</BreadcrumbLink>
                </BreadcrumbItem>
            ) : (
                <>
                    <BreadcrumbItem className="hidden md:block">
                        <BreadcrumbLink>{b_name_farm}</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                </>
            )}
            {currentPath.match(/atlas/) ? (
                <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink>Selecteer percelen</BreadcrumbLink>
                </BreadcrumbItem>
            ) : null}
            {currentPath.match(/fields/) ? (
                <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink>Percelen</BreadcrumbLink>
                </BreadcrumbItem>
            ) : null}
            {currentPath.match(/cultivations/) ? (
                <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink>Bouwplan</BreadcrumbLink>
                </BreadcrumbItem>
            ) : null}
            {currentPath.match(/access/) ? (
                <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink>Toegang</BreadcrumbLink>
                </BreadcrumbItem>
            ) : null}
        </>
    )
}
