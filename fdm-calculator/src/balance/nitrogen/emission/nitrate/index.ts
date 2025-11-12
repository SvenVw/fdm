/**
 * @file This module is intended to calculate nitrogen emissions via nitrate (`NO3`) leaching.
 * Currently, it contains a placeholder implementation.
 *
 * @packageDocumentation
 */
import Decimal from "decimal.js"
import type { NitrogenEmissionNitrate } from "../../types"

/**
 * Calculates the nitrogen emission via nitrate (`NO3`) leaching.
 *
 * @remarks
 * This is a placeholder function. The model for nitrate emission has not yet been
 * implemented. It currently returns a zero value.
 *
 * @returns A `NitrogenEmissionNitrate` object with a total value of zero.
 */
export function calculateNitrogenEmissionViaNitrate(): NitrogenEmissionNitrate {
    const nitrate = {
        total: new Decimal(0),
    }

    return nitrate
}
