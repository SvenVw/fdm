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
}

// Crop rotation color legend
const cropRotationColorLegend = {
    grass: "#558B2F",
    maize: "#FBC02D",
    cereal: "#C2B280",
    potato: "#8D6E63",
    sugarbeet: "#9B2D30",
    rapeseed: "#D4AC0D",
    clover: "#8BC34A",
    alfalfa: "#7E57C2",
    catchcrop: "#4DD0E1",
    nature: "#00796B",
    starch: "#F57C00",
    other: "#9E9E9E",
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
                    Basisregistratie Gewapercelen.
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
                                        backgroundColor:
                                            cropRotationColorLegend[
                                                cultivation.b_lu_croprotation as keyof typeof cropRotationColorLegend
                                            ] || cropRotationColorLegend.other,
                                        opacity: 0.2,
                                    }}
                                />
                                <span
                                    className="relative h-5 w-5 rounded-full"
                                    style={{
                                        backgroundColor:
                                            cropRotationColorLegend[
                                                cultivation.b_lu_croprotation as keyof typeof cropRotationColorLegend
                                            ] || cropRotationColorLegend.other,
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
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

export function CultivationHistorySkeleton() {
    return (
        <Card className="col-span-1 lg:row-span-2">
            <CardHeader>
                <CardTitle>Gewashistorie</CardTitle>
                <CardDescription>
                    De gewassen van de afgelopen jaren op dit perceel volgens
                    Basisregistratie Gewapercelen.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 text-sm">
                <div className="relative pl-1">
                    {[...Array(3)].map((_, index) => (
                        <div
                            key={index}
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
