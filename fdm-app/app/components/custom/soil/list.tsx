import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { LoadingSpinner } from "@/components/custom/loadingspinner"

export function SoilAnalysesList({
    soilAnalyses,
    fetcher,
}: {
    soilAnalyses: any[]
    fetcher: {
        state: string
        submit: (
            data: { a_id: string},
            options: { method: string },
        ) => void
    }
}) {
    const handleDelete = (a_id: string) => {
        if (fetcher.state === "submitting") return

        fetcher.submit({ a_id }, { method: "DELETE" })
    }
    return (
        <div className="space-y-4">
            {/* <div className="text-sm font-medium">Meststoffen</div> */}
            <div className="grid gap-6">
                {soilAnalyses.map((analysis) => (
                    <div
                        className="grid grid-cols-3 gap-x-3 items-center"
                        key={analysis.a_id}
                    >
                        <div className="col-span-1">
                            <p className="text-sm font-medium leading-none">
                                {analysis.a_source}
                            </p>
                            <p className="text-sm text-muted-foreground">Inschatting</p>
                        </div>
                        <div>
                            <p className="text-sm font-light leading-none">
                                {format(analysis.b_sampling_date, "yyyy-MM-dd")}
                            </p>
                        </div>
                        <div className="justify-self-end">
                            <Button
                                variant="destructive"
                                disabled={fetcher.state === "submitting"}
                                onClick={() => {
                                    handleDelete(analysis.a_id)
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
