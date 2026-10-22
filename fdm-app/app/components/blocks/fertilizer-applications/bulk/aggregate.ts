import {
  aggregateNutrientAdviceToFarmLevel,
  calculateNitrogenBalancesFieldToFarm,
  type AggregatedNormFillingsToFarmLevel,
  type AggregatedNormsToFarmLevel,
  type NitrogenBalanceFieldNumeric,
  type NitrogenBalanceFieldResultNumeric,
  type NitrogenBalanceNumeric,
} from "@nmi-agro/fdm-calculator/browser"
import { computeAdviceProgress } from "~/components/blocks/nutrient-advice/progress-bar"
import {
  BULK_NUTRIENTS,
  type BulkFieldAdvice,
  type BulkFieldOption,
  type BulkNormKey,
  type BulkNutrient,
  type BulkNutrientValues,
} from "./types"

/** Status of a field on the bulk page. Shown with an icon and text, never with colour alone. */
export type FieldImpactStatus =
  | "ok"
  | "over_advice"
  | "over_target"
  | "missing_soil_data"
  | "bufferstrip"
  | "no_crop"
  | "not_calculated"

/** One row of the field table. All values are in kg/ha. */
export interface FieldImpactRow {
  b_id: string
  b_name: string
  b_area: number
  mainCultivationName: string | null
  included: boolean
  /** `false` in the rotation flow when the field does not have the selected crop. */
  hasSelectedCrop: boolean
  advice?: BulkNutrientValues
  dose?: BulkNutrientValues
  /** Dose after the application, when a preview is available. */
  doseAfter?: BulkNutrientValues
  balance?: NitrogenBalanceFieldNumeric
  /** Balance after the application, when a preview is available. */
  balanceAfter?: NitrogenBalanceFieldNumeric
  statuses: FieldImpactStatus[]
  /** Messages that explain why (part of) the field is not calculated. */
  messages: string[]
}

const SOIL_DATA_PATTERN = /soil parameters|bodem/i

/**
 * Combines the field options, the current advice and balance, and the preview into table rows.
 *
 * @param fields - The selected fields.
 * @param included - The ids of the fields the application will be added to.
 * @param cultivationIds - In the rotation flow, the selected crop. Empty otherwise.
 */
export function buildFieldImpactRows({
  fields,
  included,
  cultivationIds,
  advice,
  balance,
  previewDoses,
  previewBalance,
}: {
  fields: BulkFieldOption[]
  included: Set<string>
  cultivationIds: string[]
  advice?: BulkFieldAdvice[]
  balance?: NitrogenBalanceFieldResultNumeric[]
  /** Dose per changed field after the change, in kg/ha. */
  previewDoses?: Record<string, BulkNutrientValues>
  previewBalance?: NitrogenBalanceFieldResultNumeric[]
}): FieldImpactRow[] {
  const adviceById = new Map(advice?.map((row) => [row.b_id, row]))
  const balanceById = new Map(balance?.map((row) => [row.b_id, row]))
  const previewBalanceById = new Map(previewBalance?.map((row) => [row.b_id, row]))

  return fields.map((field) => {
    const isIncluded = included.has(field.b_id)
    const adviceRow = adviceById.get(field.b_id)
    const balanceRow = balanceById.get(field.b_id)
    const previewBalanceRow = isIncluded ? previewBalanceById.get(field.b_id) : undefined
    const doseAfter = isIncluded ? previewDoses?.[field.b_id] : undefined

    const statuses: FieldImpactStatus[] = []
    const messages: string[] = []

    if (field.b_bufferstrip) {
      statuses.push("bufferstrip")
    } else if (field.cultivations.length === 0) {
      statuses.push("no_crop")
    } else {
      const errors = [adviceRow?.errorMessage, balanceRow?.errorMessage].filter(
        (message): message is string => Boolean(message),
      )
      messages.push(...new Set(errors))
      if (errors.some((message) => SOIL_DATA_PATTERN.test(message))) {
        statuses.push("missing_soil_data")
      } else if (errors.length > 0) {
        statuses.push("not_calculated")
      }

      const dose = doseAfter ?? adviceRow?.dose
      if (adviceRow?.advice && dose) {
        const overAdvice = BULK_NUTRIENTS.some(
          (nutrient) =>
            computeAdviceProgress(dose[nutrient], adviceRow.advice?.[nutrient] ?? 0).status ===
            "over",
        )
        if (overAdvice) statuses.push("over_advice")
      }
      const fieldBalance = previewBalanceRow?.balance ?? balanceRow?.balance
      if (fieldBalance && fieldBalance.balance > fieldBalance.target) {
        statuses.push("over_target")
      }
      if (statuses.length === 0 && adviceRow && balanceRow) statuses.push("ok")
    }

    return {
      b_id: field.b_id,
      b_name: field.b_name,
      b_area: field.b_area,
      mainCultivationName: field.mainCultivationName,
      included: isIncluded,
      hasSelectedCrop:
        cultivationIds.length === 0 || field.cultivations.some((c) => cultivationIds.includes(c)),
      advice: adviceRow?.advice,
      dose: adviceRow?.dose,
      doseAfter,
      balance: balanceRow?.balance,
      balanceAfter: previewBalanceRow?.balance,
      statuses,
      messages,
    }
  })
}

