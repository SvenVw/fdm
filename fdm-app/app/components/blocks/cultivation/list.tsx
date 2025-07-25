import { format } from "date-fns/format"
import { NavLink } from "react-router-dom"
import type { Cultivation } from "./types"

interface Harvest {
    b_lu: string
    b_lu_harvest_date: Date
    b_lu_yield: number
    b_lu_n_harvestable: number
}

export function CultivationList({
    cultivations,
    harvests,
}: {
    cultivations: Cultivation[]
    harvests: Harvest[]
}) {
    return (
        <ul>
            <li key={"header"}>
                <div className="grid grid-cols-3 items-center px-4">
                    <div className="col-span-1">
                        <p className="text-sm font-medium leading-none hidden">
                            Gewas
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">
                            Zaaidatum
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">
                            Einddatum
                        </p>
                    </div>
                </div>
            </li>
            {cultivations.map((cultivation) => {
                const numHarvests = harvests.filter(
                    (x) => x.b_lu === cultivation.b_lu,
                ).length
                const harvestText =
                    numHarvests === 0
                        ? "geen oogst"
                        : numHarvests === 1
                          ? "1 oogst"
                          : `${numHarvests} oogsten`
                return (
                    <li key={cultivation.b_lu}>
                        <NavLink
                            to={`./${cultivation.b_lu}`}
                            className={({ isActive }) =>
                                `block p-4 rounded-lg ${
                                    isActive
                                        ? "bg-gray-100 dark:bg-gray-800"
                                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                                }`
                            }
                        >
                            <div className="grid grid-cols-3 items-center gap-1">
                                <div className="col-span-1">
                                    <p className="text-sm font-medium leading-none break-all">
                                        {cultivation.b_lu_name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {harvestText}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground leading-none">
                                        {format(
                                            new Date(cultivation.b_lu_start),
                                            "yyyy-MM-dd",
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground leading-none">
                                        {cultivation.b_lu_end
                                            ? format(
                                                  new Date(
                                                      cultivation.b_lu_end,
                                                  ),
                                                  "yyyy-MM-dd",
                                              )
                                            : "Nog niet beëindigd"}
                                    </p>
                                </div>
                            </div>
                        </NavLink>
                    </li>
                )
            })}
        </ul>
    )
}
