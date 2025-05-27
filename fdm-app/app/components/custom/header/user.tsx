import {
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
} from "~/components/ui/breadcrumb"

export function HeaderUser({ name }: { name: string }) {
    return (
        <>
            <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/user">Account</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/user">{name}</BreadcrumbLink>
            </BreadcrumbItem>
        </>
    )
}
