/**
 * @file This file defines the `SidebarPage` component, which is a reusable
 * navigation component typically used for sidebar menus.
 *
 * @packageDocumentation
 */
import { NavLink, useLocation } from "react-router"
import { buttonVariants } from "~/components/ui/button"
import { cn } from "~/lib/utils"

export interface SidebarPageProps extends React.HTMLAttributes<HTMLElement> {
    /** An array of navigation items to display in the sidebar. */
    items: {
        /** The URL path for the navigation link. */
        to: string
        /** The text to display for the navigation link. */
        title: string
    }[]
}

/**
 * A sidebar navigation component.
 *
 * This component renders a vertical navigation menu from a list of items.
 * It uses `NavLink` from `react-router` to handle client-side navigation and
 * automatically applies an "active" style to the link that matches the current
 * URL path. The styling is based on `shadcn/ui`'s button variants.
 *
 * @param props - The props for the component.
 * @param props.className - Additional CSS classes to apply to the nav element.
 * @param props.items - The list of navigation links to render.
 * @param props.children - Optional children to render within the nav element.
 * @returns A `nav` element containing the list of navigation links.
 */
export function SidebarPage({
    className,
    items,
    children,
    ...props
}: SidebarPageProps) {
    const { pathname } = useLocation()

    return (
        <nav
            className={cn(
                "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1 max-w-xs",
                className,
            )}
            {...props}
        >
            {items.map((item) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    aria-current={pathname.startsWith(item.to) ? "page" : undefined}
                    aria-label={item.title}
                    className={cn(
                        buttonVariants({ variant: "ghost" }),
                        pathname.startsWith(item.to)
                            ? "bg-muted hover:bg-muted"
                            : "hover:bg-transparent hover:underline",
                        "justify-start",
                    )}
                >
                    {item.title}
                </NavLink>
            ))}

            {children}
        </nav>
    )
}
