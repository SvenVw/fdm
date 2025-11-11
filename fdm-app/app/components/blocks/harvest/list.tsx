import type { Harvest } from "@svenvw/fdm-core"
import { format } from "date-fns/format"
import { NavLink } from "react-router"
import type { HarvestableType } from "./types"
import { nl } from "date-fns/locale/nl"

export function HarvestsList({
    harvests,
    b_lu_harvestable,
}: {
    harvests: Harvest[]
    b_lu_harvestable: HarvestableType
    state: string
}) {
    let canAddHarvest = false
    if (b_lu_harvestable === "once" && harvests.length === 0) {
        canAddHarvest = true
    }
    if (b_lu_harvestable === "multiple") {
        canAddHarvest = true
    }

    return (
        <div>
            {harvests && harvests.length > 0 ? (
                <div className="space-y-6">
                    <div className="space-y-3">
                        {harvests.map((harvest) => (
                            <div
                                className="flex flex-cols items-center"
                                key={harvest.b_id_harvesting}
                            >
                                <NavLink
                                    to={`./harvest/${harvest.b_id_harvesting}`}
                                >
                                    <p className="text-sm font-medium leading-none hover:underline">
                                        {format(
                                            harvest.b_lu_harvest_date,
                                            "PPP",
                                            { locale: nl },
                                        )}
                                    </p>
                                </NavLink>

                                <div className="ml-auto">
                                    <p className="text-sm text-muted-foreground leading-none">
                                        {`${harvest.harvestable?.harvestable_analyses?.[0]?.b_lu_yield ?? "–"} kg DS/ha`}
                                    </p>
                                    {/* <p className="text-sm text-muted-foreground">m@example.com</p> */}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : canAddHarvest ? (
                <div className="mx-auto flex h-full w-full items-center flex-col justify-center space-y-6">
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Dit gewas heeft nog geen oogst
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Voeg een oogst toe om gegevens zoals, opbrengst,
                            datum en gehaltes bij te houden.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="mx-auto flex h-full w-full items-center flex-col justify-center space-y-6">
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Dit gewas is niet oogstbaar
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Kies een einddatum om aan te geven wanneer dit gewas
                            is beëindigd.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
