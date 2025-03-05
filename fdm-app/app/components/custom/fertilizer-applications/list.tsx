import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { LoadingSpinner } from "../loadingspinner"
import type { FertilizerApplication } from "./types.d"

/**
 * Renders a list of fertilizer applications with delete functionality.
 *
 * The component displays each fertilizer application's name, application amount
 * (in kg/ha), and formatted application date. Each entry includes a delete button
 * that triggers a DELETE submission via the provided fetcher. The delete action is
 * disabled while a submission is in progress.
 */
export function FertilizerApplicationsList({
    fertilizerApplications,
    fetcher,
}: {
    fertilizerApplications: FertilizerApplication[]
    fetcher: {
        state: string
        submit: (
            data: { p_app_id: string | string[] },
            options: { method: string },
        ) => void
    }
}) {
    const handleDelete = (p_app_id: string | string[]) => {
        if (fetcher.state === "submitting") return

        fetcher.submit({ p_app_id }, { method: "DELETE" })
    }
    return (
        <div className="space-y-4">
            {/* <div className="text-sm font-medium">Meststoffen</div> */}
            <div className="grid gap-6">
                {fertilizerApplications.map((application) => (
                    <div
                        className="grid grid-cols-5 gap-x-3 items-center"
                        key={application.p_app_id}
                    >
                        <div className="col-span-2">
                            <p className="text-sm font-medium leading-none">
                                {application.p_name_nl}
                            </p>
                            {/* <p className="text-sm text-muted-foreground">m@example.com</p> */}
                        </div>
                        <div>
                            <p className="text-sm font-light leading-none">
                                {application.p_app_amount} kg / ha
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-light leading-none">
                                {format(application.p_app_date, "yyyy-MM-dd")}
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
                ))}
            </div>
        </div>
    )
}
