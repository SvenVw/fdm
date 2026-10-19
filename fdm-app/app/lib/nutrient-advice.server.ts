import type { getFields, Timeframe } from "@nmi-agro/fdm-core"
import { calculateDose, getNutrientAdvice } from "@nmi-agro/fdm-calculator"
import {
  getCultivationsForFarm,
  getCurrentSoilDataForFarm,
  getFertilizerApplicationsForFarm,
  getFertilizers,
} from "@nmi-agro/fdm-core"
import type { FieldNutrientRow } from "~/components/blocks/nutrient-advice/overview-types"
import { getNutrientsDescription } from "~/components/blocks/nutrient-advice/nutrients"
import { toFriendlyAdviceError } from "~/components/blocks/nutrient-advice/overview-errors"
import { getNmiApiKey } from "~/integrations/nmi.server"
import { getCultivationSuggestion } from "~/lib/cultivation-suggestion.server"
import { fdm } from "~/lib/fdm.server"
import { getMainCultivation } from "~/lib/hoofdteelt.server"

/**
 * Cap on simultaneous `getNutrientAdvice` calls per farm, so farms with many fields don't overload
 * the external NMI API with unbounded parallel requests.
 */
export const NUTRIENT_ADVICE_CONCURRENCY = 4

/** A field as returned by `getFields`. */
type FarmField = Awaited<ReturnType<typeof getFields>>[number]

/** Request context needed to calculate the nutrient advice of a farm. */
export type FarmNutrientAdviceArgs = {
  /** Principal of the current session, used for permission checks in fdm-core. */
  principal_id: string
  /** Farm whose fields are evaluated. */
  b_id_farm: string
  /** Calendar year (e.g. `"2026"`), used to select the main cultivation ("hoofdteelt"). */
  calendar: string
  /** Timeframe of the calendar year, used to select cultivations and fertilizer applications. */
  timeframe: Timeframe
}

/**
 * Splits an array into consecutive chunks of at most `size` items each.
 *
 * @param items - Items to split.
 * @param size - Maximum chunk size; must be at least 1.
 * @returns The chunks, in the original order.
 */
function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

/**
 * Builds a row for a field whose advice could not be calculated.
 *
 * @param field - The field the row belongs to.
 * @param errorMessage - User-facing (Dutch) reason.
 * @returns A {@link FieldNutrientRow} without nutrient values.
 */
function errorRow(field: FarmField, errorMessage: string): FieldNutrientRow {
  return {
    b_id: field.b_id,
    b_name: field.b_name,
    b_area: field.b_area ?? 0,
    mainCultivation: null,
    errorMessage,
    values: {},
  }
}

/**
 * Calculates the nutrient advice and the already applied dose for every field of a farm.
 *
 * Farm-wide data (cultivations, fertilizer applications, soil data and fertilizers) is fetched in a
 * single batch. The NMI advice API is then called per field, with at most
 * {@link NUTRIENT_ADVICE_CONCURRENCY} requests in parallel.
 *
 * This function never throws for data problems: every failure is turned into a row with
 * `errorMessage` set, so one failing field does not break the overview table or the atlas layer.
 *
 * Shared by the Bemestingsadvies overview (`nutrient_advice._index`) and the Atlas layer
 * (`atlas.nutrient-advice._index`).
 *
 * @param args - Session principal, farm, calendar year and timeframe.
 * @param fields - Fields of the farm, as returned by `getFields`.
 * @returns One {@link FieldNutrientRow} per field, in the same order as `fields`. Values are in kg/ha.
 */
