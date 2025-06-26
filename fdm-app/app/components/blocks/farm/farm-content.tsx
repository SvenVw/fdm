import type { ReactNode } from "react"
import { Outlet } from "react-router"
import {
    SidebarPage,
    type SidebarPageProps,
} from "~/components/custom/sidebar-page"

interface FarmContentProps {
    sidebarItems?: SidebarPageProps["items"]
    children?: ReactNode
}

export function FarmContent({ sidebarItems, children }: FarmContentProps) {
    return (
        <div className="space-y-6 px-8 pb-0">
            <div className="flex flex-col space-y-0 lg:flex-row lg:space-x-4 lg:space-y-0">
                {sidebarItems && (
                    <aside className="lg:w-1/5">
                        <SidebarPage items={sidebarItems} />
                    </aside>
                )}

                <div className="flex-1">{children || <Outlet />}</div>
            </div>
        </div>
    )
}
