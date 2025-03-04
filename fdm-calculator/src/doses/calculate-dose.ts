import type {
    getFertilizerApplicationType,
    getFertilizerType,
} from "@svenvw/fdm-core"
import type { Dose } from "./d"

/**
 * Calculates the total dose of N, P, and K applied to a field based on a list of fertilizer applications.
 *
 * @param applications An array of fertilizer application objects. Each object should have a `p_id` property (fertilizer ID) and a `p_app_amount` property (amount applied).
 * @param fertilizers An array of fertilizer objects. Each object should have a `p_id` property (fertilizer ID), and `p_n_rt`, `p_p_rt`, and `p_k_rt` properties representing the percentage of nitrogen, phosphate, and potassium in the fertilizer, respectively.
 * @returns An object representing the total dose of N, P, and K applied, with properties `p_dose_n`, `p_dose_p`, and `p_dose_k`.
 */
export function calculateDose({
    applications,
    fertilizers,
}: {
    applications: getFertilizerApplicationType[]
    fertilizers: getFertilizerType[]
}): Dose {
    // Validate non-negative values
    if (applications.some((app) => app.p_app_amount < 0)) {
        throw new Error("Application amounts must be non-negative")
    }
    if (
        fertilizers.some(
            (fert) =>
                (fert.p_n_rt && fert.p_n_rt < 0) ||
                (fert.p_p_rt && fert.p_p_rt < 0) ||
                (fert.p_k_rt && fert.p_k_rt < 0),
        )
    ) {
        throw new Error("Nutrient rates must be non-negative")
    }

    const doses = applications.map((application) => {
        const fertilizer = fertilizers.find(
            (fertilizer) => fertilizer.p_id === application.p_id,
        )

        // Check if fertilizer exists before accessing properties
        if (!fertilizer) {
            return { p_dose_n: 0, p_dose_p2o5: 0, p_dose_k2o: 0 }
        }

        // Calculate total nitrogen dose
        const p_dose_n =
            application.p_app_amount * ((fertilizer.p_n_rt ?? 0) / 10) // Convert from g N / kg to fraction

        // Calculate phosphate dose
        const p_dose_p2o5 =
            application.p_app_amount * ((fertilizer.p_p_rt ?? 0) / 10) // Convert from g P2O5/ kg to fraction

        // Calculate potassium dose
        const p_dose_k2o =
            application.p_app_amount * ((fertilizer.p_k_rt ?? 0) / 10) // Convert from g K2O/ kg to fraction

        return {
            p_dose_n: p_dose_n,
            p_dose_p2o5: p_dose_p2o5,
            p_dose_k2o: p_dose_k2o,
        }
    })

    // Reduce the doses from the applications into a single dose
    const totalDose = doses.reduce(
        (acc, curr) => {
            return {
                p_dose_n: acc.p_dose_n + curr.p_dose_n,
                p_dose_p2o5: acc.p_dose_p2o5 + curr.p_dose_p2o5,
                p_dose_k2o: acc.p_dose_k2o + curr.p_dose_k2o,
            }
        },
        { p_dose_n: 0, p_dose_p2o5: 0, p_dose_k2o: 0 },
    )

    return totalDose
}
