import { Separator } from "@/app/components/ui/separator"
import { SidebarTrigger } from "@/app/components/ui/sidebar"
import { Breadcrumb, BreadcrumbList } from "@/app/components/ui/breadcrumb"

export function Header({ children }: { children: React.ReactNode }) {
    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
                <BreadcrumbList>{children}</BreadcrumbList>
            </Breadcrumb>

            {/* <div className="ml-auto">{action}</div> */}
        </header>
    )
}
