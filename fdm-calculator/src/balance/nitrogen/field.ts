import type {
  FertilizerDetail,
  NitrogenBalanceFieldInput,
  NitrogenBalanceFieldNumeric,
  SoilAnalysisPicked,
} from "./types"
import { convertDecimalToNumberRecursive } from "../shared/conversion"
import { combineSoilAnalyses } from "../shared/soil"
import { calculateNitrogenEmission } from "./emission"
import { calculateNitrogenEmissionViaNitrate } from "./emission/nitrate"
import { calculateNitrogenRemoval } from "./removal"
import { calculateNitrogenSupply } from "./supply"
import { calculateTargetForNitrogenBalance } from "./target"

/**
 * Calculates the nitrogen balance for a single field, considering nitrogen supply, removal, and emission.
 *
 * This function performs a detailed calculation of the nitrogen balance for a single field,
 * taking into account various sources of nitrogen supply (e.g., fertilizers, mineralization),
 * nitrogen removal (e.g., harvest, crop residues), and nitrogen losses through emission.
 *
 * The calculation relies on detailed input parameters, including:
 *   - field characteristics
 *   - cultivation details
 *   - harvest yields and nitrogen content
 *   - fertilizer applications and their nitrogen contributions
 *   - soil analysis data
 *
 * The calculation is pure and has no dependencies on the database, so it can also be used in the
 * browser through `@nmi-agro/fdm-calculator/browser`, for example to preview the effect of an
 * application that has not been saved yet.
 *
 * @param nitrogenBalanceInput - The input data for the nitrogen balance calculation for a single field.
 * @returns The calculated nitrogen balance for the field.
 */
export function calculateNitrogenBalanceField(
  nitrogenBalanceInput: NitrogenBalanceFieldInput,
): NitrogenBalanceFieldNumeric {
  const { fieldInput, fertilizerDetails, cultivationDetails, timeFrame } = nitrogenBalanceInput

  // Get the details of the field
  const { field, harvests, cultivations, soilAnalyses, fertilizerApplications, depositionSupply } =
    fieldInput

  if (!timeFrame.start || !timeFrame.end) {
    throw new Error("Timeframe start and end dates must be provided.")
  }

  if (field.b_bufferstrip) {
    return {
      b_id: field.b_id,
      balance: 0,
      supply: {
        total: 0,
        fertilizers: {
          total: 0,
          mineral: { total: 0, applications: [] },
          manure: { total: 0, applications: [] },
          compost: { total: 0, applications: [] },
          other: { total: 0, applications: [] },
        },
        fixation: { total: 0, cultivations: [] },
        deposition: { total: 0 },
        mineralisation: { total: 0 },
      },
      removal: {
        total: 0,
        harvests: { total: 0, harvests: [] },
        residues: { total: 0, cultivations: [] },
      },
      emission: {
        total: 0,
        ammonia: {
          total: 0,
          fertilizers: {
            total: 0,
            mineral: { total: 0, applications: [] },
            manure: { total: 0, applications: [] },
            compost: { total: 0, applications: [] },
            other: { total: 0, applications: [] },
          },
          residues: { total: 0, cultivations: [] },
          grazing: undefined,
        },
        nitrate: { total: 0 },
      },
      target: 0,
    }
  }

  const fertilizerDetailsMap = new Map<string, FertilizerDetail>(
    fertilizerDetails.map((detail) => [detail.p_id_catalogue, detail]),
  )
  const cultivationDetailsMap = new Map(
    cultivationDetails.map((detail) => [detail.b_lu_catalogue, detail]),
  )

  // Combine soil analyses
  const soilAnalysis = combineSoilAnalyses<SoilAnalysisPicked>(
    soilAnalyses,
    ["b_soiltype_agr", "a_n_rt", "a_c_of", "a_cn_fr", "a_density_sa", "a_som_loi", "b_gwl_class"],
    true,
  )

  // Use a field-local timeframe (intersection with input timeframe)
  const timeFrameStartTime = timeFrame.start.getTime()
  const timeFrameEndTime = timeFrame.end.getTime()

  const fieldStartTime = field.b_start ? field.b_start.getTime() : Number.NEGATIVE_INFINITY
  const fieldEndTime = field.b_end ? field.b_end.getTime() : Number.POSITIVE_INFINITY

  const timeFrameField = {
    start: new Date(Math.max(fieldStartTime, timeFrameStartTime)),
    end: new Date(Math.min(fieldEndTime, timeFrameEndTime)),
  }
  // Normalize: ensure start <= end
  if (timeFrameField.end.getTime() < timeFrameField.start.getTime()) {
    // Clamp to an empty interval at the boundary to signal “no overlap”
    timeFrameField.end = timeFrameField.start
  }

  // Calculate the amount of Nitrogen supplied
  const supply = calculateNitrogenSupply(
    cultivations,
    fertilizerApplications,
    soilAnalysis,
    cultivationDetailsMap,
    fertilizerDetailsMap,
    depositionSupply,
    timeFrameField,
  )

  // Calculate the amount of Nitrogen removed
  const removal = calculateNitrogenRemoval(cultivations, harvests, cultivationDetailsMap)

  // Calculate the amount of Nitrogen that is volatilized
  const emission = calculateNitrogenEmission(
    cultivations,
    harvests,
    fertilizerApplications,
    cultivationDetailsMap,
    fertilizerDetailsMap,
  )

  // Calculate the balance
  const balance = supply.total.add(removal.total).add(emission.ammonia.total)

  // Calculate the Nitrogen Emssion via Nitrate as the surplus of nitrogen balance that is leached out
  const nitrateEmission = calculateNitrogenEmissionViaNitrate(
    balance,
    cultivations,
    soilAnalysis,
    cultivationDetailsMap,
  )
  emission.nitrate = nitrateEmission
  emission.total = emission.total.add(nitrateEmission.total)

  // Calculate the target for the Nitrogen balance
  const target = calculateTargetForNitrogenBalance(
    cultivations,
    soilAnalysis,
    cultivationDetailsMap,
    timeFrameField,
  )

  const balanceNumeric = convertDecimalToNumberRecursive({
    b_id: field.b_id,
    balance: balance,
    supply: supply,
    removal: removal,
    emission: emission,
    target: target,
  }) as NitrogenBalanceFieldNumeric

  return balanceNumeric
}
