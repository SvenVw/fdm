import { ArrowLeft } from "lucide-react"
import { useMemo } from "react"
import { NavLink, useLocation } from "react-router"
import { useFieldFilterStore } from "@/app/store/field-filter"
import { FieldFilterToggle } from "../../custom/field-filter-toggle"
import { SidebarPage } from "../../custom/sidebar-page"
import { Button } from "../../ui/button"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "../../ui/card"

export function NewFieldsSidebar({
    fields,
    b_id_farm,
    calendar,
    isFarmCreateWizard,
}: NewFieldsSidebarProps) {
    const { showProductiveOnly } = useFieldFilterStore()
    const location = useLocation()

    const sidebarPageItems = useMemo(
        () =>
            fields
                .filter((field) =>
                    showProductiveOnly ? field.b_bufferstrip === false : true,
                )
                .slice()
                .sort((a, b) => (b.b_area ?? 0) - (a.b_area ?? 0)) // Sort by area in descending order
                .map((field) => ({
                    title: field.b_name,
                    to:
                        (isFarmCreateWizard ?? false)
                            ? `/farm/create/${b_id_farm}/${calendar}/fields/${field.b_id}`
                            : `/farm/${b_id_farm}/${calendar}/field/new/fields/${field.b_id}${location.search}`,
                })),
        [
            fields,
            showProductiveOnly,
            b_id_farm,
            calendar,
            isFarmCreateWizard,
            location.search,
        ],
    )
    return (
        <aside className="lg:w-1/5 gap-0">
            <Card>
                <CardHeader>
                    <CardTitle className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <p>Percelen</p>
                        <FieldFilterToggle />
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <SidebarPage items={sidebarPageItems} />
                </CardContent>
                <CardFooter className="flex flex-col items-center space-y-2 relative">
                    {/* <Separator /> */}
                    <Button variant={"link"} asChild>
                        <NavLink
                            to={
                                isFarmCreateWizard
                                    ? `/farm/create/${b_id_farm}/${calendar}/atlas`
                                    : `/farm/${b_id_farm}/${calendar}/field/new`
                            }
                        >
                            <ArrowLeft />
                            Terug naar kaart
                        </NavLink>
                    </Button>
                </CardFooter>
            </Card>
        </aside>
    )
}

type NewFieldsSidebarProps = {
    fields: {
        b_id: string
        b_name: string
        b_area: number | null
        b_bufferstrip: boolean
    }[]
    b_id_farm: string
    calendar: string
    isFarmCreateWizard: boolean
}
