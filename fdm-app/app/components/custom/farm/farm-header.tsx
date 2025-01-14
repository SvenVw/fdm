import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

import type { FarmOptions, HeaderAction } from './farm.d'
import { NavLink } from "react-router";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

interface FarmHeaderProps {
    farmOptions: FarmOptions;
    b_id_farm: string | undefined;
    action: HeaderAction;
}

export function FarmHeader({farmOptions, b_id_farm, action}: FarmHeaderProps) {

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                        <BreadcrumbLink href="/">
                            Bedrijf
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    {farmOptions  && farmOptions.length > 0 ?
                        <>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <DropdownMenu>
                                    <DropdownMenuTrigger className="flex items-center gap-1">
                                        {b_id_farm && farmOptions ? (
                                            farmOptions.find(option => option.b_id_farm === b_id_farm)?.b_name_farm ?? 'Unknown farm'
                                        ) : `Kies een bedrijf`}
                                        <ChevronDown />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        {farmOptions.map((option) => (
                                            <DropdownMenuCheckboxItem
                                                checked={b_id_farm === option.b_id_farm}
                                                key={option.b_id_farm}
                                            >
                                                <NavLink                                                    
                                                    to={`/farm/${option.b_id_farm}`}>
                                                    {option.b_name_farm}
                                                </NavLink>
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </BreadcrumbItem>
                        </>
                        : <></>
                    }
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
    )
}