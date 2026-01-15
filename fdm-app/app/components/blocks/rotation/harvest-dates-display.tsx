import { format } from "date-fns"
import { nl } from "date-fns/locale/nl"
import React from "react"
import type { RotationExtended } from "./columns"

type HarvestDatesDisplayProps = {
    cultivation: RotationExtended
}

export const HarvestDatesDisplay: React.FC<HarvestDatesDisplayProps> = ({
    cultivation,
}) => {
    const resolved_b_lu_harvest_date =
        cultivation.type === "field" ? cultivation.b_lu_harvest_date : null
    const formattedHarvestDates = React.useMemo(() => {
        const b_lu_harvest_date =
            cultivation.type === "field"
                ? (resolved_b_lu_harvest_date as Date[])
                : cultivation.fields.flatMap((field) => field.b_lu_harvest_date)
        if (b_lu_harvest_date.length === 1) {
            return (
                <p className="text-muted-foreground whitespace-nowrap">
                    {format(b_lu_harvest_date[0], "PP", { locale: nl })}
                </p>
            )
        }

        if (
            b_lu_harvest_date.length > 1 &&
            cultivation.b_lu_harvestable === "once"
        ) {
            const b_lu_harvest_date_sorted = [...b_lu_harvest_date].sort(
                (a, b) => a.getTime() - b.getTime(),
            )
            const firstDate = b_lu_harvest_date_sorted[0]
            const lastDate =
                b_lu_harvest_date_sorted[b_lu_harvest_date_sorted.length - 1]

            return (
                <p className="text-muted-foreground whitespace-nowrap">
                    {firstDate.getTime() === lastDate.getTime()
                        ? `${format(firstDate, "PP", { locale: nl })}`
                        : `${format(firstDate, "PP", { locale: nl })} - ${format(lastDate, "PP", { locale: nl })}`}
                </p>
            )
        }
        if (
            b_lu_harvest_date.length > 1 &&
            cultivation.b_lu_harvestable === "multiple"
        ) {
            const b_lu_harvest_date_per_field =
                cultivation.type === "field"
                    ? [resolved_b_lu_harvest_date as Date[]]
                    : cultivation.fields.map((field) => field.b_lu_harvest_date)

            const harvestsByOrder: Date[][] = []
            for (const harvestDates of b_lu_harvest_date_per_field) {
                const harvestDatesSorted = [...harvestDates].sort(
                    (a, b) => a.getTime() - b.getTime(),
                )
                for (let i = 0; i < harvestDatesSorted.length; i++) {
                    if (!harvestsByOrder[i]) {
                        harvestsByOrder[i] = []
                    }
                    harvestsByOrder[i].push(harvestDatesSorted[i])
                }
            }

            return (
                <div className="flex items-start flex-col space-y-2">
                    {harvestsByOrder.map((harvestDates, idx) => {
                        // harvestDates are already sorted from the previous loop
                        const firstDate = harvestDates[0]
                        const lastDate = harvestDates[harvestDates.length - 1]
                        if (
                            harvestDates.length === 1 ||
                            firstDate.getTime() === lastDate.getTime()
                        ) {
                            return (
                                <p
                                    key={idx}
                                    className="text-muted-foreground whitespace-nowrap"
                                >
                                    {`${idx + 1}e ${cultivation.b_lu_croprotation === "grass" ? "snede" : "oogst"}:`}
                                    <br />
                                    {format(firstDate, "PP", {
                                        locale: nl,
                                    })}
                                </p>
                            )
                        }
                        return (
                            <p
                                key={idx}
                                className="text-muted-foreground whitespace-nowrap"
                            >
                                {`${idx + 1}e ${cultivation.b_lu_croprotation === "grass" ? "snede" : "oogst"}:`}
                                <br />
                                {`${format(firstDate, "PP", { locale: nl })} - ${format(lastDate, "PP", { locale: nl })}`}
                            </p>
                        )
                    })}
                </div>
            )
        }
        return null // Should not happen
    }, [
        cultivation.type,
        resolved_b_lu_harvest_date,
        cultivation.fields,
        cultivation.b_lu_harvestable,
        cultivation.b_lu_croprotation,
    ])

    return formattedHarvestDates
}
