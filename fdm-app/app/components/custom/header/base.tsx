import { Separator } from "@/app/components/ui/separator"
import { SidebarTrigger } from "@/app/components/ui/sidebar"
import { Breadcrumb, BreadcrumbList } from "@/app/components/ui/breadcrumb"
import { NavLink } from "react-router"
import { cn } from "@/app/lib/utils"
import { Button } from "~/components/ui/button"

export function Header({
    action = undefined,
    children,
}: { children: React.ReactNode; action: HeaderAction | undefined }) {
    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
                <BreadcrumbList>{children}</BreadcrumbList>
            </Breadcrumb>
            {action ? (
                <div className="ml-auto">
                    <NavLink
                        to={action.to}
                        className={cn("ml-auto", {
                            "pointer-events-none": action.disabled,
                        })}
                    >
                        <Button disabled={action.disabled}>
                            {action.label}
                        </Button>
                    </NavLink>
                </div>
            ) : null}
        </header>
    )
}

type HeaderAction = {
    to: string
    disabled: boolean
    label: string
}
