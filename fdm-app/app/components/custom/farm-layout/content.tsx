// components/custom/farm-layouts/content.tsx
import { Outlet } from "react-router";
import { Separator } from "@/components/ui/separator";
import { SidebarPage } from "@/components/custom/sidebar-page";
import type { ContentLayoutProps } from "./types";

export function ContentLayout({
  title,
  description,
  sidebarItems,
  children,
}: ContentLayoutProps) {
  return (
    <div className="space-y-6 p-10 pb-16">
      <div className="flex items-center">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          {description && (
            <p className="text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        {sidebarItems && (
          <aside className="-mx-4 lg:w-1/5">
            <SidebarPage items={sidebarItems} />
          </aside>
        )}
        <div className="flex-1 lg:max-w-2xl">
          {children || <Outlet />}
        </div>
      </div>
    </div>
  );
}