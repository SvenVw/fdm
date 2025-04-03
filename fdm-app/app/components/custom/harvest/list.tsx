import { format } from "date-fns/format"
import { Eye, Trash2 } from "lucide-react"
import { NavLink, useFetcher } from "react-router"
import { Button } from "~/components/ui/button"
import { LoadingSpinner } from "../loadingspinner"
import type { Harvest, HarvestableType } from "./types"

export function HarvestsList({
    harvests,
    b_lu_harvestable,
    state,
}: { harvests: Harvest[]; b_lu_harvestable: HarvestableType; state: string }) {
    const fetcher = useFetcher()

    const handleDelete = (b_id_harvesting: string | string[]) => {
        if (fetcher.state === "submitting") return

        fetcher.submit({ b_id_harvesting }, { method: "delete" })
    }

    let canAddHarvest = false
    if (b_lu_harvestable === "once" && harvests.length === 0) {
        canAddHarvest = true
    }
    if (b_lu_harvestable === "multiple") {
        canAddHarvest = true
    }

    return (
        <div>
            {/* <div className="text-sm font-medium">Meststoffen</div> */}
            <div className="grid gap-6">
                {harvests && harvests.length > 0 ? (
                    <div className="space-y-6">
                        <div className="space-y-3">
                            {harvests.map((harvest) => (
                                <div
                                    className="grid grid-cols-4 gap-x-3 items-center"
                                    key={harvest.b_id_harvesting}
                                >
                                    <div>
                                        <p className="text-sm font-medium leading-none">
                                            {format(
                                                harvest.b_lu_harvest_date,
                                                "yyyy-MM-dd",
                                            )}
                                        </p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-sm font-light leading-none">
                                            {`${harvest.harvestables[0].harvestable_analyses[0].b_lu_yield} kg DS/ha`}
                                        </p>
                                        {/* <p className="text-sm text-muted-foreground">m@example.com</p> */}
                                    </div>
                                    <div className="grid grid-cols-2 justify-self-end gap-x-3">
                                        <div className="">
                                            <Button
                                                variant="default"
                                                aria-label="Beijken"
                                                asChild
                                            >
                                                <NavLink
                                                    to={`./harvest/${harvest.b_id_harvesting}`}
                                                >
                                                    <Eye />
                                                </NavLink>
                                            </Button>
                                        </div>
                                        <div className="">
                                            <Button
                                                variant="destructive"
                                                disabled={
                                                    state === "submitting"
                                                }
                                                onClick={() => {
                                                    if (
                                                        harvest.b_ids_harvesting
                                                    ) {
                                                        handleDelete(
                                                            harvest.b_ids_harvesting,
                                                        )
                                                    } else {
                                                        handleDelete([
                                                            harvest.b_id_harvesting,
                                                        ])
                                                    }
                                                }}
                                                aria-label="Verwijderen"
                                            >
                                                {state === "submitting" ? (
                                                    <div className="flex items-center space-x-2">
                                                        <LoadingSpinner />
                                                    </div>
                                                ) : (
                                                    <Trash2 />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
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
                    </div>
                ) : canAddHarvest ? (
                    <div className="mx-auto flex h-full w-full items-center flex-col justify-center space-y-6 sm:w-[350px]">
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
                    <div className="mx-auto flex h-full w-full items-center flex-col justify-center space-y-6 sm:w-[350px]">
                        <div className="flex flex-col space-y-2 text-center">
                            <h1 className="text-2xl font-semibold tracking-tight">
                                Dit gewas is niet oogstbaar
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Kies een einddatum om aan te geven wanneer dit
                                gewas is beëindigd.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
