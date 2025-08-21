import { useEffect } from "react"
import { useLocation, useParams } from "react-router"
import { useFarmFieldOptionsStore } from "@/app/store/farm-field-options"
import {
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
} from "~/components/ui/breadcrumb"

export function HeaderFarmCreate({
    b_name_farm,
}: {
    b_name_farm: string | undefined | null
}) {
    const location = useLocation()
    const params = useParams()
    const farmFieldOptionsStore = useFarmFieldOptionsStore()
    useEffect(() => {
        if (params.b_id_farm && b_name_farm) {
            farmFieldOptionsStore.addFarmOption(params.b_id_farm, b_name_farm)
        }
    }, [params.b_id_farm, b_name_farm, farmFieldOptionsStore.addFarmOption])

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
            {currentPath.match(/upload/) ? (
                <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink>Shapefile uploaden</BreadcrumbLink>
                </BreadcrumbItem>
            ) : null}
            {currentPath.match(/fields/) ? (
                <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink>Percelen</BreadcrumbLink>
                </BreadcrumbItem>
            ) : null}
            {currentPath.match(/cultivations/) ? (
                <>
                    <BreadcrumbItem className="hidden md:block">
                        <BreadcrumbLink>Bouwplan</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem className="hidden md:block">
                        <BreadcrumbLink>Gewassen</BreadcrumbLink>
                    </BreadcrumbItem>
                </>
            ) : null}
            {currentPath.match(/fertilizers/) ? (
                <>
                    <BreadcrumbItem className="hidden md:block">
                        <BreadcrumbLink>Bouwplan</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem className="hidden md:block">
                        <BreadcrumbLink>Bemesting</BreadcrumbLink>
                    </BreadcrumbItem>
                </>
            ) : null}
            {currentPath.match(/access/) ? (
                <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink>Toegang</BreadcrumbLink>
                </BreadcrumbItem>
            ) : null}
        </>
    )
}
