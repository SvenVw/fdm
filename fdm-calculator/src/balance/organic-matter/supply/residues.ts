import Decimal from "decimal.js"
import type {
    OrganicMatterSupplyResidues,
    CultivationDetail,
    FieldInput,
    OrganicMatterBalanceInput,
} from "../types.d"

export function calculateOrganicMatterSupplyByResidues(
    cultivations: FieldInput["cultivations"],
    cultivationDetailsMap: Map<string, CultivationDetail>,
    timeFrame: OrganicMatterBalanceInput["timeFrame"],
): OrganicMatterSupplyResidues {
    let total = new Decimal(0)
    const cultivationsSupply: { id: string; value: Decimal }[] = []

    for (const cult of cultivations) {
        const cultivationDetail = cultivationDetailsMap.get(cult.b_lu_catalogue)
        if (cultivationDetail?.b_lu_eom_residues && cult.m_cropresidue) {
            // Check if the cultivation termination date is within the timeframe
            const terminationDate = cult.b_lu_end ? new Date(cult.b_lu_end) : null
            if (terminationDate && terminationDate >= timeFrame.start && terminationDate <= timeFrame.end) {
                // b_lu_eom_residues is kg/ha/yr. Assuming this is the annual contribution of residues
                const omSupply = new Decimal(cultivationDetail.b_lu_eom_residues)
                total = total.plus(omSupply)
                cultivationsSupply.push({ id: cult.b_id, value: omSupply })
            }
        }
    }

    return {
        total,
        cultivations: cultivationsSupply,
    }
}
