import { FarmTitleSkeleton } from "../farm/farm-title"
import { CultivationHistorySkeleton } from "./cultivation-history"
import { FieldDetailsSkeleton } from "./field-details"
import { GroundwaterSkeleton } from "./groundwater"
import { FieldDetailsAtlasLayout } from "./layout"
import { SoilTextureSkeleton } from "./soil-texture"

export function FieldDetailsAtlasSkeleton() {
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
