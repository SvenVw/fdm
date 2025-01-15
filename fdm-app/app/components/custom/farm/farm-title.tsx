import { Separator } from "@/components/ui/separator"

interface FarmTitleProps {
    title: string,
    description: string
}

export function FarmTitle({ title, description }: FarmTitleProps) {

    return (
        <div className="space-y-6 p-10 pb-0">
            <div className="flex items-center">
                <div className="space-y-0.5">
                    <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                    <p className="text-muted-foreground">
                        {description}
                    </p>
                </div>
            </div>
            <Separator className="my-6" />
        </div>
    )
}