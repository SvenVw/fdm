import {
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
} from "~/components/ui/breadcrumb"
import { clientConfig } from "~/lib/config"

export function HeaderAbout() {
    return (
        <>
            <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/about">{`Over ${clientConfig.name}`}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/about/whats-new">
                    Wat is er nieuw?
                </BreadcrumbLink>
            </BreadcrumbItem>
        </>
    )
}
