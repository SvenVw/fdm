import Decimal from "decimal.js"
import type {
    OrganicMatterSupplyCultivations,
    CultivationDetail,
    FieldInput,
} from "../types.d"

export function calculateOrganicMatterSupplyByCultivations(
    cultivations: FieldInput["cultivations"],
    cultivationDetailsMap: Map<string, CultivationDetail>,
): OrganicMatterSupplyCultivations {
    let total = new Decimal(0)
    const cultivationsSupply: { id: string; value: Decimal }[] = []

    for (const cult of cultivations) {
        const cultivationDetail = cultivationDetailsMap.get(cult.b_lu_catalogue)
        if (cultivationDetail?.b_lu_eom) {
            // b_lu_eom is kg/ha/yr. Assuming this is the annual contribution of the crop
            const omSupply = new Decimal(cultivationDetail.b_lu_eom)
            total = total.plus(omSupply)
            cultivationsSupply.push({ id: cult.b_lu, value: omSupply })
        }
    }

    return {
        total,
        cultivations: cultivationsSupply,
    }
}
