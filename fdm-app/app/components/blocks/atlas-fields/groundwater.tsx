import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { Skeleton } from "~/components/ui/skeleton"

export function GroundWaterCard({
    groundWaterEstimates,
}: {
    groundWaterEstimates: any
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Grondwater</CardTitle>
                <CardDescription>
                    De geschatte grondwaterstanden van dit perceel.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid lg:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 space-x-2">
                        <CardTitle className="text-sm font-medium break-all">
                            Grondwaterklasse
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-baseline space-x-2">
                            <div className="text-2xl font-bold">
                                {groundWaterEstimates.b_gwl_class}
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 space-x-2">
                        <CardTitle className="text-sm font-medium">
                            GHG
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-baseline space-x-2">
                            <div className="text-2xl font-bold">
                                {groundWaterEstimates.b_gwl_ghg}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                cm-mv
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 space-x-2">
                        <CardTitle className="text-sm font-medium">
                            GLG
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-baseline space-x-2">
                            <div className="text-2xl font-bold">
                                {groundWaterEstimates.b_gwl_glg}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                cm-mv
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </CardContent>
        </Card>
    )
}

export function GroundWaterSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Grondwater</CardTitle>
                <CardDescription>
                    De geschatte grondwaterstanden van dit perceel.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
                {[...Array(3)].map((_, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 space-x-2">
                            <Skeleton className="h-4 w-1/4" />
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Skeleton className="h-6 w-1/2" />
                            <Skeleton className="h-3 w-1/4" />
                        </CardContent>
                    </Card>
                ))}
            </CardContent>
        </Card>
    )
}
