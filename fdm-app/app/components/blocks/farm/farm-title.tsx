import { NavLink } from "react-router"
import { Button } from "~/components/ui/button"
import { Separator } from "~/components/ui/separator"
import { Skeleton } from "~/components/ui/skeleton"

interface FarmTitleProps {
    title: string
    description: string
    action?: {
        to: string
        label: string
    }
}

export function FarmTitle({ title, description, action }: FarmTitleProps) {
    return (
        <div className="space-y-6 p-4 md:px-6 md:py-8 pb-0">
            <div className="flex flex-col xl:flex-row xl:items-center gap-4">
                <div className="space-y-0.5 min-w-0 flex-1">
                    <h2 className="text-2xl font-bold tracking-tight truncate xl:whitespace-normal">
                        {title}
                    </h2>
                    <p className="text-muted-foreground break-words">{description}</p>
                </div>
                {action && (
                    <div className="ml-auto">
                        <NavLink to={action.to} className="ml-auto">
                            <Button>{action.label}</Button>
                        </NavLink>
                    </div>
                )}
            </div>
            <Separator className="my-6" />
        </div>
    )
}

export function FarmTitleSkeleton() {
    return (
        <div className="space-y-6 p-4 md:px-6 md:py-8 pb-0">
            <div className="flex items-center gap-4">
                <div className="space-y-0.5 ">
                    <Skeleton className="h-8 w-[200px] md:w-64" />
                    <Skeleton className="h-5 w-[250px] md:w-96" />
                </div>
                <div className="ml-auto">
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>
            <Separator className="my-6" />
        </div>
    )
}