/** The area-weighted dose and advice of the included fields, in kg/ha. */
export interface AdviceSummary {
  advice: BulkNutrientValues
  dose: BulkNutrientValues
  doseAfter?: BulkNutrientValues
  /** Number of included fields that are part of the aggregation. */
  countedFields: number
  includedFields: number
}

function toValues(
  aggregated: Record<BulkNutrient, { dose: number; advice: number }>,
  key: "dose" | "advice",
): BulkNutrientValues {
  return {
    n: aggregated.n[key],
    p: aggregated.p[key],
    k: aggregated.k[key],
  }
}

/**
 * Aggregates the advice and dose of the included fields to an area-weighted average per ha.
 * Buffer strips and fields without advice are left out. The dose after the application is only
 * returned when the preview covers every counted field.
 */
export function summarizeAdvice(rows: FieldImpactRow[]): AdviceSummary {
  const included = rows.filter((row) => row.included)
  const counted = included.filter(
    (row): row is FieldImpactRow & { advice: BulkNutrientValues; dose: BulkNutrientValues } =>
      !row.statuses.includes("bufferstrip") && Boolean(row.advice && row.dose),
  )

  const current = aggregateNutrientAdviceToFarmLevel(
    counted.map((row) => ({
      b_area: row.b_area,
      values: Object.fromEntries(
        BULK_NUTRIENTS.map((n) => [n, { dose: row.dose[n], advice: row.advice[n] }]),
      ) as Record<BulkNutrient, { dose: number; advice: number }>,
    })),
    BULK_NUTRIENTS,
    "per_ha",
  )

  const hasPreview = counted.length > 0 && counted.every((row) => row.doseAfter)
  const after = hasPreview
    ? aggregateNutrientAdviceToFarmLevel(
        counted.map((row) => ({
          b_area: row.b_area,
          values: Object.fromEntries(
            BULK_NUTRIENTS.map((n) => [
              n,
              { dose: row.doseAfter?.[n] ?? 0, advice: row.advice[n] },
            ]),
          ) as Record<BulkNutrient, { dose: number; advice: number }>,
        })),
        BULK_NUTRIENTS,
        "per_ha",
      )
    : undefined

  return {
    advice: toValues(current, "advice"),
    dose: toValues(current, "dose"),
    doseAfter: after ? toValues(after, "dose") : undefined,
    countedFields: counted.length,
    includedFields: included.length,
  }
}

/** The area-weighted nitrogen balance of the included fields, in kg N/ha. */
export interface BalanceSummary {
  current: NitrogenBalanceNumeric
  after?: NitrogenBalanceNumeric
  countedFields: number
  includedFields: number
}

/**
 * Aggregates the nitrogen balance of the included fields to an area-weighted average per ha.
 * Buffer strips and fields without a balance are left out, as in the farm balance.
 */
export function summarizeBalance(rows: FieldImpactRow[]): BalanceSummary {
  const included = rows.filter((row) => row.included && !row.statuses.includes("bufferstrip"))
  const counted = included.filter((row) => row.balance)
  const toResult = (
    row: FieldImpactRow,
    balance: NitrogenBalanceFieldNumeric | undefined,
  ): NitrogenBalanceFieldResultNumeric => ({
    b_id: row.b_id,
    b_area: row.b_area,
    b_bufferstrip: false,
    balance,
  })

  const current = calculateNitrogenBalancesFieldToFarm(
    counted.map((row) => toResult(row, row.balance)),
    false,
    [],
  )
  const hasPreview = counted.length > 0 && counted.every((row) => row.balanceAfter)
  const after = hasPreview
    ? calculateNitrogenBalancesFieldToFarm(
        counted.map((row) => toResult(row, row.balanceAfter)),
        false,
        [],
      )
    : undefined

  return {
    current,
    after,
    countedFields: counted.length,
    includedFields: rows.filter((row) => row.included).length,
  }
}

/** A farm norm that is exceeded, or the room that is left, after the application. */
export interface NormOutcome {
  key: BulkNormKey
  /** Norm minus filling after the application, in kg. Negative when exceeded. */
  remaining: number
}

/**
 * Determines, for each farm norm that the application adds to, how much room is left or by how
 * much the norm is exceeded after the application.
 */
export function getNormOutcomes(
  norms: AggregatedNormsToFarmLevel,
  current: AggregatedNormFillingsToFarmLevel,
  after: AggregatedNormFillingsToFarmLevel,
  showRenure: boolean,
): NormOutcome[] {
  const keys: BulkNormKey[] = showRenure
    ? ["nitrogen", "phosphate", "manure", "renure"]
    : ["nitrogen", "phosphate", "manure"]
  return keys.flatMap((key) => {
    const norm = norms[key] ?? 0
    const added = (after[key] ?? 0) - (current[key] ?? 0)
    if (added <= 0) return []
    return [{ key, remaining: norm - (after[key] ?? 0) }]
  })
}
