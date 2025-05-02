import Decimal from "decimal.js"
import type { FieldInput, NitrogenBalanceInput, NitrogenSupply } from "../types"
import geoblaze from "geoblaze"
import { differenceInCalendarDays } from "date-fns/differenceInCalendarDays"

type DepositonFromDataset = number[] | null

export async function calculateNitrogenSupplyByDeposition(
    field: FieldInput["field"],
    timeFrame: NitrogenBalanceInput["timeFrame"],
    fdmPublicDataUrl: string,
): Promise<NitrogenSupply["deposition"]> {
    // Settings
    const year = "2022"
    const region = "nl"
    const url = `${fdmPublicDataUrl}deposition/${region}/ntot_${year}.tiff`

    // Calculate the centroid of the field
    const b_centroid = field.b_centroid

    // Obtain total Nitrogen deposition values from RIVM map at FDM Public Data Storage
    const depositionFromDataset: DepositonFromDataset = await geoblaze.identify(
        url,
        b_centroid,
    )

    // If location is outside the RIVM return 0
    if (!depositionFromDataset) {
        return {
            total: new Decimal(0),
        }
    }

    // Adjust for the number of days
    const timeFrameDays = new Decimal(
        differenceInCalendarDays(timeFrame.end, timeFrame.start),
    )

    // Return the total amount of Nitrogen deposited in kg N / ha adjusted from the number of days
    const deposition = new Decimal(depositionFromDataset[0])
        .dividedBy(timeFrameDays)
        .times(365)

    return {
        total: deposition,
    }
}
