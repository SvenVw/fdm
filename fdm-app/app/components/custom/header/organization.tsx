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

export function HeaderOrganization({
    selectedOrganizationSlug,
    organizationOptions,
}: {
    selectedOrganizationSlug: string | undefined
    organizationOptions: HeaderOrganizationOption[]
}) {
    const location = useLocation()
    const currentPath = String(location.pathname)

    let page = "overview"
    if (currentPath.includes("new")) {
        page = "new"
    } else if (currentPath.includes("invitation")) {
        page = "invitation"
    }

    return (
        <>
            <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/organization">
                    Organisaties
                </BreadcrumbLink>
            </BreadcrumbItem>
            {page === "new" ? (
                <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/organization/new">
                            Nieuwe organisatie
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                </>
            ) : page === "invitation" ? (
                <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/invitations">
                            Uitnodigingen
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                </>
            ) : (
                <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center gap-1">
                                {selectedOrganizationSlug && organizationOptions
                                    ? (organizationOptions.find(
                                          (option) =>
                                              option.slug ===
                                              selectedOrganizationSlug,
                                      )?.name ?? "Unknown organization")
                                    : "Kies een organisatie"}
                                <ChevronDown className="text-muted-foreground h-4 w-4" />
                            </DropdownMenuTrigger>
                            {organizationOptions &&
                            organizationOptions.length > 0 ? (
                                <DropdownMenuContent align="start">
                                    {organizationOptions.map((option) => (
                                        <DropdownMenuCheckboxItem
                                            checked={
                                                selectedOrganizationSlug ===
                                                option.slug
                                            }
                                            key={option.slug}
                                        >
                                            <NavLink
                                                to={
                                                    selectedOrganizationSlug
                                                        ? currentPath.replace(
                                                              selectedOrganizationSlug,
                                                              option.slug,
                                                          )
                                                        : `/organization/${option.slug}`
                                                }
                                            >
                                                {option.name}
                                            </NavLink>
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            ) : null}
                        </DropdownMenu>
                    </BreadcrumbItem>
                </>
            )}
        </>
    )
}

type HeaderOrganizationOption = {
    slug: string
    name: string | undefined | null
}
