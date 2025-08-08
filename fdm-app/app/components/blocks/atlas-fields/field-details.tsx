import { Info } from "lucide-react"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { Skeleton } from "~/components/ui/skeleton"

export function FieldDetailsCard({ fieldDetails }: { fieldDetails: any }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Perceeldetails</CardTitle>
                <CardDescription>De details van dit perceel.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 space-x-2">
                        <CardTitle className="text-sm font-medium">
                            Oppervlakte
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-baseline space-x-2">
                            <div className="text-2xl font-bold">
                                {fieldDetails.b_area}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                ha
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 space-x-2">
                        <CardTitle className="text-sm font-medium">
                            Regio (RVO Tabel 2)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-baseline space-x-2">
                            <div className="text-2xl font-bold">
                                {fieldDetails.regionTable2}
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <div className="grid grid-cols-3 col-span-2 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 space-x-2">
                            <CardTitle className="text-sm font-medium">
                                NV-Gebied
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex items-baseline space-x-2">
                                <div className="text-2xl font-bold">
                                    {fieldDetails.isNvGebied ? "Ja" : "Nee"}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 space-x-2">
                            <CardTitle className="text-sm font-medium">
                                Grondwaterbeschermingsgebied
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex items-baseline space-x-2">
                                <div className="text-2xl font-bold">
                                    {fieldDetails.isGWBGGebied ? "Ja" : "Nee"}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 space-x-2">
                            <CardTitle className="text-sm font-medium">
                                Natura 2000
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex items-baseline space-x-2">
                                <div className="text-2xl font-bold">
                                    {fieldDetails.isNatura2000Area
                                        ? "Ja"
                                        : "Nee"}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </CardContent>
            <CardFooter className="flex items-center justify-start space-x-2 text-sm text-muted-foreground">
                <Info className="h-4" />
                <p>De gebieden gelden voor 2025</p>
            </CardFooter>
        </Card>
    )
}

export function FieldDetailsSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Perceeldetails</CardTitle>
                <CardDescription>De details van dit perceel.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 space-x-2">
                        <Skeleton className="h-4 w-1/4" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-3 w-1/4" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 space-x-2">
                        <Skeleton className="h-4 w-1/4" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-3 w-1/4" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 space-x-2">
                        <Skeleton className="h-4 w-1/4" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-3 w-1/4" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 space-x-2">
                        <Skeleton className="h-4 w-1/4" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-3 w-1/4" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 space-x-2">
                        <Skeleton className="h-4 w-1/4" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-3 w-1/4" />
                    </CardContent>
                </Card>
            </CardContent>
        </Card>
    )
}
