/**
 * @packageDocumentation
 * @module mineralization/scenario
 *
 * What-if scenarios: changes to the fertilization plan and the harvest that are calculated with
 * Dyna before they are saved.
 */

import { type Fertilizer, toFdmDateString, toKgPerHa } from "@nmi-agro/fdm-core"
import { z } from "zod"
import type { DynaV2Request } from "./types"
import {
  buildFertilizerProperties,
  type MineralizationApplication,
  type MineralizationCultivation,
  type MineralizationFertilizer,
  mapApplicationMethod,
} from "./prepare"

/** Fertilizer application in a scenario. Amounts are in the display unit of the fertilizer. */
export interface ScenarioFertilizerApplication {
  /** Identifier of an existing application; absent for new applications. */
  p_app_id?: string
  p_id: string
  /** Amount in the display unit of the fertilizer (`p_app_amount_unit`). */
  p_app_amount_display: number
  p_app_method: string
  /** Calendar date (`YYYY-MM-DD`). */
  p_app_date: string
}

/** Scenario for one field: the full list of applications in the year and the harvest of the main crop. */
export interface MineralizationScenario {
  fertilizerApplications: ScenarioFertilizerApplication[]
  /** (Last) harvest of the main cultivation; absent to keep the current harvest. */
  harvest?: { b_date_harvest: string; b_lu_yield?: number }
}

/** Fertilizer properties needed to calculate a scenario. */
export type ScenarioFertilizer = MineralizationFertilizer &
  Pick<Fertilizer, "p_app_amount_unit" | "p_density">

/** Changes needed to save a scenario. */
export interface ScenarioDiff {
  add: ScenarioFertilizerApplication[]
  update: (ScenarioFertilizerApplication & { p_app_id: string })[]
  /** `p_app_id` of the applications to remove. */
  remove: string[]
  /** Harvest to add (`b_id_harvesting` null) or update; `null` when unchanged. */
  harvest: { b_id_harvesting: string | null; b_date_harvest: string; b_lu_yield?: number } | null
}

/**
 * Returns the schema that validates a scenario for a calendar year.
 *
 * Dates must be `YYYY-MM-DD` within the year and amounts must not be negative.
 *
 * @param year - Calendar year of the scenario.
 * @returns Zod schema of {@link MineralizationScenario}.
 */
export function getMineralizationScenarioSchema(year: number) {
  const dateInYear = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ongeldige datum")
    .refine((date) => date.startsWith(`${year}-`), `De datum moet in ${year} liggen`)
  return z.object({
    fertilizerApplications: z.array(
      z.object({
        p_app_id: z.string().optional(),
        p_id: z.string().min(1),
        p_app_amount_display: z.number().min(0),
        p_app_method: z.string().min(1),
        p_app_date: dateInYear,
      }),
    ),
    harvest: z
      .object({ b_date_harvest: dateInYear, b_lu_yield: z.number().min(0).optional() })
      .optional(),
  })
}

/**
 * Applies a scenario to a prepared Dyna v2 request.
 *
 * The fertilizer applications of the request are replaced by those of the scenario (converted to
 * kg/ha). When the scenario contains a harvest, it replaces the last harvest of the main
 * cultivation; for crops harvested once, the cultivation then also ends on that date.
 *
 * @param args.request - Request prepared with `prepareMineralizationInput`.
 * @param args.scenario - Scenario to apply.
 * @param args.fertilizers - Fertilizers of the farm by `p_id`.
 * @param args.mainB_lu - `b_lu` of the main cultivation.
 * @param args.mainHarvestable - Whether the main cultivation is harvested once or multiple times.
 * @returns A new request; the input is not modified.
 * @throws `Error` when the scenario uses a fertilizer that is not known on the farm.
 */
