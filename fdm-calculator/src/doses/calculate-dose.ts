/**
 * @file This module provides functionality to calculate the total and per-application
 * nutrient doses from a series of fertilizer applications.
 *
 * The core function, `calculateDose`, is essential for understanding the total amount of
 * each nutrient applied to a field over time.
 *
 * @packageDocumentation
 */
import type { Fertilizer, FertilizerApplication } from "@svenvw/fdm-core"
import type { Dose } from "./d"

/**
 * Calculates the cumulative and individual nutrient doses from fertilizer applications.
 *
 * This function takes a list of fertilizer applications and a corresponding list of fertilizer
 * definitions. It calculates the dose of each nutrient (e.g., N, P, K) for every application
 * by multiplying the application amount (in kg/ha) by the nutrient concentration in the
 * fertilizer.
 *
 * It returns both the total aggregated dose of all nutrients across all applications and a
 * detailed breakdown of the doses for each individual application.
 *
 * @param params - The input object for the dose calculation.
 * @param params.applications - An array of fertilizer application records.
 * @param params.fertilizers - An array of fertilizer definitions containing nutrient concentrations.
 * @returns An object containing the total cumulative `dose` and a list of `applications` with their individual doses.
 * @throws {Error} If an application amount or a nutrient rate is negative.
 * @throws {Error} If a fertilizer definition cannot be found for an application.
 *
 * @example
 * ```typescript
 * const applications = [{ p_app_id: "app1", p_id_catalogue: "fert1", p_app_amount: 100 }];
 * const fertilizers = [{ p_id_catalogue: "fert1", p_n_rt: 100, p_p_rt: 50, p_k_rt: 30 }];
 * const { dose, applications: appDoses } = calculateDose({ applications, fertilizers });
 * // dose.p_dose_n will be 10 (100 kg/ha * 100 g/kg / 1000)
 * ```
 */
export function calculateDose({
    applications,
    fertilizers,
}: {
    applications: FertilizerApplication[]
    fertilizers: Fertilizer[]
}): { dose: Dose; applications: Dose[] } {
    if (applications.some((app) => app.p_app_amount < 0)) {
        throw new Error("Application amounts must be non-negative")
    }

    const nutrientRates = [
        "p_n_rt",
        "p_p_rt",
        "p_k_rt",
        "p_eoc",
        "p_s_rt",
        "p_mg_rt",
        "p_ca_rt",
        "p_na_rt",
        "p_cu_rt",
        "p_zn_rt",
        "p_co_rt",
        "p_mn_rt",
        "p_mo_rt",
        "p_b_rt",
    ]
    if (
        fertilizers.some((fert) =>
            nutrientRates.some((rate) => (fert[rate] ? fert[rate] < 0 : false)),
        )
    ) {
        throw new Error("Nutrient rates must be non-negative")
    }

    const initialDose: Dose = {
        p_dose_n: 0,
        p_dose_nw: 0,
        p_dose_p: 0,
        p_dose_k: 0,
        p_dose_eoc: 0,
        p_dose_s: 0,
        p_dose_mg: 0,
        p_dose_ca: 0,
        p_dose_na: 0,
        p_dose_cu: 0,
        p_dose_zn: 0,
        p_dose_co: 0,
        p_dose_mn: 0,
        p_dose_mo: 0,
        p_dose_b: 0,
    }

    const totalDose = { ...initialDose }
    const applicationDoses: Dose[] = []

    for (const application of applications) {
        const fertilizer = fertilizers.find(
            (f) => f.p_id_catalogue === application.p_id_catalogue,
        )
        if (!fertilizer) {
            throw new Error(
                `Fertilizer ${application.p_id_catalogue} not found for application ${application.p_app_id}`,
            )
        }
        const currentDose = { ...initialDose, p_app_id: application.p_app_id }

        if (fertilizer) {
            const amount = application.p_app_amount
            currentDose.p_dose_n = amount * ((fertilizer.p_n_rt ?? 0) / 1000)
            currentDose.p_dose_nw =
                currentDose.p_dose_n * (fertilizer.p_n_wc ?? 1)
            currentDose.p_dose_p = amount * ((fertilizer.p_p_rt ?? 0) / 1000)
            currentDose.p_dose_k = amount * ((fertilizer.p_k_rt ?? 0) / 1000)
            currentDose.p_dose_eoc = amount * ((fertilizer.p_eoc ?? 0) / 1000)
            currentDose.p_dose_s = amount * ((fertilizer.p_s_rt ?? 0) / 1000)
            currentDose.p_dose_mg = amount * ((fertilizer.p_mg_rt ?? 0) / 1000)
            currentDose.p_dose_ca = amount * ((fertilizer.p_ca_rt ?? 0) / 1000)
            currentDose.p_dose_na =
                amount * ((fertilizer.p_na_rt ?? 0) / 1000000)
            currentDose.p_dose_cu =
                amount * ((fertilizer.p_cu_rt ?? 0) / 1000000)
            currentDose.p_dose_zn =
                amount * ((fertilizer.p_zn_rt ?? 0) / 1000000)
            currentDose.p_dose_co =
                amount * ((fertilizer.p_co_rt ?? 0) / 1000000)
            currentDose.p_dose_mn =
                amount * ((fertilizer.p_mn_rt ?? 0) / 1000000)
            currentDose.p_dose_mo =
                amount * ((fertilizer.p_mo_rt ?? 0) / 1000000)
            currentDose.p_dose_b = amount * ((fertilizer.p_b_rt ?? 0) / 1000000)
        }

        applicationDoses.push(currentDose)
        for (const key of Object.keys(totalDose) as (keyof Dose)[]) {
            if (key !== "p_app_id") {
                totalDose[key] += currentDose[key]
            }
        }
    }

    return {
        dose: totalDose,
        applications: applicationDoses,
    }
}
