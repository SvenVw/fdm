import type { ApplicationMethods } from "@svenvw/fdm-data"
import { format } from "date-fns"
import { Button } from "~/components/ui/button"
import { LoadingSpinner } from "../../custom/loadingspinner"
import type { FertilizerApplication } from "./types.d"
import { useFetcher } from "react-router"

export function FertilizerApplicationsList({
    fertilizerApplications,
    applicationMethodOptions,
}: {
    fertilizerApplications: FertilizerApplication[]
    applicationMethodOptions: {
        value: ApplicationMethods
        label: string
    }[]
}) {
    const fetcher = useFetcher()
    const handleDelete = (p_app_id: string | string[]) => {
        if (fetcher.state === "submitting") return

        fetcher.submit({ p_app_id }, { method: "DELETE" })
    }

    return (
        <div className="space-y-4">
            {/* <div className="text-sm font-medium">Meststoffen</div> */}
            <div className="grid gap-6">
                {fertilizerApplications.length > 0 ? (
                    fertilizerApplications.map((application) => (
                        <div
                            className="grid grid-cols-5 gap-x-3 items-center"
                            key={application.p_app_id}
                        >
                            <div className="col-span-2">
                                <p className="text-sm font-medium leading-none">
                                    {application.p_name_nl}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {application.p_app_method
                                        ? applicationMethodOptions.find(
                                              (x) =>
                                                  x.value ===
                                                  application.p_app_method,
                                          )?.label
                                        : "Toedieningsmethode niet bekend"}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground leading-none">
                                    {application.p_app_amount} kg / ha
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground leading-none">
                                    {format(
                                        application.p_app_date,
                                        "yyyy-MM-dd",
                                    )}
                                </p>
                            </div>
                            <div className="justify-self-end">
                                <Button
                                    variant="destructive"
                                    disabled={fetcher.state === "submitting"}
                                    onClick={() => {
                                        if (application.p_app_ids) {
                                            handleDelete(application.p_app_ids)
                                        } else {
                                            handleDelete([application.p_app_id])
                                        }
                                    }}
                                >
                                    {fetcher.state === "submitting" ? (
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
                    ))
                ) : (
                    <div className="mx-auto flex h-full w-full items-center flex-col justify-center space-y-6">
                        <div className="flex flex-col space-y-2 text-center">
                            <h1 className="text-2xl font-semibold tracking-tight">
                                Je hebt nog geen bemesting ingevuld...
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Voeg een bemesting toe om gegevens zoals,
                                meststof, hoeveelheid en datum bij te houden.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
