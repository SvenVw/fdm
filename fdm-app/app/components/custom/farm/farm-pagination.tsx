import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
} from "~/components/ui/pagination"
import type { PaginationItems } from "./farm.d"

interface PaginationLayoutProps {
    items: PaginationItems
    currentPath: string
    children?: React.ReactNode
}

export function FarmPagination({
    items,
    currentPath,
    children,
}: PaginationLayoutProps) {
    if (!items?.length) return null

    return (
        <div className="space-y-6">
            <Pagination aria-label="Farm navigation">
                <PaginationContent role="navigation">
                    {items.map((item) => (
                        <PaginationItem key={item.to}>
                            <PaginationLink
                                href={item.to}
                                size="default"
                                isActive={currentPath === item.to}
                                aria-current={
                                    currentPath === item.to ? "page" : undefined
                                }
                            >
                                {item.label}
                            </PaginationLink>
                        </PaginationItem>
                    ))}
                </PaginationContent>
            </Pagination>
            {children}
        </div>
    )
}
