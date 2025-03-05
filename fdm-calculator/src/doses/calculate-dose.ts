import type {
    getFertilizerApplicationType,
    getFertilizerType,
} from "@svenvw/fdm-core"
import type { Dose } from "./d"

/**
 * Calculates the cumulative doses of nitrogen, phosphate (as P2O5), and potassium (as K2O) applied to a field.
 *
 * This function iterates over each fertilizer application to determine its contribution to the overall nutrient dose by matching it with a corresponding fertilizer. For each application, it calculates the nutrient dose by multiplying the application amount by the fertilizer's nutrient rate (divided by 10) and then sums all doses into a total dose object.
 *
 * @param applications An array of fertilizer application objects, each with a `p_id` (fertilizer ID) and `p_app_amount` (amount applied).
 * @param fertilizers An array of fertilizer objects, each with a `p_id` (fertilizer ID) and nutrient rates (`p_n_rt`, `p_p_rt`, `p_k_rt`) expected to be non-negative.
 * @returns An object containing the total doses with properties: `p_dose_n` (nitrogen), `p_dose_p2o5` (phosphate as P2O5), and `p_dose_k2o` (potassium as K2O).
 *
 * @throws {Error} If any fertilizer application amount or nutrient rate is negative.
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
