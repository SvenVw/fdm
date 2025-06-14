import { NavLink, useLocation } from "react-router"
import { buttonVariants } from "~/components/ui/button"
import { cn } from "~/lib/utils"

export interface SidebarPageProps extends React.HTMLAttributes<HTMLElement> {
    items: {
        to: string
        title: string
    }[]
}

export function SidebarPage({ className, items, ...props }: SidebarPageProps) {
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
                    aria-current={pathname === item.to ? "page" : undefined}
                    aria-label={item.title}
                    className={cn(
                        buttonVariants({ variant: "ghost" }),
                        pathname.startsWith(item.to)
                            ? "bg-muted hover:bg-muted "
                            : "hover:bg-transparent hover:underline",
                        "justify-start",
                    )}
                >
                    {item.title}
                </NavLink>
            ))}
        </nav>
    )
}
