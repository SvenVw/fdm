import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { Skeleton } from "~/components/ui/skeleton"

export function GroundwaterCard({
    groundwaterEstimates,
}: {
    groundwaterEstimates: {
        b_gwl_class?: string | null
        b_gwl_ghg?: number | null
        b_gwl_glg?: number | null
    }
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Grondwater</CardTitle>
                <CardDescription>
                    De geschatte grondwaterstanden voor dit perceel.
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
                                {groundwaterEstimates.b_gwl_class ?? "Onbekend"}
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
                                {groundwaterEstimates.b_gwl_ghg ?? "Onbekend"}
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
                                {groundwaterEstimates.b_gwl_glg ?? "Onbekend"}
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

export function GroundwaterSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Grondwater</CardTitle>
                <CardDescription>
                    De geschatte grondwaterstanden voor dit perceel.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
                {["class", "ghg", "glg"].map((key) => (
                    <Card key={key}>
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
