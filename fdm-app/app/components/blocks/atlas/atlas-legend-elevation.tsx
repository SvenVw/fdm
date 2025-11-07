import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"

export function LegendElevation({
    min,
    max,
    palette,
    hoverValue,
}: {
    min: number
    max: number
    palette: any
    hoverValue?: number
}) {
    return (
        <Card className="absolute top-4 left-4 w-64">
            <CardHeader>
                <CardTitle>Hoogte (m)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between">
                    <span>{min.toFixed(1)}</span>
                    <span>{max.toFixed(1)}</span>
                </div>
                <div
                    className="w-full h-4 rounded-md"
                    style={{
                        background: `linear-gradient(to right, ${palette.domain().map((d: number) => palette(d)).join(",")})`,
                    }}
                />
                {hoverValue && (
                    <div className="text-center mt-2">
                        {hoverValue.toFixed(1)} m
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
