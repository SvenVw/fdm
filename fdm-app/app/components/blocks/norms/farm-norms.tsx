import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"

interface FarmNormsProps {
    farmNorms: {
        manure: number
        phosphate: number
        nitrogen: number
    }
}

export function FarmNorms({ farmNorms }: FarmNormsProps) {
    return (
        <div className="mb-0">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                {/* <Info className="h-5 w-5 text-blue-600" /> */}
                Bedrijfsniveau
            </h2>
            <div className="grid gap-4 xl:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Stikstof
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {farmNorms.nitrogen} kg N
                        </div>
                        {/* <p className="text-xs text-muted-foreground"></p> */}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Fosfaat
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {farmNorms.phosphate} kg P2O5
                        </div>
                        {/* <p className="text-xs text-muted-foreground"></p> */}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Stiksof uit dierlijke mest
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {farmNorms.manure} kg N
                        </div>
                        {/* <p className="text-xs text-muted-foreground"></p> */}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
