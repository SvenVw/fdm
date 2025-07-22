import { Harvest, Cultivation } from "@svenvw/fdm-core"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { HarvestsList } from "../harvest/list"
import type { HarvestableType } from "../harvest/types"
import { Button } from "../../ui/button"
import { NavLink } from "react-router"

export function CultivationHarvestsCard({
    harvests,
    b_lu_harvestable,
}: {
    cultivation: Cultivation
    harvests: Harvest[]
    b_lu_harvestable: HarvestableType
}) {
    let canAddHarvest = false
    if (b_lu_harvestable === "once" && harvests.length === 0) {
        canAddHarvest = true
    }
    if (b_lu_harvestable === "multiple") {
        canAddHarvest = true
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-semibold tracking-tight text-gray-900">
                    Oogsten
                </CardTitle>
                <div className="flex justify-between">
                    <NavLink to="./harvest">
                        <Button variant="default" disabled={!canAddHarvest}>
                            Oogst toevoegen
                        </Button>
                    </NavLink>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <HarvestsList
                    harvests={harvests}
                    b_lu_harvestable={b_lu_harvestable}
                    state={"active"}
                />
            </CardContent>
        </Card>
    )
}
