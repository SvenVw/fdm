import { Outlet } from "react-router";
import { SidebarPage, SidebarPageProps } from "@/components/custom/sidebar-page";
import { ReactNode } from "react";

interface FarmContentProps {
    sidebarItems?: SidebarPageProps["items"];
    children?: ReactNode;
}

export function FarmContent({ sidebarItems, children }: FarmContentProps) {

    return (
        <div className="space-y-6 p-10 pb-0">
            < div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0" >
                {sidebarItems && (
                    <aside className="-mx-4 lg:w-1/5">
                        <SidebarPage items={sidebarItems} />
                    </aside>
                )
                }
                <div className="flex-1 lg:max-w-2xl">
                    {children || <Outlet />}
                </div>
            </div >
        </div>

    )
}