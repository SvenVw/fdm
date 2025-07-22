import type { Harvest } from "@svenvw/fdm-core"
import { format } from "date-fns/format"
import { Eye, Trash2 } from "lucide-react"
import { NavLink, useFetcher } from "react-router"
import { Button } from "~/components/ui/button"
import { LoadingSpinner } from "../../custom/loadingspinner"
import type { HarvestableType } from "./types"

export function HarvestsList({
    harvests,
    b_lu_harvestable,
    state,
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
                                <NavLink to={`./harvest/${harvest.b_id_harvesting}`}>
                                    <p className="text-sm font-medium leading-none hover:underline">
                                        {format(
                                            harvest.b_lu_harvest_date,
                                            "yyyy-MM-dd",
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
                    {canAddHarvest ? (
                        <div>
                            <Button
                                aria-label="Voeg oogst toe"
                                disabled={!canAddHarvest}
                                asChild
                            >
                                <NavLink
                                    to="./harvest"
                                    className={
                                        !canAddHarvest
                                            ? "pointer-events-none opacity-50"
                                            : ""
                                    }
                                >
                                    Oogst toevoegen
                                </NavLink>
                            </Button>
                        </div>
                    ) : null}
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
                    <Button asChild>
                        <NavLink to="./harvest">Oogst toevoegen</NavLink>
                    </Button>
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
