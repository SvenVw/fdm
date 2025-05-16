import { ChevronDown } from "lucide-react"
import { NavLink } from "react-router"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "~/components/ui/breadcrumb"
import { Button } from "~/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { Separator } from "~/components/ui/separator"
import { SidebarTrigger } from "~/components/ui/sidebar"
import { cn } from "~/lib/utils"
import { useCalendarStore } from "~/store/calendar"
// import type {
//     FarmOptions,
//     FertilizerOption,
//     FieldOptions,
//     HeaderAction,
//     LayerKey,
//     LayerOptions,
// } from "./farm.d"

interface FarmHeaderProps {
    farmOptions: FarmOptions
    b_id_farm: string | undefined
    fieldOptions: FieldOptions
    b_id: string | undefined
    layerOptions: LayerOptions[]
    layerSelected: LayerKey | undefined
    fertilizerOptions: FertilizerOption[] | undefined
    p_id: string | undefined
    action: HeaderAction
}

export function BalanceHeader({
    farmOptions,
    b_id_farm,
    fieldOptions,
    b_id,
    layerOptions,
    layerSelected,
    fertilizerOptions,
    p_id,
    action,
}: FarmHeaderProps) {
    const calendar = useCalendarStore((state) => state.calendar)

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                        <BreadcrumbLink href={`/farm/${b_id_farm}/${calendar}/balance`}>Nutriëntenbalans</BreadcrumbLink>
                    </BreadcrumbItem>
                    {farmOptions && farmOptions.length > 0 ? (
                        <>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <DropdownMenu>
                                    <DropdownMenuTrigger className="flex items-center gap-1">
                                        {b_id_farm && farmOptions
                                            ? (farmOptions.find(
                                                  (option) =>
                                                      option.b_id_farm ===
                                                      b_id_farm,
                                              )?.b_name_farm ?? "Unknown farm")
                                            : "Kies een bedrijf"}
                                        <ChevronDown />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        {farmOptions.map((option) => (
                                            <DropdownMenuCheckboxItem
                                                checked={
                                                    b_id_farm ===
                                                    option.b_id_farm
                                                }
                                                key={option.b_id_farm}
                                            >
                                                <NavLink
                                                    to={`/farm/${option.b_id_farm}`}
                                                >
                                                    {option.b_name_farm}
                                                </NavLink>
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </BreadcrumbItem>
                            {fieldOptions && fieldOptions.length > 0 ? (
                                <>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem className="hidden md:block">
                                        <BreadcrumbLink
                                            href={`/farm/${b_id_farm}/${calendar}/field/`}
                                        >
                                            Perceel
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger className="flex items-center gap-1">
                                                {b_id && fieldOptions
                                                    ? (fieldOptions.find(
                                                          (option) =>
                                                              option.b_id ===
                                                              b_id,
                                                      )?.b_name ??
                                                      "Unknown field")
                                                    : "Kies een perceel"}
                                                <ChevronDown />
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start">
                                                {fieldOptions.map((option) => (
                                                    <DropdownMenuCheckboxItem
                                                        checked={
                                                            b_id === option.b_id
                                                        }
                                                        key={option.b_id}
                                                    >
                                                        <NavLink
                                                            to={`/farm/${b_id_farm}/${calendar}/field/${option.b_id}`}
                                                        >
                                                            {option.b_name}
                                                        </NavLink>
                                                    </DropdownMenuCheckboxItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </BreadcrumbItem>
                                </>
                            ) : null}
                            {layerSelected && layerOptions.length > 0 ? (
                                <>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem className="hidden md:block">
                                        <BreadcrumbLink
                                            href={`/farm/${b_id_farm}/${calendar}/atlas/`}
                                        >
                                            Kaarten
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger className="flex items-center gap-1">
                                                {layerSelected &&
                                                layerOptions.length > 0
                                                    ? (layerOptions.find(
                                                          (option) =>
                                                              option.layerKey ===
                                                              layerSelected,
                                                      )?.layerName ??
                                                      "Unknown layer")
                                                    : "Kies een kaartlaag"}
                                                <ChevronDown />
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start">
                                                {layerOptions.map((option) => (
                                                    <DropdownMenuCheckboxItem
                                                        checked={
                                                            layerSelected ===
                                                            option.layerKey
                                                        }
                                                        key={option.layerKey}
                                                    >
                                                        <NavLink
                                                            to={`/farm/${b_id_farm}/${calendar}/atlas/${option.layerKey}`}
                                                        >
                                                            {option.layerName}
                                                        </NavLink>
                                                    </DropdownMenuCheckboxItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </BreadcrumbItem>
                                </>
                            ) : null}
                            {fertilizerOptions &&
                            fertilizerOptions.length > 0 ? (
                                <>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem className="hidden md:block">
                                        <BreadcrumbLink
                                            href={`/farm/${b_id_farm}/fertilizers`}
                                        >
                                            Meststof
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger className="flex items-center gap-1">
                                                {p_id && fertilizerOptions
                                                    ? (fertilizerOptions.find(
                                                          (option) =>
                                                              option.p_id ===
                                                              p_id,
                                                      )?.p_name_nl ??
                                                      "Unknown fertilizer")
                                                    : "Kies een meststof"}
                                                <ChevronDown />
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start">
                                                {fertilizerOptions.map(
                                                    (option) => (
                                                        <DropdownMenuCheckboxItem
                                                            checked={
                                                                p_id ===
                                                                option.p_id
                                                            }
                                                            key={
                                                                option.p_name_nl
                                                            }
                                                        >
                                                            <NavLink
                                                                to={`/farm/${b_id_farm}/fertilizers/${option.p_id}`}
                                                            >
                                                                {
                                                                    option.p_name_nl
                                                                }
                                                            </NavLink>
                                                        </DropdownMenuCheckboxItem>
                                                    ),
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </BreadcrumbItem>
                                </>
                            ) : null}
                        </>
                    ) : null}
                </BreadcrumbList>
            </Breadcrumb>
            {action && (
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
            )}
        </header>
    )
}
