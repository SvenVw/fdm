import type {
    getFertilizerApplicationType,
    getFertilizerType,
} from "@svenvw/fdm-core"
import type { Dose } from "./d"

/**
 * Computes cumulative nutrient doses from fertilizer applications.
 *
 * The function matches each fertilizer application with its corresponding fertilizer record using the fertilizer's identifier.
 * It then calculates the nutrient contributions by converting fertilizer nutrient rates from grams per kilogram to kilograms per kilogram
 * (dividing by 1000) and multiplying by the application amount. In addition to the total nitrogen dose (p_dose_n), a workable nitrogen dose (p_dose_nw)
 * is computed by applying a coefficient from the fertilizer record (p_n_wc, defaulting to 1). Phosphate (as P2O5) and potassium (as K2O) doses are also calculated.
 * If an application references a fertilizer that is not found, the function assigns zero doses for that application.
 *
 * @param applications - Array of fertilizer application objects. Each object includes an identifier (p_id) and an application amount (p_app_amount).
 * @param fertilizers - Array of fertilizer objects. Each should include an identifier (p_id) and nutrient rates:
 *                      nitrogen (p_n_rt), phosphate (p_p_rt), potassium (p_k_rt), and optionally a workable nitrogen coefficient (p_n_wc).
 * @returns An object with cumulative doses:
 *          p_dose_n: Total nitrogen dose,
 *          p_dose_nw: Total workable nitrogen dose,
 *          p_dose_p2o5: Total phosphate dose (as P2O5),
 *          p_dose_k2o: Total potassium dose (as K2O).
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
            return { p_dose_n: 0, p_dose_nw: 0, p_dose_p2o5: 0, p_dose_k2o: 0 }
        }

        // Calculate total nitrogen dose
        const p_dose_n =
            application.p_app_amount * ((fertilizer.p_n_rt ?? 0) / 1000) // Convert from g N / kg to kg N / kg

        // Calculate workable nitrogen dose
        const p_dose_nw =
            application.p_app_amount *
            ((fertilizer.p_n_rt ?? 0) / 1000) * // Convert from g N / kg to kg N / kg
            (fertilizer.p_n_wc ?? 1)

        // Calculate phosphate dose
        const p_dose_p2o5 =
            application.p_app_amount * ((fertilizer.p_p_rt ?? 0) / 1000) // Convert from g P2O5/ kg to kg P2O5 / kg

        // Calculate potassium dose
        const p_dose_k2o =
            application.p_app_amount * ((fertilizer.p_k_rt ?? 0) / 1000) // Convert from g K2O/ kg to kg K2O / kg

        return {
            p_dose_n: p_dose_n,
            p_dose_nw: p_dose_nw,
            p_dose_p2o5: p_dose_p2o5,
            p_dose_k2o: p_dose_k2o,
        }
    })

    // Reduce the doses from the applications into a single dose
    const totalDose = doses.reduce(
        (acc, curr) => {
            return {
                p_dose_n: acc.p_dose_n + curr.p_dose_n,
                p_dose_nw: acc.p_dose_nw + curr.p_dose_nw,
                p_dose_p2o5: acc.p_dose_p2o5 + curr.p_dose_p2o5,
                p_dose_k2o: acc.p_dose_k2o + curr.p_dose_k2o,
            }
        },
        { p_dose_n: 0, p_dose_nw: 0, p_dose_p2o5: 0, p_dose_k2o: 0 },
    )

    return totalDose
}
