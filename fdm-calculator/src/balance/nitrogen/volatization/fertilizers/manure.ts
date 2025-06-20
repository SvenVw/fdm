import Decimal from "decimal.js"
import type {
    CultivationDetail,
    FertilizerDetail,
    FieldInput,
    NitrogenEmissionAmmoniaFertilizers,
} from "../../types"
import type { FertilizerApplication } from "@svenvw/fdm-core"

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

function determineManureAmmoniaEmmissionFactor(
    fertilizerApplication: FertilizerApplication,
    cultivations: FieldInput["cultivations"],
    cultivationDetails: Map<string, CultivationDetail>,
) {
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
        if (type?.b_lu_croprotation === "grassland") {
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
        if (p_app_method === "injection_shallow") {
            return new Decimal(0.17)
        }
        throw new Error(
            `Unsupported application method ${p_app_method} for ${p_id} on grassland`,
        )
    }
    if (isCropland) {
        if (p_app_method === "narrowband") {
            return new Decimal(0.36)
        }
        if (p_app_method === "injection_shallow") {
            return new Decimal(0.24)
        }
        throw new Error(
            `Unsupported application method ${p_app_method} for ${p_id} for cropland`,
        )
    }

    // Bare soil
    if (p_app_method === "broadcasting") {
        return new Decimal(0.69)
    }
    if (p_app_method === "incorporation_2tracks") {
        return new Decimal(0.46)
    }
    if (p_app_method === "narrowband") {
        return new Decimal(0.36)
    }
    if (p_app_method === "slotted coulter") {
        return new Decimal(0.3)
    }
    if (p_app_method === "shallow injection_shallow") {
        return new Decimal(0.25)
    }
    if (p_app_method === "incorporation") {
        return new Decimal(0.22)
    }
    if (p_app_method === "narrowband") {
        return new Decimal(0.264)
    }
    throw new Error(
        `Unsupported application method ${p_app_method} for ${p_id} for bare soil`,
    )
}
