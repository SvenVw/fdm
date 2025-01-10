// components/custom/farm-layouts/header.tsx
import { NavLink } from "react-router";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BaseFarmLayoutProps } from "./types";

export function FarmHeader({ farmName, breadcrumbs, action }: BaseFarmLayoutProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs?.map((crumb, index) => (
            <>
              <BreadcrumbItem className="hidden md:block" key={index}>
                <BreadcrumbLink href={crumb.to}>
                  {crumb.label}
                </BreadcrumbLink>
              </BreadcrumbItem>
              {index < breadcrumbs.length - 1 && (
                <BreadcrumbSeparator className="hidden md:block" />
              )}
            </>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      {action && (
        <div className="ml-auto">
          <NavLink
            to={action.to}
            className={cn("ml-auto", {
              "pointer-events-none": action.disabled
            })}
          >
            <Button disabled={action.disabled}>
              {action.label}
            </Button>
          </NavLink>
        </div>
      )}
    </header>
  );
}