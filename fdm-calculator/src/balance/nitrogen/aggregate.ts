import Decimal from "decimal.js"
import type {
  NitrogenBalanceFieldNumeric,
  NitrogenBalanceFieldResultNumeric,
  NitrogenBalanceNumeric,
} from "./types"
import { convertDecimalToNumberRecursive } from "../shared/conversion"

/**
 * Aggregates nitrogen balances from individual fields to the farm level.
 *
 * This function takes an array of nitrogen balance results for individual fields and aggregates
 * them to provide an overall nitrogen balance for the entire farm. It calculates weighted
 * averages of nitrogen supply, removal, and emission based on the area of each field.
 *
 * The function returns a comprehensive nitrogen balance for the farm, including total supply,
 * removal, emission, and the overall balance.
 * @param fieldsWithBalanceResults - An array of nitrogen balance results for individual fields, potentially including errors.
 * @param hasErrors - Indicates if any field calculations failed.
 * @param fieldErrorMessages - A list of error messages for fields that failed to calculate.
 * @returns The aggregated nitrogen balance for the farm.
 */
export function calculateNitrogenBalancesFieldToFarm(
  fieldsWithBalanceResults: NitrogenBalanceFieldResultNumeric[],
  hasErrors: boolean,
  fieldErrorMessages: string[],
): NitrogenBalanceNumeric {
  // Filter out fields that have errors for aggregation
  // Also filter out buffer strips as they should be ignored in the farm-level aggregation
  const successfulFieldBalances = fieldsWithBalanceResults.filter(
    (result) => result.balance !== undefined && !result.b_bufferstrip,
  ) as (NitrogenBalanceFieldResultNumeric & {
    balance: NitrogenBalanceFieldNumeric
  })[]

  // Calculate total weighted supply, removal, and emission across the farm
  const fertilizerTypes = ["mineral", "manure", "compost", "other"] as const
  let totalFarmSupply = new Decimal(0)
  let totalFarmSupplyDeposition = new Decimal(0)
  let totalFarmSupplyFixation = new Decimal(0)
  let totalFarmSupplyMineralization = new Decimal(0)
  const totalFarmSupplyFertilizers = Object.fromEntries(
    fertilizerTypes.reduce(
      (arr, key) => {
        arr.push([key, new Decimal(0)])
        return arr
      },
      [] as [(typeof fertilizerTypes)[number], Decimal][],
    ),
  ) as Record<(typeof fertilizerTypes)[number], Decimal>
  let totalFarmRemoval = new Decimal(0)
  let totalFarmRemovalHarvest = new Decimal(0)
  let totalFarmRemovalResidue = new Decimal(0)

  let totalFarmEmission = new Decimal(0)
  let totalFarmEmissionAmmonia = new Decimal(0)
  let totalFarmEmissionAmmoniaFertilizer = new Decimal(0)
  const ammoniaByFertilizerType = Object.fromEntries(
    fertilizerTypes.reduce(
      (arr, key) => {
        arr.push([key, new Decimal(0)])
        return arr
      },
      [] as [(typeof fertilizerTypes)[number], Decimal][],
    ),
  ) as Record<(typeof fertilizerTypes)[number], Decimal>
  let totalFarmEmissionAmmoniaResidue = new Decimal(0)
  let totalFarmEmissionNitrate = new Decimal(0)
  let totalFarmTarget = new Decimal(0)
  let totalFarmArea = new Decimal(0)

  for (const fieldResult of successfulFieldBalances) {
    const fieldArea = new Decimal(fieldResult.b_area ?? 0)
    totalFarmArea = totalFarmArea.add(fieldArea)

    totalFarmSupply = totalFarmSupply.add(
      new Decimal(fieldResult.balance.supply.total).times(fieldArea),
    )
    totalFarmSupplyDeposition = totalFarmSupplyDeposition.add(
      new Decimal(fieldResult.balance.supply.deposition.total).times(fieldArea),
    )
    totalFarmSupplyFixation = totalFarmSupplyFixation.add(
      new Decimal(fieldResult.balance.supply.fixation.total).times(fieldArea),
    )
    totalFarmSupplyMineralization = totalFarmSupplyMineralization.add(
      new Decimal(fieldResult.balance.supply.mineralisation.total).times(fieldArea),
    )
    for (const fertilizerType of fertilizerTypes) {
      totalFarmSupplyFertilizers[fertilizerType] = totalFarmSupplyFertilizers[fertilizerType].add(
        new Decimal(fieldResult.balance.supply.fertilizers[fertilizerType].total).times(fieldArea),
      )
    }

    totalFarmRemoval = totalFarmRemoval.add(
      new Decimal(fieldResult.balance.removal.total).times(fieldArea),
    )
    totalFarmRemovalHarvest = totalFarmRemovalHarvest.add(
      new Decimal(fieldResult.balance.removal.harvests.total).times(fieldArea),
    )
    totalFarmRemovalResidue = totalFarmRemovalResidue.add(
      new Decimal(fieldResult.balance.removal.residues.total).times(fieldArea),
    )
    totalFarmEmission = totalFarmEmission.add(
      new Decimal(fieldResult.balance.emission.total).times(fieldArea),
    )
    totalFarmEmissionAmmonia = totalFarmEmissionAmmonia.add(
      new Decimal(fieldResult.balance.emission.ammonia.total).times(fieldArea),
    )

    for (const fertilizerType of fertilizerTypes) {
      const fieldTotal = new Decimal(
        fieldResult.balance.emission.ammonia.fertilizers[fertilizerType].total,
      ).times(fieldArea)
      ammoniaByFertilizerType[fertilizerType] =
        ammoniaByFertilizerType[fertilizerType].add(fieldTotal)
      totalFarmEmissionAmmoniaFertilizer = totalFarmEmissionAmmoniaFertilizer.add(fieldTotal)
    }

    totalFarmEmissionAmmoniaResidue = totalFarmEmissionAmmoniaResidue.add(
      new Decimal(fieldResult.balance.emission.ammonia.residues.total).times(fieldArea),
    )

    totalFarmEmissionNitrate = totalFarmEmissionNitrate.add(
      new Decimal(fieldResult.balance.emission.nitrate.total).times(fieldArea),
    )

    totalFarmTarget = totalFarmTarget.add(new Decimal(fieldResult.balance.target).times(fieldArea))
  }

  // Calculate average values per hectare for the farm, only considering the area of successfully calculated fields
  const avgFarmSupply = totalFarmArea.isZero()
    ? new Decimal(0)
    : totalFarmSupply.dividedBy(totalFarmArea)
  const avgFarmSupplyDeposition = totalFarmArea.isZero()
    ? new Decimal(0)
    : totalFarmSupplyDeposition.dividedBy(totalFarmArea)
  const avgFarmSupplyFixation = totalFarmArea.isZero()
    ? new Decimal(0)
    : totalFarmSupplyFixation.dividedBy(totalFarmArea)
  const avgFarmSupplyMineralization = totalFarmArea.isZero()
    ? new Decimal(0)
    : totalFarmSupplyMineralization.dividedBy(totalFarmArea)
  let totalFarmSupplyFertilizersTotal = new Decimal(0)
  for (const fertilizerType of fertilizerTypes) {
    const value = totalFarmSupplyFertilizers[fertilizerType]
    totalFarmSupplyFertilizers[fertilizerType] = totalFarmArea.isZero()
      ? new Decimal(0)
      : value.dividedBy(totalFarmArea)
    totalFarmSupplyFertilizersTotal = totalFarmSupplyFertilizersTotal.add(value)
  }
  totalFarmSupplyFertilizersTotal = totalFarmArea.isZero()
    ? new Decimal(0)
    : totalFarmSupplyFertilizersTotal.dividedBy(totalFarmArea)
  const avgFarmRemoval = totalFarmArea.isZero()
    ? new Decimal(0)
    : totalFarmRemoval.dividedBy(totalFarmArea)
  const avgFarmRemovalHarvest = totalFarmArea.isZero()
    ? new Decimal(0)
    : totalFarmRemovalHarvest.dividedBy(totalFarmArea)
  const avgFarmRemovalResidue = totalFarmArea.isZero()
    ? new Decimal(0)
    : totalFarmRemovalResidue.dividedBy(totalFarmArea)
  const avgFarmEmission = totalFarmArea.isZero()
    ? new Decimal(0)
    : totalFarmEmission.dividedBy(totalFarmArea)
  const avgFarmEmissionAmmonia = totalFarmArea.isZero()
    ? new Decimal(0)
    : totalFarmEmissionAmmonia.dividedBy(totalFarmArea)
  const avgFarmEmissionAmmoniaFertilizer = totalFarmArea.isZero()
    ? new Decimal(0)
    : totalFarmEmissionAmmoniaFertilizer.dividedBy(totalFarmArea)
  const avgFarmEmissionAmmoniaResidue = totalFarmArea.isZero()
    ? new Decimal(0)
    : totalFarmEmissionAmmoniaResidue.dividedBy(totalFarmArea)
  const avgFarmEmissionNitrate = totalFarmArea.isZero()
    ? new Decimal(0)
    : totalFarmEmissionNitrate.dividedBy(totalFarmArea)
  const avgFarmTarget = totalFarmArea.isZero()
    ? new Decimal(0)
    : totalFarmTarget.dividedBy(totalFarmArea)
  for (const fertilizerType of fertilizerTypes) {
    ammoniaByFertilizerType[fertilizerType] = totalFarmArea.isZero()
      ? new Decimal(0)
      : ammoniaByFertilizerType[fertilizerType].dividedBy(totalFarmArea)
  }

  // Calculate the average balance at farm level (Supply + Removal + Ammonia Emission)
  const avgFarmBalance = avgFarmSupply.add(avgFarmRemoval).add(avgFarmEmissionAmmonia)

  // Return the farm with average balances per hectare
  const farmWithBalance = {
    balance: avgFarmBalance,
    supply: {
      total: avgFarmSupply,
      deposition: avgFarmSupplyDeposition,
      fixation: avgFarmSupplyFixation,
      mineralisation: avgFarmSupplyMineralization,
      fertilizers: {
        ...totalFarmSupplyFertilizers,
        total: totalFarmSupplyFertilizersTotal,
      },
    },
    removal: {
      total: avgFarmRemoval,
      harvests: avgFarmRemovalHarvest,
      residues: avgFarmRemovalResidue,
    },
    emission: {
      total: avgFarmEmission,
      ammonia: {
        total: avgFarmEmissionAmmonia,
        residues: avgFarmEmissionAmmoniaResidue,
        fertilizers: {
          total: avgFarmEmissionAmmoniaFertilizer,
          ...ammoniaByFertilizerType,
        },
      },
      nitrate: avgFarmEmissionNitrate,
    },
    target: avgFarmTarget,
    fields: fieldsWithBalanceResults,
    hasErrors:
      hasErrors ||
      fieldsWithBalanceResults.filter((result) => !result.b_bufferstrip).length !==
        successfulFieldBalances.length,
    fieldErrorMessages: fieldErrorMessages,
  }

  return convertDecimalToNumberRecursive(farmWithBalance) as NitrogenBalanceNumeric
}
