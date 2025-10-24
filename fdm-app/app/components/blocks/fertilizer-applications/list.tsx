import type { ApplicationMethods } from "@svenvw/fdm-data"
import { format } from "date-fns"
import { useFetcher } from "react-router"
import { Button } from "~/components/ui/button"
import {
    Item,
    ItemActions,
    ItemContent,
    ItemGroup,
    ItemDescription,
    ItemTitle,
    ItemSeparator,
} from "~/components/ui/item"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "~/components/ui/tooltip"
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "~/components/ui/empty"
import { LoadingSpinner } from "../../custom/loadingspinner"
import { Circle, Diamond, Square, Trash, Triangle } from "lucide-react"
import { Lightbulb } from "lucide-react"
import { nl } from "date-fns/locale"
import type { Fertilizer, FertilizerApplication } from "@svenvw/fdm-core"

export function FertilizerApplicationsList({
    fertilizerApplications,
    applicationMethodOptions,
    fertilizers,
    handleDelete,
}: {
    fertilizerApplications: FertilizerApplication[]
    applicationMethodOptions: {
        value: ApplicationMethods
        label: string
    }[]
    fertilizers: Fertilizer[]
    handleDelete: (p_app_id: string | string[]) => void
}) {
    const fetcher = useFetcher()

    return (
        <div className="space-y-4">
            {fertilizerApplications.length > 0 ? (
                <ItemGroup>
                    {fertilizerApplications.map((application) => {
                        const fertilizer = fertilizers.find(
                            (f) => f.p_id === application.p_id,
                        )
                        if (!fertilizer) {
                            return null
                        }

                        return (
                            <div key={application.p_app_id}>
                                <ItemSeparator />
                                <Item size="sm" variant="default">      
                                    <ItemContent>
                                        <ItemTitle className="flex flex-row flex-wrap items-center gap-x-1">
                                            <span>
                                                {fertilizer.p_type ===
                                                "manure" ? (
                                                    <Square className="size-3 text-yellow-600 fill-yellow-600" />
                                                ) : fertilizer.p_type ===
                                                  "mineral" ? (
                                                    <Circle className="size-3 text-sky-600 fill-sky-600" />
                                                ) : fertilizer.p_type ===
                                                  "compost" ? (
                                                    <Triangle className="size-3 text-green-600 fill-green-600" />
                                                ) : (
                                                    <Diamond className="size-3 text-gray-600 fill-gray-600" />
                                                )}
                                            </span>
                                            <span>{application.p_name_nl}</span>
                                            <span className="text-muted-foreground">
                                                {format(
                                                    application.p_app_date,
                                                    "PP",
                                                    {
                                                        locale: nl,
                                                    },
                                                )}
                                            </span>
                                        </ItemTitle>
                                        <ItemDescription>
                                            <p>
                                                {application.p_app_amount} kg /
                                                ha
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {application.p_app_method
                                                    ? applicationMethodOptions.find(
                                                          (x) =>
                                                              x.value ===
                                                              application.p_app_method,
                                                      )?.label
                                                    : "Toedieningsmethode niet bekend"}
                                            </p>
                                        </ItemDescription>
                                    </ItemContent>
                                    <ItemActions>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="destructive"
                                                        size="icon"
                                                        disabled={
                                                            fetcher.state ===
                                                            "submitting"
                                                        }
                                                        onClick={() => {
                                                            if (
                                                                application.p_app_ids
                                                            ) {
                                                                handleDelete(
                                                                    application.p_app_ids,
                                                                )
                                                            } else {
                                                                handleDelete([
                                                                    application.p_app_id,
                                                                ])
                                                            }
                                                        }}
                                                    >
                                                        {fetcher.state ===
                                                        "submitting" ? (
                                                            <LoadingSpinner />
                                                        ) : (
                                                            <Trash className="size-4" />
                                                        )}
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Verwijder</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </ItemActions>
                                </Item>
                            </div>
                        )
                    })}
                    <ItemSeparator />
                </ItemGroup>
            ) : (
                <Empty className="col-span-full">
                    <EmptyHeader>
                        <EmptyMedia>
                            <Lightbulb className="size-6" />
                        </EmptyMedia>
                        <EmptyTitle>
                            Je hebt nog geen bemesting ingevuld...
                        </EmptyTitle>
                        <EmptyDescription>
                            Voeg een bemesting toe om gegevens zoals, meststof,
                            hoeveelheid en datum bij te houden.
                        </EmptyDescription>
                    </EmptyHeader>
                </Empty>
            )}
        </div>
    )
}
