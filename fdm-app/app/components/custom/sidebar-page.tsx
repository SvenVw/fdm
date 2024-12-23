import { useLocation } from "react-router";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface SidebarPageProps extends React.HTMLAttributes<HTMLElement> {
    items: {
        href: string
        title: string
    }[]
}

export function SidebarPage({ className, items, ...props }: SidebarPageProps) {
    const { pathname } = useLocation();

    return (
        <nav
            className={cn(
                "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1 truncate",
                className
            )}
            {...props}
        >
            {items.map((item) => (
                <a
                    key={item.href}
                    href={item.href}
                    className={cn(
                        buttonVariants({ variant: "ghost" }),
                        pathname === item.href
                            ? "bg-muted hover:bg-muted"
                            : "hover:bg-transparent hover:underline",
                        "justify-start"
                    )}
                >
                    {item.title}
                </a>
            ))}
        </nav>
    )
}
