import { Breadcrumb, BreadcrumbList } from "@/app/components/ui/breadcrumb"
import { Separator } from "@/app/components/ui/separator"
import { SidebarTrigger } from "@/app/components/ui/sidebar"
import { HeaderAction, type HeaderActionProps } from "./action"

export function Header({
    action = undefined,
    children,
}: {
    children: React.ReactNode
    action: HeaderActionProps | undefined
}) {
    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
                <BreadcrumbList>{children}</BreadcrumbList>
            </Breadcrumb>
            {action ? (
                <HeaderAction
                    label={action.label}
                    to={action.to}
                    disabled={action.disabled}
                />
            ) : null}
        </header>
    )
}
