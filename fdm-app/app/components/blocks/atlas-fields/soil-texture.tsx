import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"

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
                <CardTitle>Bodemtextuur</CardTitle>
                <CardDescription>
                    De geschatte bodemtextuur van dit perceel.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
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
