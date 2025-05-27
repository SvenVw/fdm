import { cn } from "@/app/lib/utils"
import { NavLink } from "react-router"
import { Button } from "../../ui/button"

interface HeaderActionProps {
  label: string
  to: string
  disabled: boolean
}

export function HeaderAction({ label, to, disabled }: HeaderActionProps): JSX.Element {
    return (
        <div className="ml-auto">
            <NavLink
                to={to}
                className={cn({
                    "pointer-events-none": disabled,
                })}
            >
                <Button disabled={disabled}>{label}</Button>
            </NavLink>
        </div>
    )
}
