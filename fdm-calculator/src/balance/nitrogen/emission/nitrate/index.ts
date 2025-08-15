import Decimal from "decimal.js"
import type { NitrogenEmissionNitrate } from "../../types"

export function calculateNitrogenEmissionViaNitrate(): NitrogenEmissionNitrate {
    const nitrate = {
        total: new Decimal(0),
    }

    return nitrate
}
