import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "../loadingspinner"
import { format } from "date-fns/format"
import { NavLink } from "react-router"
import { Pencil, Trash2 } from "lucide-react"

export function HarvestsList({
    harvests,
    state,
}: { harvests: any[]; state: string }) {
    return (
        <div>
            {/* <div className="text-sm font-medium">Meststoffen</div> */}
            <div className="grid gap-6">
                {harvests && harvests.length > 0 ? (
                    <div className="space-y-8">
                        <div className="space-y-4">
                            {harvests.map((harvest) => (
                                <div
                                    className="grid grid-cols-4 gap-x-3 items-center"
                                    key={harvest.b_id_harvestable}
                                >
                                    <div>
                                        <p className="text-sm font-medium leading-none">
                                            {format(
                                                harvest.b_harvesting_date,
                                                "yyyy-MM-dd",
                                            )}
                                        </p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-sm font-light leading-none">
                                            {`${harvest.harvestable[0].harvestableAnalysis[0].b_lu_yield} ton DS/ha`}
                                        </p>
                                        {/* <p className="text-sm text-muted-foreground">m@example.com</p> */}
                                    </div>
                                    <div className="grid grid-cols-2 justify-self-end gap-x-3">
                                        <div className="">
                                            <Button
                                                variant="default"
                                                aria-label="Bewerken"
                                                asChild
                                            >
                                                <NavLink
                                                    to={`./${harvest.b_id_harvesting}`}
                                                >
                                                    <Pencil />
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
                                                    // handleDelete(
                                                    //     harvest.b_id_harvesting,
                                                    // )
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
                            <Button asChild>
                                <NavLink to="./harvest">
                                    Oogst toevoegen
                                </NavLink>
                            </Button>
                        </div>
                    </div>
                ) : (
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
                )}
            </div>
        </div>
    )
}
