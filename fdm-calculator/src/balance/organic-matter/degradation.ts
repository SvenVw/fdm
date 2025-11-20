import Decimal from "decimal.js"
import type {
    OrganicMatterDegradation,
    FieldInput,
    CultivationDetail,
    SoilAnalysisPicked,
} from "./types"
import { addDays, differenceInCalendarISOWeekYears } from "date-fns/fp"

export function calculateOrganicMatterDegradation(
    soilAnalysis: SoilAnalysisPicked,
    cultivations: FieldInput["cultivations"],
    cultivationDetailsMap: Map<string, CultivationDetail>,
    timeFrame: { start: Date; end: Date },
): OrganicMatterDegradation {
    let totalDegradation = new Decimal(0)

    const isGrassland = cultivations.some((c) => {
        const b_lu_catalogue = c.b_lu_catalogue
        const b_lu_croprotation =
            cultivationDetailsMap.get(b_lu_catalogue)?.b_lu_croprotation
        return b_lu_croprotation === "grassland"
    })

    const b_depth = isGrassland ? new Decimal(0.1) : new Decimal(0.3)

    const averageYearlyTemperature = new Decimal(11.7)
    const temperatureCorrection = new Decimal(2).pow(
        averageYearlyTemperature.minus(13).dividedBy(10),
    )

    const a_som_loi = new Decimal(soilAnalysis.a_som_loi)
    const a_density_sa = new Decimal(soilAnalysis.a_density_sa)

    let annualDegradation = a_som_loi
        .times(b_depth)
        .times(a_density_sa)
        .times(a_som_loi.ln().times(-0.008934).add(0.038228))
        .times(temperatureCorrection)

    if (annualDegradation.lessThan(0)) {
        annualDegradation = new Decimal(0)
    } else if (annualDegradation.greaterThan(3500)) {
        annualDegradation = new Decimal(3500)
    }

    // Calculate degradation over the timeframe
    const numberOfYears = differenceInCalendarISOWeekYears(
        addDays(timeFrame.end, 1),
        timeFrame.start,
    )
    totalDegradation = annualDegradation.times(numberOfYears)

    return {
        total: totalDegradation,
    }
}
