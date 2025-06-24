import Decimal from "decimal.js"
import type {
    CultivationDetail,
    FertilizerDetail,
    FieldInput,
    NitrogenEmissionAmmoniaFertilizers,
} from "../../types"
import type { FertilizerApplication } from "@svenvw/fdm-core"

/**
 * Calculates the ammonia emissions specifically from manure applications.
 *
 * This function processes each fertilizer application, identifies manure types,
 * determines the appropriate emission factor using `determineManureAmmoniaEmmissionFactor`,
 * and calculates the ammonia emissions for each relevant application. It then aggregates
 * these values to provide a total.
 *
 * @param cultivations - An array of cultivation records for the field.
 * @param fertilizerApplications - An array of fertilizer application records.
 * @param cultivationDetailsMap - A Map where keys are cultivation IDs and values are detailed cultivation information.
 * @param fertilizerDetailsMap - A Map where keys are fertilizer catalogue IDs and values are detailed fertilizer information.
 * @returns An object containing the total ammonia emissions from manure and a breakdown by individual application.
 * @throws Error if a fertilizer application references a non-existent fertilizer detail.
 */
export function calculateAmmoniaEmissionsByManure(
    cultivations: FieldInput["cultivations"],
    fertilizerApplications: FieldInput["fertilizerApplications"],
    cultivationDetailsMap: Map<string, CultivationDetail>,
    fertilizerDetailsMap: Map<string, FertilizerDetail>,
): NitrogenEmissionAmmoniaFertilizers["manure"] {
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
            throw new Error(
                `Fertilizer application ${application.p_app_id} has no fertilizerDetails`,
            )
        }
        const p_nh4_rt = new Decimal(fertilizerDetail.p_nh4_rt ?? 0)

        // If the fertilizer used is not of the type manure
        if (fertilizerDetail.p_type !== "manure") {
            return {
                id: application.p_app_id,
                value: new Decimal(0),
            }
        }

        // Determine emission factor
        const emissionFactor = determineManureAmmoniaEmmissionFactor(
            application,
            cultivations,
            cultivationDetailsMap,
        )

        // Calculate for this application the amount of Nitrogen supplied by manure
        const p_app_amount = new Decimal(application.p_app_amount ?? 0)
        const applicationValue = p_app_amount
            .times(p_nh4_rt)
            .times(emissionFactor)
            .dividedBy(1000) // convert from g N to kg N

        return {
            id: application.p_app_id,
            value: applicationValue,
        }
    })

    // Calculate the total amount of Nitrogen supplied by manure
    const totalValue = applications.reduce((acc, application) => {
        return acc.add(application.value)
    }, Decimal(0))

    return {
        total: totalValue,
        applications: applications,
    }
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
export function determineManureAmmoniaEmmissionFactor(
    fertilizerApplication: FertilizerApplication,
    cultivations: FieldInput["cultivations"],
    cultivationDetails: Map<string, CultivationDetail>,
) {
    const p_app_name = fertilizerApplication.p_name_nl
    const p_id = fertilizerApplication.p_id
    const p_app_date = fertilizerApplication.p_app_date
    const p_app_method = fertilizerApplication.p_app_method

    // Check if at date of application method grassland is present
    const currentCultvations = cultivations.filter((cultivation) => {
        if (cultivation.b_lu_end) {
            if (
                cultivation.b_lu_start.getTime() <= p_app_date.getTime() &&
                cultivation.b_lu_end.getTime() >= p_app_date.getTime()
            ) {
                return true
            }
        } else {
            if (cultivation.b_lu_start.getTime() <= p_app_date.getTime()) {
                return true
            }
        }
    })
    const isGrasslands = currentCultvations.map((x) => {
        const type = cultivationDetails.get(x.b_lu_catalogue)
        if (type?.b_lu_croprotation === "grass") {
            return true
        }
        return false
    })
    const hasGrasslands = isGrasslands.some((x) => x === true)

    // Check if a crop is present at time of fertilizer application
    const isCropland = currentCultvations.length > 0

    // Determine the Emission factor
    if (hasGrasslands) {
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
        throw new Error(
            `Unsupported application method ${p_app_method} for ${p_app_name} (${p_id}) on grassland`,
        )
    }
    if (isCropland) {
        if (p_app_method === "narrowband") {
            return new Decimal(0.36)
        }
        if (p_app_method === "shallow injection") {
            return new Decimal(0.24)
        }
        throw new Error(
            `Unsupported application method ${p_app_method} for ${p_app_name} (${p_id})  for cropland`,
        )
    }

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
    if (p_app_method === "shallow shallow injection") {
        return new Decimal(0.25)
    }
    if (p_app_method === "incorporation") {
        return new Decimal(0.22)
    }
    if (p_app_method === "narrowband") {
        return new Decimal(0.264)
    }
    throw new Error(
        `Unsupported application method ${p_app_method} for ${p_app_name} (${p_id}) for bare soil`,
    )
}
