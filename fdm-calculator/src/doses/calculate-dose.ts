import type { FertilizerApplication, Fertilizer } from "@svenvw/fdm-core"
import type { Dose } from "./d"

/**
 * Calculates the cumulative doses of nitrogen, phosphate (as P2O5), and potassium (as K2O) applied to a field.
 *
 * This function iterates over each fertilizer application to determine its contribution to the overall nutrient dose by matching it with a corresponding fertilizer. For each application, it calculates the nutrient dose by multiplying the application amount by the fertilizer's nutrient rate and then sums all doses into a total dose object.
 *
 * @param applications An array of fertilizer application objects, each with a `p_id` (fertilizer ID) and `p_app_amount` (amount applied in kg/ha).
 * @param fertilizers An array of fertilizer objects, each with a `p_id` (fertilizer ID) and nutrient rates (`p_n_rt`, `p_p_rt`, `p_k_rt`) in g/kg, expected to be non-negative.
 * @returns An object containing:
 *   - `dose`: An object with the total doses in kg/ha for `p_dose_n` (nitrogen), `p_dose_nw` (workable nitrogen - adjusted by the `p_n_wc` coefficient), `p_dose_p2o5` (phosphate as P2O5), and `p_dose_k2o` (potassium as K2O).
 *   - `applications`: An array of individual application doses, each with `p_app_id` and the calculated doses in kg/ha.
 * @throws {Error} If any fertilizer application amount or nutrient rate is negative.
 *
 * @example
 * ```typescript
 * import { calculateDose } from "./calculate-dose";
 *
 * const applications = [
 *   { p_app_id: "app1", p_id: "fert1", p_app_amount: 100 }, // 100 kg/ha
 *   { p_app_id: "app2", p_id: "fert2", p_app_amount: 50 },  // 50 kg/ha
 * ];
 *
 * const fertilizers = [
 *   { p_id: "fert1", p_n_rt: 100, p_p_rt: 50, p_k_rt: 30, p_n_wc: 0.5 }, // 100 g N/kg, 50 g P2O5/kg, 30 g K2O/kg
 *   { p_id: "fert2", p_n_rt: 200, p_p_rt: 0, p_k_rt: 60, p_n_wc: 1.0 },  // 200 g N/kg, 0 g P2O5/kg, 60 g K2O/kg
 * ];
 *
 * const result = calculateDose({ applications, fertilizers });
 * console.log(result.dose);
 * // Expected output (approximately):
 * // { p_dose_n: 20, p_dose_nw: 10, p_dose_p2o5: 5, p_dose_k2o: 6 }
 * console.log(result.applications);
 * // Expected output (approximately):
 * // [
 * //   { p_app_id: "app1", p_dose_n: 10, p_dose_nw: 5, p_dose_p2o5: 5, p_dose_k2o: 3 },
 * //   { p_app_id: "app2", p_dose_n: 10, p_dose_nw: 10, p_dose_p2o5: 0, p_dose_k2o: 3 }
 * // ]
 * ```
 */
export function calculateDose({
    applications,
    fertilizers,
}: {
    applications: FertilizerApplication[]
    fertilizers: Fertilizer[]
}): { dose: Dose; applications: Dose[] } {
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
            return {
                p_app_id: application.p_app_id,
                p_dose_n: 0,
                p_dose_nw: 0,
                p_dose_p2o5: 0,
                p_dose_k2o: 0,
            }
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
            p_app_id: application.p_app_id,
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

    return {
        dose: totalDose,
        applications: doses,
    }
}
