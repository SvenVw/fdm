import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { Skeleton } from "~/components/ui/skeleton"

export function SoilTextureCard({
    soilParameterEstimates,
}: {
    soilParameterEstimates: {
        a_clay_mi: number
        a_silt_mi: number
        a_sand_mi: number
    }
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Textuur</CardTitle>
                <CardDescription>
                    De geschatte textuur van de bodem voor dit perceel.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid lg:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 space-x-2">
                        <CardTitle className="text-sm font-medium">
                            Klei
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-baseline space-x-2">
                            <div className="text-2xl font-bold">
                                {soilParameterEstimates.a_clay_mi}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                %
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 space-x-2">
                        <CardTitle className="text-sm font-medium">
                            Silt
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-baseline space-x-2">
                            <div className="text-2xl font-bold">
                                {soilParameterEstimates.a_silt_mi}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                %
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 space-x-2">
                        <CardTitle className="text-sm font-medium">
                            Zand
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-baseline space-x-2">
                            <div className="text-2xl font-bold">
                                {soilParameterEstimates.a_sand_mi}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                %
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </CardContent>
        </Card>
    )
}

export function SoilTextureSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Textuur</CardTitle>
                <CardDescription>
                    De geschatte textuur van de bodem voor dit perceel.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
                {["clay", "silt", "sand"].map((key) => (
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
