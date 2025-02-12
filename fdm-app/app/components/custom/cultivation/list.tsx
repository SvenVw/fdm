import { Pencil, Trash2 } from "lucide-react"
import { LoadingSpinner } from "../loadingspinner"
import { Button } from "@/components/ui/button"
import { NavLink, useFetcher } from "react-router"
import { format } from "date-fns/format"
import type { Cultivation } from "./types"

export function CultivationList({
    cultivations,
    harvests,
}: { cultivations: Cultivation[]; harvests: any[] }) {
    const fetcher = useFetcher()

    const handleDelete = (b_lu: string | string[]) => {
        if (fetcher.state === "submitting") return

        fetcher.submit({ b_lu }, { method: "delete" })
    }

    console.log(harvests)
    return (
        <div className="space-y-4">
            {/* <div className="text-sm font-medium">Meststoffen</div> */}
            <div className="grid gap-6">
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
                        <div
                            className="grid grid-cols-5 items-center"
                            key={cultivation.b_lu}
                        >
                            <div className="col-span-2">
                                <p className="text-sm font-medium leading-none">
                                    {cultivation.b_lu_name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {harvestText}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-light leading-none">
                                    {format(
                                        cultivation.b_sowing_date,
                                        "yyyy-MM-dd",
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-light leading-none">
                                    {cultivation.b_terminating_date
                                        ? format(
                                              cultivation.b_terminating_date,
                                              "yyyy-MM-dd",
                                          )
                                        : "Nog niet beëindigd"}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 justify-self-end gap-x-3">
                                <div className="">
                                    <Button
                                        variant="default"
                                        aria-label="Bewerken"
                                        asChild
                                    >
                                        <NavLink to={`./${cultivation.b_lu}`}>
                                            <Pencil />
                                        </NavLink>
                                    </Button>
                                </div>
                                <div className="">
                                    <Button
                                        variant="destructive"
                                        disabled={
                                            fetcher.state === "submitting"
                                        }
                                        onClick={() => {
                                            if (cultivation.b_lus) {
                                                handleDelete(cultivation.b_lus)
                                            } else {
                                                handleDelete([cultivation.b_lu])
                                            }
                                        }}
                                        aria-label="Verwijderen"
                                    >
                                        {fetcher.state === "submitting" ? (
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
                    )
                })}
            </div>
        </div>
    )
}
