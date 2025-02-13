import type { Dose } from "./d"

export function calculateDose({
    applications,
    fertilizers,
}: {
    applications: any[]
    fertilizers: any[]
}): Dose {
    const doses = applications.map((application) => {
        const fertilizer = fertilizers.find(
            (fertilizer) => fertilizer.p_id === application.p_id,
        )

        // Calculate total nitrogen dose
        const p_dose_n = application.p_app_amount * (fertilizer.p_n_rt ?? 0)

        // Calculate phosphate dose
        const p_dose_p = application.p_app_amount * (fertilizer.p_p_rt ?? 0)

        // Calculate potassium dose
        const p_dose_k = application.p_app_amount * (fertilizer.p_k_rt ?? 0)

        return { p_dose_n: p_dose_n, p_dose_p: p_dose_p, p_dose_k: p_dose_k }
    })

    // Reduce the doses from the applications into a single dose
    const totalDose = doses.reduce(
        (acc, curr) => {
            return {
                p_dose_n: acc.p_dose_n + curr.p_dose_n,
                p_dose_p: acc.p_dose_p + curr.p_dose_p,
                p_dose_k: acc.p_dose_k + curr.p_dose_k,
            }
        },
        { p_dose_n: 0, p_dose_p: 0, p_dose_k: 0 },
    )

    return totalDose
}