export function applyScenarioToRequest(args: {
  request: DynaV2Request
  scenario: MineralizationScenario
  fertilizers: Map<string, ScenarioFertilizer>
  mainB_lu: string
  mainHarvestable: MineralizationCultivation["b_lu_harvestable"]
}): DynaV2Request {
  const { request, scenario, fertilizers, mainB_lu, mainHarvestable } = args
  const result: DynaV2Request = { ...request }

  const applications = [...scenario.fertilizerApplications].sort((a, b) =>
    a.p_app_date.localeCompare(b.p_app_date),
  )
  const properties = new Map<string, NonNullable<DynaV2Request["fertilizer_properties"]>[number]>()
  result.fertilizer_applications = applications.map((application) => {
    const fertilizer = fertilizers.get(application.p_id)
    if (!fertilizer) throw new Error(`Onbekende meststof: ${application.p_id}`)
    if (!properties.has(fertilizer.p_id)) {
      properties.set(fertilizer.p_id, buildFertilizerProperties(fertilizer))
    }
    return {
      p_id: application.p_id,
      p_app_amount: toKgPerHa(
        application.p_app_amount_display,
        fertilizer.p_app_amount_unit,
        fertilizer.p_density,
      ),
      p_date_fertilization: application.p_app_date,
      p_app_method: mapApplicationMethod(application.p_app_method),
    }
  })
  result.fertilizer_properties = [...properties.values()]
  if (result.fertilizer_applications.length === 0) {
    delete result.fertilizer_applications
    delete result.fertilizer_properties
  }

  if (scenario.harvest) {
    const { b_date_harvest, b_lu_yield } = scenario.harvest
    const harvests = request.harvests ?? []
    const mainHarvests = harvests.filter((h) => h.b_lu_id === mainB_lu)
    const replaced = mainHarvests.at(-1)
    const newHarvest = {
      ...replaced,
      b_lu_id: mainB_lu,
      b_date_harvest,
      ...(b_lu_yield !== undefined ? { b_lu_yield } : {}),
    }
    const keptMain = mainHarvestable === "once" ? [] : mainHarvests.slice(0, -1)
    result.harvests = [...harvests.filter((h) => h.b_lu_id !== mainB_lu), ...keptMain, newHarvest]
    if (mainHarvestable === "once") {
      result.cultivations = request.cultivations?.map((c) =>
        c.b_lu_id === mainB_lu ? { ...c, b_lu_end: b_date_harvest } : c,
      )
    }
  }

  return result
}

/**
 * Determines which changes are needed to save a scenario.
 *
 * @param current - Current fertilizer applications of the field in the scenario's year.
 * @param currentHarvest - Current (last) harvest of the main cultivation, or `null`.
 * @param scenario - Scenario to save.
 * @returns Applications to add, update and remove, and the harvest to add or update.
 */
export function diffScenario(
  current: MineralizationApplication[],
  currentHarvest: {
    b_id_harvesting: string
    b_date_harvest: string
    b_lu_yield: number | null
  } | null,
  scenario: MineralizationScenario,
): ScenarioDiff {
  const diff: ScenarioDiff = { add: [], update: [], remove: [], harvest: null }
  const scenarioIds = new Set<string>()

  for (const application of scenario.fertilizerApplications) {
    if (!application.p_app_id) {
      diff.add.push(application)
      continue
    }
    scenarioIds.add(application.p_app_id)
    const existing = current.find((c) => c.p_app_id === application.p_app_id)
    if (!existing) {
      diff.add.push(application)
      continue
    }
    const changed =
      existing.p_id !== application.p_id ||
      (existing.p_app_amount_display ?? existing.p_app_amount) !==
        application.p_app_amount_display ||
      (existing.p_app_method ?? "") !== application.p_app_method ||
      toFdmDateString(existing.p_app_date) !== application.p_app_date
    if (changed) diff.update.push({ ...application, p_app_id: application.p_app_id })
  }

  for (const existing of current) {
    if (!scenarioIds.has(existing.p_app_id)) diff.remove.push(existing.p_app_id)
  }

  if (scenario.harvest) {
    const { b_date_harvest, b_lu_yield } = scenario.harvest
    const changed =
      !currentHarvest ||
      currentHarvest.b_date_harvest !== b_date_harvest ||
      (b_lu_yield !== undefined && b_lu_yield !== currentHarvest.b_lu_yield)
    if (changed) {
      diff.harvest = {
        b_id_harvesting: currentHarvest?.b_id_harvesting ?? null,
        b_date_harvest,
        ...(b_lu_yield !== undefined ? { b_lu_yield } : {}),
      }
    }
  }

  return diff
}
