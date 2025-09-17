import Decimal from "decimal.js"
import type {
    CultivationDetail,
    FertilizerDetail,
    FieldInput,
    NitrogenEmissionAmmoniaFertilizers,
} from "../../types"
import type { FertilizerApplication } from "@svenvw/fdm-core"

/**
 * Calculates the total ammonia emission from all fertilizer sources (mineral, manure, compost and other fertilizers).
 *
 * This function aggregates the nitrogen contributions from mineral fertilizers, manure, compost and other fertilizers
 * by iterating through the applications once and directing each to the appropriate calculation.
 * @param cultivations - An array of cultivation records for the field.
 * @param fertilizerApplications - An array of fertilizer applications, each containing the application amount and a reference to the fertilizer details.
 * @param cultivationDetailsMap - A Map containing details for each cultivation, including its type.
 * @param fertilizerDetailsMap - A map containing details for each fertilizer, including its type and nitrogen content.
 * @returns An object containing the total ammonia emitted by all fertilizers, as well as a breakdown by fertilizer type (mineral, manure, compost, other).
 */
export function calculateNitrogenEmissionViaAmmoniaByFertilizers(
    cultivations: FieldInput["cultivations"],
    fertilizerApplications: FieldInput["fertilizerApplications"],
    cultivationDetailsMap: Map<string, CultivationDetail>,
    fertilizerDetailsMap: Map<string, FertilizerDetail>,
): NitrogenEmissionAmmoniaFertilizers {
    const initialEmissions: NitrogenEmissionAmmoniaFertilizers = {
        total: new Decimal(0),
        mineral: { total: new Decimal(0), applications: [] },
        manure: { total: new Decimal(0), applications: [] },
        compost: { total: new Decimal(0), applications: [] },
        other: { total: new Decimal(0), applications: [] },
    }

    const aggregatedEmissions = fertilizerApplications.reduce(
        (acc, application) => {
            const fertilizerDetail = fertilizerDetailsMap.get(
                application.p_id_catalogue,
            )

            if (!fertilizerDetail) {
                throw new Error(
                    `Fertilizer application ${application.p_app_id} has no fertilizerDetails`,
                )
            }

            const p_app_amount = new Decimal(application.p_app_amount ?? 0)
            let applicationValue = new Decimal(0)
            let emissionFactor: Decimal

            switch (fertilizerDetail.p_type) {
                case "mineral": {
                    const p_n_rt_mineral = new Decimal(
                        fertilizerDetail.p_n_rt ?? 0,
                    )
                    const p_ef_nh3_mineral = fertilizerDetail.p_ef_nh3

                    if (p_ef_nh3_mineral != null) {
                        emissionFactor = new Decimal(p_ef_nh3_mineral)
                    } else {
                        emissionFactor =
                            determineMineralAmmoniaEmissionFactor(
                                fertilizerDetail,
                            )
                    }
                    // Clamp to [0..1] to ensure sane fraction values
                    if (emissionFactor.lt(0)) emissionFactor = new Decimal(0)
                    if (emissionFactor.gt(1)) emissionFactor = new Decimal(1)

                    applicationValue = p_app_amount
                        .times(p_n_rt_mineral)
                        .times(emissionFactor)
                        .dividedBy(1000) // convert from g N to kg N
                        .times(-1) // Return negative value

                    acc.mineral.total = acc.mineral.total.add(applicationValue)
                    acc.mineral.applications.push({
                        id: application.p_app_id,
                        value: applicationValue,
                    })
                    break
                }
                default: {
                    // For manure, compost and other
                    const p_nh4_rt_organic = new Decimal(
                        fertilizerDetail.p_nh4_rt ?? 0,
                    )
                    emissionFactor = determineManureAmmoniaEmissionFactor(
                        application,
                        cultivations,
                        cultivationDetailsMap,
                    )
                    applicationValue = p_app_amount
                        .times(p_nh4_rt_organic)
                        .times(emissionFactor)
                        .dividedBy(1000) // convert from g N to kg N
                        .times(-1) // Return negative value

                    if (fertilizerDetail.p_type === "manure") {
                        acc.manure.total =
                            acc.manure.total.add(applicationValue)
                        acc.manure.applications.push({
                            id: application.p_app_id,
                            value: applicationValue,
                        })
                    } else if (fertilizerDetail.p_type === "compost") {
                        acc.compost.total =
                            acc.compost.total.add(applicationValue)
                        acc.compost.applications.push({
                            id: application.p_app_id,
                            value: applicationValue,
                        })
                    } else {
                        // For "other" types
                        acc.other.total = acc.other.total.add(applicationValue)
                        acc.other.applications.push({
                            id: application.p_app_id,
                            value: applicationValue,
                        })
                    }
                    break
                }
            }
            return acc
        },
        initialEmissions,
    )

    aggregatedEmissions.total = aggregatedEmissions.mineral.total
        .add(aggregatedEmissions.manure.total)
        .add(aggregatedEmissions.compost.total)
        .add(aggregatedEmissions.other.total)

    return aggregatedEmissions
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
function determineMineralAmmoniaEmissionFactor(
    fertilizerDetail: FertilizerDetail,
): Decimal {
    const p_n_rt = new Decimal(fertilizerDetail.p_n_rt ?? 0)
    const p_no3_rt = new Decimal(fertilizerDetail.p_no3_rt ?? 0)
    const p_nh4_rt = new Decimal(fertilizerDetail.p_nh4_rt ?? 0)
    const p_n_org = p_n_rt.minus(p_no3_rt).minus(p_nh4_rt)
    const p_s_rt = new Decimal(fertilizerDetail.p_s_rt ?? 0)
    const p_inhibitor = false // TODO: implement inhbiitor details for fertilizers

    const a = p_inhibitor
        ? p_n_org.pow(2).times(new Decimal(3.166e-5))
        : p_n_org.pow(2).times(new Decimal(7.021e-5))
    const b = p_no3_rt.times(p_s_rt).times(new Decimal(-4.308e-5))
    const c = p_nh4_rt.pow(2).times(2.498e-4)

    return a.add(b).add(c)
}

/**
 * Determines the ammonia emission factor for manure applications based on
 * application method and the presence of grassland or cropland.
 *
 * This function checks the cultivation type at the time of fertilizer application
 * (grassland, cropland, or bare soil) and applies a specific emission factor
 * based on the application method.
 *
 * @param fertilizerApplication - The specific fertilizer application record.
 * @param cultivations - An array of cultivation records for the field.
 * @param cultivationDetails - A Map where keys are cultivation IDs and values are detailed cultivation information.
 * @returns A Decimal representing the ammonia emission factor.
 * @throws Error if an unsupported application method is provided for the given land type.
 */
function determineManureAmmoniaEmissionFactor(
    fertilizerApplication: FertilizerApplication,
    cultivations: FieldInput["cultivations"],
    cultivationDetails: Map<string, CultivationDetail>,
) {
    const p_app_name = fertilizerApplication.p_name_nl
    const p_id = fertilizerApplication.p_id
    const p_app_date = fertilizerApplication.p_app_date
    const p_app_method = fertilizerApplication.p_app_method

    const activeCultivations = cultivations.filter((cultivation) => {
        if (cultivation.b_lu_end) {
            return (
                cultivation.b_lu_start.getTime() <= p_app_date.getTime() &&
                cultivation.b_lu_end.getTime() >= p_app_date.getTime()
            )
        }
        return cultivation.b_lu_start.getTime() <= p_app_date.getTime()
    })

    let landType: "grassland" | "cropland" | "bare soil" = "bare soil"

    // Determine land type based on active cultivations, prioritizing cropland
    let hasGrassland = false
    let hasCropland = false

    for (const cultivation of activeCultivations) {
        const type = cultivationDetails.get(cultivation.b_lu_catalogue)
        if (type?.b_lu_croprotation === "crop") {
            hasCropland = true
        } else if (type?.b_lu_croprotation === "grass") {
            hasGrassland = true
        }
    }

    if (hasCropland) {
        landType = "cropland"
    } else if (hasGrassland) {
        landType = "grassland"
    } else {
        landType = "bare soil"
    }

    // Determine the Emission factor based on active cultivation type
    if (landType === "grassland") {
        if (p_app_method === "broadcasting") {
            return new Decimal(0.68)
        }
        if (p_app_method === "narrowband") {
            return new Decimal(0.264)
        }
        if (p_app_method === "slotted coulter") {
            return new Decimal(0.217)
        }
        if (p_app_method === "shallow injection") {
            return new Decimal(0.17)
        }
        console.warn(
            `Unsupported application method ${p_app_method} for ${p_app_name} (${p_id}) on grassland`,
        )
        return new Decimal(0)
    } else if (landType === "cropland") {
        if (p_app_method === "broadcasting") {
            return new Decimal(0.69)
        }
        if (p_app_method === "incorporation 2 tracks") {
            return new Decimal(0.46)
        }
        if (p_app_method === "narrowband") {
            return new Decimal(0.36)
        }
        if (p_app_method === "slotted coulter") {
            return new Decimal(0.3)
        }
        if (p_app_method === "shallow injection") {
            return new Decimal(0.24)
        }
        if (p_app_method === "incorporation") {
            return new Decimal(0.22)
        }
        console.warn(
            `Unsupported application method ${p_app_method} for ${p_app_name} (${p_id}) for cropland`,
        )
        return new Decimal(0)
    } else {
        // Bare soil
        if (p_app_method === "broadcasting") {
            return new Decimal(0.69)
        }
        if (p_app_method === "incorporation 2 tracks") {
            return new Decimal(0.46)
        }
        if (p_app_method === "narrowband") {
            return new Decimal(0.36)
        }
        if (p_app_method === "slotted coulter") {
            return new Decimal(0.3)
        }
        if (p_app_method === "shallow injection") {
            return new Decimal(0.25)
        }
        if (p_app_method === "incorporation") {
            return new Decimal(0.22)
        }
        console.warn(
            `Unsupported application method ${p_app_method} for ${p_app_name} (${p_id}) for bare soil`,
        )
        return new Decimal(0)
    }
}
