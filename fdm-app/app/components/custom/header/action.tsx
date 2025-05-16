import { cn } from "@/app/lib/utils"
import { NavLink } from "react-router"
import { Button } from "../../ui/button"

export function HeaderAction(label: string, to: string, disabled: boolean) {
    return (
        <div className="ml-auto">
            <NavLink
                to={to}
                className={cn("ml-auto", {
                    "pointer-events-none": disabled,
                })}
            >
                <Button disabled={disabled}>{label}</Button>
            </NavLink>
        </div>
    )
}