export async function getFarmNutrientAdviceRows(
  args: FarmNutrientAdviceArgs,
  fields: FarmField[],
): Promise<FieldNutrientRow[]> {
  const { principal_id, b_id_farm, calendar, timeframe } = args

  if (fields.length === 0) {
    return []
  }

  const nutrientsDescription = getNutrientsDescription()

  // Fetch farm-wide data in a handful of batched queries instead of N queries per field. If this
  // batch fails, fall back to per-field error rows instead of throwing to the route error boundary.
  let cultivationsByField: Awaited<ReturnType<typeof getCultivationsForFarm>>
  let fertilizerApplicationsByField: Awaited<ReturnType<typeof getFertilizerApplicationsForFarm>>
  let soilDataByField: Awaited<ReturnType<typeof getCurrentSoilDataForFarm>>
  let fertilizers: Awaited<ReturnType<typeof getFertilizers>>
  try {
    ;[cultivationsByField, fertilizerApplicationsByField, soilDataByField, fertilizers] =
      await Promise.all([
        getCultivationsForFarm(fdm, principal_id, b_id_farm, timeframe),
        getFertilizerApplicationsForFarm(fdm, principal_id, b_id_farm, timeframe),
        getCurrentSoilDataForFarm(fdm, principal_id, b_id_farm, timeframe),
        getFertilizers(fdm, principal_id, b_id_farm),
      ])
  } catch (error) {
    const errorMessage = toFriendlyAdviceError(error)
    return fields.map((field) => errorRow(field, errorMessage))
  }

  const nmiApiKey = getNmiApiKey()

  /** Calculates the row of a single field. May throw; the caller maps rejections to error rows. */
  async function getRow(field: FarmField): Promise<FieldNutrientRow> {
    const cultivations = cultivationsByField.get(field.b_id) ?? []
    const b_area = field.b_area ?? 0

    if (cultivations.length === 0) {
      return errorRow(field, "Geen gewas geregistreerd voor dit perceel.")
    }

    const activeCultivation = getMainCultivation(cultivations, calendar)
    const fertilizerApplications = fertilizerApplicationsByField.get(field.b_id) ?? []
    const currentSoilData = soilDataByField.get(field.b_id) ?? []

    // Only ask the NMI API for a crop suggestion when no main cultivation is registered.
    const cultivationSuggestion = activeCultivation
      ? undefined
      : await getCultivationSuggestion(
          fdm,
          principal_id,
          b_id_farm,
          field.b_id,
          calendar,
          nmiApiKey,
        )

    if (!activeCultivation) {
      return {
        b_id: field.b_id,
        b_name: field.b_name,
        b_area,
        mainCultivation: null,
        cultivationSuggestion,
        errorMessage: "Geen hoofdteelt bepaald voor dit jaar.",
        values: {},
      }
    }

    const mainCultivation = {
      b_lu: activeCultivation.b_lu,
      b_lu_name: activeCultivation.b_lu_name,
      b_lu_croprotation: activeCultivation.b_lu_croprotation ?? null,
    }

    try {
      const doses = calculateDose({ applications: fertilizerApplications, fertilizers })
      const nutrientAdvice = await getNutrientAdvice(fdm, {
        b_lu_catalogue: activeCultivation.b_lu_catalogue,
        b_centroid: field.b_centroid,
        currentSoilData,
        nmiApiKey,
        b_bufferstrip: field.b_bufferstrip,
      })

      // Same advice/dose mapping as the overview table: `d_*_req` vs `p_dose_*`, both kg/ha.
      const values: FieldNutrientRow["values"] = {}
      for (const nutrient of nutrientsDescription) {
        values[nutrient.symbol] = {
          filling: (doses.dose[nutrient.doseParameter as keyof typeof doses.dose] as number) ?? 0,
          advice:
            nutrientAdvice[
              nutrient.adviceParameter as Exclude<keyof typeof nutrientAdvice, "cuts">
            ] ?? 0,
        }
      }

      return {
        b_id: field.b_id,
        b_name: field.b_name,
        b_area,
        mainCultivation,
        cultivationSuggestion,
        values,
      }
    } catch (error) {
      return {
        b_id: field.b_id,
        b_name: field.b_name,
        b_area,
        mainCultivation,
        cultivationSuggestion,
        errorMessage: toFriendlyAdviceError(error),
        values: {},
      }
    }
  }

  const results: PromiseSettledResult<FieldNutrientRow>[] = []
  for (const fieldsChunk of chunk(fields, NUTRIENT_ADVICE_CONCURRENCY)) {
    results.push(...(await Promise.allSettled(fieldsChunk.map(getRow))))
  }

  // `results` has the same order as `fields`, because chunks are processed sequentially.
  return results.map((result, index) =>
    result.status === "fulfilled"
      ? result.value
      : errorRow(fields[index], toFriendlyAdviceError(result.reason)),
  )
}
