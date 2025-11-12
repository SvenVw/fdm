/**
 * @file This module is responsible for calculating ammonia (`NH3`) emissions specifically
 * from fertilizer applications. It distinguishes between mineral and organic fertilizers,
 * applying different emission factor models for each.
 *
 * The main function, `calculateNitrogenEmissionViaAmmoniaByFertilizers`, iterates through
 * all fertilizer applications on a field, determines the appropriate emission factor,
 * and calculates the resulting ammonia loss.
 *
 * @packageDocumentation
 */
import type { FertilizerApplication } from "@svenvw/fdm-core"
import Decimal from "decimal.js"
import type {
    CultivationDetail,
    FertilizerDetail,
    FieldInput,
    NitrogenEmissionAmmoniaFertilizers,
} from "../../types"

/**
 * Calculates the total ammonia (`NH3`) emission from all fertilizer applications on a field.
 *
 * This function processes a list of fertilizer applications and calculates the ammonia
 * volatilization for each. It categorizes fertilizers into mineral, manure, compost, and other,
 * applying specific emission factor calculations for each type.
 *
 * - For **mineral fertilizers**, it uses a formula based on their chemical composition.
 * - For **organic fertilizers** (manure, compost, etc.), it determines the emission factor based
 *   on the application method and the type of land cover (grassland, cropland, bare soil) at the
 *   time of application.
 *
 * The function returns a detailed breakdown of emissions by fertilizer type and for each
 * individual application.
 *
 * @param cultivations - An array of the field's cultivation history.
 * @param fertilizerApplications - An array of all fertilizer applications to be analyzed.
 * @param cultivationDetailsMap - A map providing detailed data for each cultivation type.
 * @param fertilizerDetailsMap - A map providing detailed data for each fertilizer type.
 * @returns An object detailing total and per-category ammonia emissions from fertilizers.
 * @throws {Error} If fertilizer details are missing for a given application.
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
 * Determines the ammonia emission factor for a mineral fertilizer.
 *
 * This function calculates a specific emission factor based on the chemical properties of the
 * fertilizer, including its nitrogen, nitrate, ammonium, and sulfur content. The formula also
 * accounts for whether a urease inhibitor is present.
 *
 * The formula coefficients are derived from empirical models:
 * - Organic N squared coefficient: `3.166e-5` (with inhibitor) or `7.021e-5` (without).
 * - NO3 × S coefficient: `-4.308e-5`.
 * - NH4 squared coefficient: `2.498e-4`.
 *
 * @param fertilizerDetail - An object containing the detailed chemical composition of the fertilizer.
 * @returns The calculated ammonia emission factor as a `Decimal`.
 * @internal
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
 * Determines the ammonia emission factor for an organic fertilizer (manure) application.
 *
 * This function selects an appropriate emission factor based on a combination of:
 * 1.  **Land Cover**: It first determines whether the application occurred on grassland, cropland,
 *     or bare soil by analyzing the active cultivations at the application date.
 * 2.  **Application Method**: It then uses a lookup table to find the corresponding emission
 *     factor for the specified application technique (e.g., "injection", "broadcasting").
 *
 * The emission factors are based on standard values from agricultural research (Bruggen et al., 2024).
 *
 * @param fertilizerApplication - The fertilizer application event being analyzed.
 * @param cultivations - A complete history of cultivations for the field.
 * @param cultivationDetails - A map providing detailed data for each cultivation type.
 * @returns The appropriate ammonia emission factor as a `Decimal`.
 * @throws {Error} If the application method is not supported or recognized for the determined land type.
 * @internal
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

    const grasslandRotations = new Set(["grass", "clover"])
    const croplandRotations = new Set([
        "potato",
        "rapeseed",
        "starch",
        "maize",
        "cereal",
        "sugarbeet",
        "catchcrop",
        "alfalfa",
        "nature",
        "other",
    ])
    const bareSoilCropCodes = new Set([
        "nl_6794",
        "nl_662",
        "nl_6798",
        "nl_2300",
        "nl_3802",
        "nl_3801",
    ])

    for (const cultivation of activeCultivations) {
        const rotation = cultivationDetails.get(
            cultivation.b_lu_catalogue,
        )?.b_lu_croprotation

        if (
            rotation &&
            grasslandRotations.has(rotation) &&
            !bareSoilCropCodes.has(cultivation.b_lu_catalogue)
        ) {
            hasGrassland = true
        }

        if (
            rotation &&
            croplandRotations.has(rotation) &&
            !bareSoilCropCodes.has(cultivation.b_lu_catalogue)
        ) {
            hasCropland = true
        }
    }

    if (hasGrassland) {
        landType = "grassland"
    } else if (hasCropland) {
        landType = "cropland"
    } else {
        landType = "bare soil"
    }

    // According to table B18.3 (column: 2019-2022) in "Bruggen, C. van, A. Bannink, A. Bleeker, D.W. Bussink, H.J.C. van Dooren, C.M. Groenestein, J.F.M. Huijsmans, J. Kros, K. Oltmer, M.B.H. Ros, M.W. van Schijndel, L. Schulte-Uebbing, G.L. Velthof en T.C. van der Zee (2024). Emissies naar lucht uit de landbouw berekend met NEMA voor 1990-2022. Wageningen, WOT Natuur & Milieu, WOT-technical report 264"
    switch (p_app_method) {
        case "slotted coulter":
            // Set to "sod injection"
            switch (landType) {
                case "grassland":
                    return new Decimal(0.17)
                case "cropland":
                    // Not specified in table, assuming similiar to "shallow injection" at cropland
                    return new Decimal(0.24)
                case "bare soil":
                    return new Decimal(0.24)
                default:
                    throw new Error(
                        `Unsupported land type ${landType} for ${p_app_name} (${p_id}) with ${p_app_method}`,
                    )
            }
        case "incorporation":
            switch (landType) {
                // Not specified in table, assuming similiar to "shallow injection" at grassland
                case "grassland":
                    return new Decimal(0.17)
                case "cropland":
                    return new Decimal(0.22)
                case "bare soil":
                    // Not specified in table, assuming similiar to "incorporation in 2 tracks"
                    return new Decimal(0.46)
                default:
                    throw new Error(
                        `Unsupported land type ${landType} for ${p_app_name} (${p_id}) with ${p_app_method}`,
                    )
            }
        case "incorporation 2 tracks":
            // Not specified in table, assuming similiar to "shallow injection" at grassland
            switch (landType) {
                case "grassland":
                    return new Decimal(0.17)
                case "cropland":
                    return new Decimal(0.46)
                case "bare soil":
                    return new Decimal(0.46)
                default:
                    throw new Error(
                        `Unsupported land type ${landType} for ${p_app_name} (${p_id}) with ${p_app_method}`,
                    )
            }
        case "injection":
            switch (landType) {
                case "grassland":
                    return new Decimal(0.17)
                case "cropland":
                    // Not specified in table, assuming similiar to "shallow injection" at cropland
                    return new Decimal(0.24)
                case "bare soil":
                    return new Decimal(0.02)
                default:
                    throw new Error(
                        `Unsupported land type ${landType} for ${p_app_name} (${p_id}) with ${p_app_method}`,
                    )
            }
        case "shallow injection":
            switch (landType) {
                case "grassland":
                    return new Decimal(0.17)
                case "cropland":
                    return new Decimal(0.24)
                case "bare soil":
                    return new Decimal(0.24)
                default:
                    throw new Error(
                        `Unsupported land type ${landType} for ${p_app_name} (${p_id}) with ${p_app_method}`,
                    )
            }
        case "spraying":
            // Not specified in table, assuming similiar to "broadcasting"
            switch (landType) {
                case "grassland":
                    return new Decimal(0.68)
                case "cropland":
                    return new Decimal(0.69)
                case "bare soil":
                    return new Decimal(0.69)
                default:
                    throw new Error(
                        `Unsupported land type ${landType} for ${p_app_name} (${p_id}) with ${p_app_method}`,
                    )
            }
        case "broadcasting":
            switch (landType) {
                case "grassland":
                    return new Decimal(0.68)
                case "cropland":
                    return new Decimal(0.69)
                case "bare soil":
                    return new Decimal(0.69)
                default:
                    throw new Error(
                        `Unsupported land type ${landType} for ${p_app_name} (${p_id}) with ${p_app_method}`,
                    )
            }
        case "spoke wheel":
            // Not specified in table, assuming similiar to "shallow injection"
            switch (landType) {
                case "grassland":
                    return new Decimal(0.17)
                case "cropland":
                    return new Decimal(0.24)
                case "bare soil":
                    return new Decimal(0.24)
                default:
                    throw new Error(
                        `Unsupported land type ${landType} for ${p_app_name} (${p_id}) with ${p_app_method}`,
                    )
            }
        case "pocket placement":
            // Not specified in table, assuming similiar to "broadcasting"
            switch (landType) {
                case "grassland":
                    return new Decimal(0.68)
                case "cropland":
                    return new Decimal(0.69)
                case "bare soil":
                    return new Decimal(0.69)
                default:
                    throw new Error(
                        `Unsupported land type ${landType} for ${p_app_name} (${p_id}) with ${p_app_method}`,
                    )
            }
        case "narrowband":
            switch (landType) {
                case "grassland":
                    return new Decimal(0.17)
                case "cropland":
                    return new Decimal(0.36)
                case "bare soil":
                    return new Decimal(0.36)
                default:
                    throw new Error(
                        `Unsupported land type ${landType} for ${p_app_name} (${p_id}) with ${p_app_method}`,
                    )
            }
        default:
            throw new Error(
                `Unsupported application method ${p_app_method} for ${p_app_name} (${p_id})`,
            )
    }
}
