import { FarmTitleSkeleton } from "../farm/farm-title"
import { CultivationHistorySkeleton } from "./cultivation-history"
import { GroundwaterSkeleton } from "./groundwater"
import { FieldDetailsAtlasLayout } from "./layout"
import { SoilTextureSkeleton } from "./soil-texture"

export function FieldDetailsSkeleton() {
    return (
        <FieldDetailsAtlasLayout
            title={<FarmTitleSkeleton />}
            cultivationHistory={<CultivationHistorySkeleton />}
            fieldDetails={<FieldDetailsSkeleton />}
            soilTexture={<SoilTextureSkeleton />}
            groundWater={<GroundwaterSkeleton />}
        />
    )
}
