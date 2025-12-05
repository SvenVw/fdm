import { Card, CardContent } from "~/components/ui/card"
import { LoadingSpinner } from "~/components/custom/loadingspinner"

interface ElevationLegendProps {
    min?: number
    max?: number
    loading?: boolean
}

export function ElevationLegend({ min, max, loading }: ElevationLegendProps) {
    return (
        <div className="absolute top-4 left-4 z-10 w-40">
            <Card className="bg-background/90 backdrop-blur-sm shadow-sm">
                <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Hoogte (NAP)
                        </h4>
                        {loading && <LoadingSpinner className="h-3 w-3" />}
                    </div>
                    
                    <div className="flex flex-col gap-1">
                        <div className="flex h-4 w-full rounded border border-border overflow-hidden relative">
                            <div 
                                className="absolute inset-0 w-full h-full" 
                                style={{ 
                                    // BrewerSpectral11 Reversed (Blue -> Red)
                                    background: "linear-gradient(to right, #5e4fa2, #3288bd, #66c2a5, #abdda4, #e6f598, #ffffbf, #fee08b, #fdae61, #f46d43, #d53e4f, #9e0142)" 
                                }} 
                            />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground font-medium font-mono">
                            <span>{min !== undefined ? `${min.toFixed(1)}m` : "Laag"}</span>
                            <span>{max !== undefined ? `${max.toFixed(1)}m` : "Hoog"}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}