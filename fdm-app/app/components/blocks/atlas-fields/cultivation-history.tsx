import { getCultivationColor } from "~/components/custom/cultivation-colors"
import { Badge } from "~/components/ui/badge"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { Skeleton } from "~/components/ui/skeleton"

type CultivationHistory = {
    year: number
    b_lu_catalogue: string
    b_lu_name?: string
    b_lu_croprotation?: string
    b_lu_rest_oravib?: boolean
}

export function CultivationHistoryCard({
    cultivationHistory,
}: {
    cultivationHistory: CultivationHistory[]
}) {
    return (
        <Card className="col-span-1 lg:row-span-2">
            <CardHeader>
                <CardTitle>Gewashistorie</CardTitle>
                <CardDescription>
                    De gewassen van de afgelopen jaren op dit perceel volgens
                    Basisregistratie Gewaspercelen.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 text-sm">
                <div className="relative pl-1">
                    {cultivationHistory.map((cultivation, index) => (
                        <div
                            key={cultivation.year}
                            className="flex items-start space-x-4 pb-6"
                        >
                            <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
                                <span
                                    className="absolute h-full w-full rounded-full"
                                    style={{
                                        backgroundColor: getCultivationColor(
                                            cultivation.b_lu_croprotation,
                                        ),
                                        opacity: 0.2,
                                    }}
                                />
                                <span
                                    className="relative h-5 w-5 rounded-full"
                                    style={{
                                        backgroundColor: getCultivationColor(
                                            cultivation.b_lu_croprotation,
                                        ),
                                    }}
                                />
                                {index !== cultivationHistory.length - 1 && (
                                    <div className="absolute left-1/2 top-full h-6 w-0.5 -translate-x-1/2 transform bg-gray-200" />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-medium text-gray-900">
                                    {cultivation.b_lu_name}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {cultivation.year}
                                </p>
                            </div>
                            <div>
                                {cultivation.b_lu_rest_oravib === true ? (
                                    <Badge variant={"secondary"}>
                                        Rustgewas
                                    </Badge>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

export function CultivationHistorySkeleton() {
    const SKELETON_KEYS = ["sk-1", "sk-2", "sk-3"] as const

    return (
        <Card className="col-span-1 lg:row-span-2">
            <CardHeader>
                <CardTitle>Gewashistorie</CardTitle>
                <CardDescription>
                    De gewassen van de afgelopen jaren op dit perceel volgens
                    Basisregistratie Gewaspercelen.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 text-sm">
                <div className="relative pl-1">
                    {SKELETON_KEYS.map((key) => (
                        <div
                            key={key}
                            className="flex items-start space-x-4 pb-6"
                        >
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="min-w-0 flex-1 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
