import Decimal from "decimal.js"
import type {
    FertilizerDetail,
    FieldInput,
    NitrogenEmissionAmmoniaFertilizers,
} from "../../types"

/**
 * Calculates the ammonia emissions specifically from mineral fertilizer applications.
 *
 * This function iterates through fertilizer applications, filters for mineral types,
 * determines the appropriate emission factor (either from `p_ef_nh3` or by calling
 * `determineMineralAmmoniaEmmissionFactor`), and calculates the ammonia emissions
 * for each relevant application. It then aggregates these values to provide a total.
 *
 * @param fertilizerApplications - An array of fertilizer application records.
 * @param fertilizerDetailsMap - A Map where keys are fertilizer catalogue IDs and values are detailed fertilizer information.
 * @returns An object containing the total ammonia emissions from mineral fertilizers and a breakdown by individual application.
 * @throws Error if a fertilizer application references a non-existent fertilizer detail.
 */
export function calculateAmmoniaEmissionsByMineralFertilizers(
    fertilizerApplications: FieldInput["fertilizerApplications"],
    fertilizerDetailsMap: Map<string, FertilizerDetail>,
): NitrogenEmissionAmmoniaFertilizers["mineral"] {
    if (fertilizerApplications.length === 0) {
        return {
            total: new Decimal(0),
            applications: [],
        }
    }
    const applications = fertilizerApplications.map((application) => {
        // Get fertilizerDetails of application using the Map
        const fertilizerDetail = fertilizerDetailsMap.get(
            application.p_id_catalogue,
        )

        if (!fertilizerDetail) {
            throw new FdmCalculatorError(
                `Fertilizer application ${application.p_app_id} has no fertilizerDetails`,
                "INVALID_FERTILIZER_DATA",
                { application },
            )
        }
        const p_n_rt = new Decimal(fertilizerDetail.p_n_rt ?? 0)
        const p_ef_nh3 = fertilizerDetail.p_ef_nh3

        // If the fertilizer used is not of the type mineral
        if (fertilizerDetail.p_type !== "mineral") {
            return {
                id: application.p_app_id,
                value: new Decimal(0),
            }
        }

        // Determine emission factor
        let emissionFactor = null
        if (p_ef_nh3) {
            emissionFactor = new Decimal(p_ef_nh3)
        } else {
            emissionFactor = determineMineralAmmoniaEmissionFactor(application)
        }

        // Calculate for this application the amount of Nitrogen supplied by mineral fertilizer
        const p_app_amount = new Decimal(application.p_app_amount ?? 0)
        const applicationValue = p_app_amount
            .times(p_n_rt)
            .times(emissionFactor)
            .dividedBy(1000) // convert from g N to kg N

        return {
            id: application.p_app_id,
            value: applicationValue,
        }
    })

    // Calculate the total amount of Nitrogen supplied by mineral fertilizer
    const totalValue = applications.reduce((acc, application) => {
        return acc.add(application.value)
    }, Decimal(0))

    return {
        total: totalValue,
        applications: applications,
    }
}

/**
 * Determines the ammonia emission factor for mineral fertilizers based on their
 * nitrogen, nitrate, ammonium, and sulfur content, and the presence of an inhibitor.
 *
 * This function calculates the emission factor using a specific formula that
 * considers various nutrient components and a boolean flag for inhibitor presence.
 *
 * Formula coefficients:
 * - Organic N squared coefficient: 3.166e-5 (with inhibitor) or 7.021e-5 (without)
 * - NO3 × S coefficient: -4.308e-5
 * - NH4 squared coefficient: 2.498e-4
 *
 * @param fertilizerDetail - The detailed information for a specific mineral fertilizer.
 * @returns A Decimal representing the calculated ammonia emission factor.
 */
export function determineMineralAmmoniaEmissionFactor(
    fertilizerDetail: FertilizerDetail,
): Decimal {
    const p_n_rt = new Decimal(fertilizerDetail.p_n_rt ?? 0)
    const p_no3_rt = new Decimal(fertilizerDetail.p_no3_rt ?? 0)
    const p_nh4_rt = new Decimal(fertilizerDetail.p_nh4_rt ?? 0)
    const p_n_org = p_n_rt.minus(p_no3_rt).minus(p_nh4_rt)
    const p_s_rt = new Decimal(fertilizerDetail.p_s_rt ?? 0)
    const p_inhibitor = false

    const a = p_inhibitor
        ? p_n_org.pow(2).times(new Decimal(3.166e-5))
        : p_n_org.pow(2).times(new Decimal(7.021e-5))
    const b = p_no3_rt.times(p_s_rt).times(new Decimal(-4.308e-5))
    const c = p_nh4_rt.pow(2).times(2.498e-4)

    return a.add(b).add(c)
}
