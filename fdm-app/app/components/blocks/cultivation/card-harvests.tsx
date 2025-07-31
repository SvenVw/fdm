import type { Harvest } from "@svenvw/fdm-core"
import { NavLink } from "react-router"
import { HarvestsList } from "~/components/blocks/harvest/list"
import type { HarvestableType } from "~/components/blocks/harvest/types"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"

export function CultivationHarvestsCard({
    harvests,
    b_lu_harvestable,
}: {
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
                    {b_lu_harvestable === "multiple" ? "Oogsten" : "Oogst"}
                </CardTitle>
                <div className="flex justify-between">
                    <NavLink
                        to="./harvest/new"
                        onClick={(e) => {
                            if (!canAddHarvest) {
                                e.preventDefault()
                            }
                        }}
                        className={!canAddHarvest ? "cursor-not-allowed" : ""}
                    >
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
