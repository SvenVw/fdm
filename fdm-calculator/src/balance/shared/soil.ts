import {
    calculateBulkDensity,
    calculateCarbonNitrogenRatio,
    calculateOrganicCarbon,
    calculateOrganicMatter,
} from "../../conversions/soil"
import type { SoilAnalysis } from "@svenvw/fdm-core"
import type { SoilAnalysisPicked as NitrogenSoilAnalysisPicked } from "../nitrogen/types"
import type { SoilAnalysisPicked as OrganicMatterSoilAnalysisPicked } from "../organic-matter/types"

type SoilAnalysisPicked =
    | NitrogenSoilAnalysisPicked
    | OrganicMatterSoilAnalysisPicked

export function combineSoilAnalyses<T extends SoilAnalysisPicked>(
    soilAnalyses: Partial<SoilAnalysis>[],
    propertiesToExtract: (keyof T)[],
    estimateMissing = false,
): T {
    // Sort the soil analyses by date (most recent first)
    soilAnalyses.sort((a, b) => {
        if (a.b_sampling_date && b.b_sampling_date) {
            return (
                new Date(b.b_sampling_date).getTime() -
                new Date(a.b_sampling_date).getTime()
            )
        }
        return 0
    })

    const soilAnalysis: T = {} as T

    // Extract each property
    for (const prop of propertiesToExtract) {
        ;(soilAnalysis as any)[prop] =
            soilAnalyses.find(
                (x: any) => x[prop] !== null && x[prop] !== undefined,
            )?.[prop] || null
    }

    if (estimateMissing) {
        // When values for soil parameters are not available try to estimate them with conversion functions
        if (
            "a_c_of" in soilAnalysis &&
            soilAnalysis.a_c_of == null &&
            "a_som_loi" in soilAnalysis
        ) {
            ;(soilAnalysis as any).a_c_of = calculateOrganicCarbon(
                (soilAnalysis as any).a_som_loi,
            )
        }

        if (
            "a_som_loi" in soilAnalysis &&
            soilAnalysis.a_som_loi == null &&
            "a_c_of" in soilAnalysis
        ) {
            ;(soilAnalysis as any).a_som_loi = calculateOrganicMatter(
                (soilAnalysis as any).a_c_of,
            )
        }

        if (
            "a_cn_fr" in soilAnalysis &&
            soilAnalysis.a_cn_fr == null &&
            "a_c_of" in soilAnalysis &&
            "a_n_rt" in soilAnalysis
        ) {
            ;(soilAnalysis as any).a_cn_fr = calculateCarbonNitrogenRatio(
                (soilAnalysis as any).a_c_of,
                (soilAnalysis as any).a_n_rt,
            )
        }

        if (
            "a_density_sa" in soilAnalysis &&
            soilAnalysis.a_density_sa == null &&
            "a_som_loi" in soilAnalysis &&
            "b_soiltype_agr" in soilAnalysis
        ) {
            ;(soilAnalysis as any).a_density_sa = calculateBulkDensity(
                (soilAnalysis as any).a_som_loi,
                (soilAnalysis as any).b_soiltype_agr,
            )
        }
    }

    // Validate if all required soil parameters are present
    const missingParameters = propertiesToExtract.filter(
        (param) => (soilAnalysis as any)[param] === null,
    )

    if (missingParameters.length > 0) {
        throw new Error(
            `Missing required soil parameters: ${missingParameters.join(", ")}`,
        )
    }

    return soilAnalysis
}
