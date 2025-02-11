import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "../loadingspinner"
import { format } from "date-fns/format"
import { NavLink } from "react-router"

export function HarvestsList({
    harvests,
    state,
}: { harvests: any[]; state: string }) {
    return (
        <div className="space-y-4">
            {/* <div className="text-sm font-medium">Meststoffen</div> */}
            <div className="grid gap-6">
                {harvests && harvests.length > 0 ? (
                    <div>
                        <div>
                            {harvests.map((harvest) => (
                                <div
                                    className="grid grid-cols-5 gap-x-3 items-center"
                                    key={harvest.b_id_harvestable}
                                >
                                    <div>
                                        <p className="text-sm font-light leading-none">
                                            {format(
                                                harvest.b_date_harvesting,
                                                "yyyy-MM-dd",
                                            )}
                                        </p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-sm font-medium leading-none">
                                            {harvest.b_lu_yield}
                                        </p>
                                        {/* <p className="text-sm text-muted-foreground">m@example.com</p> */}
                                    </div>
                                    <div className="justify-self-end">
                                        <Button
                                            variant="destructive"
                                            disabled={state === "submitting"}
                                            onClick={() => {
                                                // handleDelete(harvest.b_id_harvestable)
                                            }}
                                        >
                                            {state === "submitting" ? (
                                                <div className="flex items-center space-x-2">
                                                    <LoadingSpinner />
                                                    <span>Verwijderen...</span>
                                                </div>
                                            ) : (
                                                "Verwijder"
                                            )}
                                        </Button>
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
