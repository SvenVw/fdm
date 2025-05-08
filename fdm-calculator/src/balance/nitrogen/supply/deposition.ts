import Decimal from "decimal.js"
import type { FieldInput, NitrogenBalanceInput, NitrogenSupply } from "../types"
import { identify } from "geoblaze"
import { differenceInCalendarDays } from "date-fns/differenceInCalendarDays"

type DepositonFromDataset = number[] | null

/**
 * Calculates the amount of nitrogen supplied through atmospheric deposition for a given field and time frame.
 *
 * This function uses the geoblaze library to identify the nitrogen deposition value at the field's centroid
 * from a raster dataset (TIFF file) provided by RIVM (Netherlands National Institute for Public Health and the Environment).
 * It adjusts the total deposition based on the number of days in the specified time frame.
 *
 * @param field - The field for which to calculate nitrogen deposition.
 *                  The field object must include the `b_centroid` property, which represents the field's centroid coordinates.
 * @param timeFrame - The time frame for which to calculate nitrogen deposition.
 *                      The timeFrame object must include `start` and `end` properties, which are Date objects representing the start and end dates of the period.
 * @param fdmPublicDataUrl - The base URL for accessing FDM public data, including the deposition raster dataset.
 * @returns A promise that resolves with an object containing the total nitrogen deposition for the field in kg N / ha.
 *          If the location is outside the RIVM dataset, it returns 0.
 */
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
    const depositionFromDataset: DepositonFromDataset = await identify(
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
    const timeFrameFraction = new Decimal(timeFrameDays).dividedBy(365)

    // Return the total amount of Nitrogen deposited in kg N / ha adjusted from the number of days
    const deposition = new Decimal(depositionFromDataset[0]).times(
        timeFrameFraction,
    )

    return {
        total: deposition,
    }
}
