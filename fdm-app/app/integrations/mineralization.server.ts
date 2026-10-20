/**
 * @file mineralization.server.ts
 *
 * Server-side orchestration of the Mineralisatie feature.
 *
 * Gathers the FDM data of a farm once, prepares the Dyna v2 calculation per field with
 * `@nmi-agro/fdm-calculator`, runs the (cached) calculation and weather forecast, and interprets
 * the result. Per-field failures are returned as an outcome instead of being thrown, so one field
 * never breaks a page.
 */

import {
  type DynaV2Request,
  type DynaV2Result,
  deriveMineralizationInsights,
  type FieldExclusionReason,
  getDynaV2,
  getWeatherForecast,
  type MineralizationCultivation,
  type MineralizationEvent,
  type MineralizationFieldData,
  type MineralizationInsights,
  type MineralizationUsedInput,
  NmiApiError,
  prepareMineralizationInput,
  restrictToMainCultivation,
  roundCoordinate,
  type WeatherForecast,
} from "@nmi-agro/fdm-calculator"
import {
  type Fertilizer,
  type Field,
  getCultivationsForFarm,
  getCurrentSoilDataForFarm,
  getDefaultDatesOfCultivation,
  getFertilizerApplicationsForFarm,
  getFertilizers,
  getFields,
  getHarvestsForFarm,
  startOfDayInFdmTimeZone,
  type Timeframe,
  toFdmDateString,
} from "@nmi-agro/fdm-core"
import { getNmiApiKey } from "~/integrations/nmi.server"
import { fdm } from "~/lib/fdm.server"

/** All FDM data of a farm needed for the mineralization calculations of one year. */
export interface FarmMineralizationContext {
  year: number
  today: Date
  fields: Field[]
  data: Map<string, MineralizationFieldData>
  fertilizers: Fertilizer[]
}

/** Main cultivation summary that is sent to the browser. */
export type MineralizationMainCultivation = Pick<
  MineralizationCultivation,
  "b_lu" | "b_lu_catalogue" | "b_lu_name" | "b_lu_harvestable"
>

interface OutcomeBase {
  b_id: string
  b_name: string | null
  b_area: number | null
}

/** Result of the mineralization calculation of one field. */
export type FieldMineralizationOutcome =
  | (OutcomeBase & { status: "excluded"; reason: FieldExclusionReason })
  | (OutcomeBase & { status: "missing_location" | "no_cultivation" })
  | (OutcomeBase & {
      status: "missing_harvest"
      mainCultivation: MineralizationMainCultivation
      defaultHarvestDate: string | null
    })
  | (OutcomeBase & { status: "error"; message: string })
  | (OutcomeBase & {
      status: "ok"
      mainCultivation: MineralizationMainCultivation
      result: DynaV2Result
      insights: MineralizationInsights
      events: MineralizationEvent[]
      usedInput: MineralizationUsedInput
      forecast: WeatherForecast | null
      /** Start of the main cultivation as sent to Dyna (`YYYY-MM-DD`). */
      mainStart: string
      /** (Last) harvest of the main cultivation (`YYYY-MM-DD`). */
      mainHarvest: string
      /** Whether cultivations after the main crop had to be left out of the calculation. */
      partial: boolean
    })

/**
 * Returns the timeframe of a calendar year in Europe/Amsterdam.
 *
 * @param year - Calendar year.
 * @returns Timeframe from 1 January up to and including 31 December.
 */
export function getMineralizationTimeframe(year: number): Timeframe {
  return {
    start: startOfDayInFdmTimeZone(year, 1, 1),
    end: new Date(startOfDayInFdmTimeZone(year + 1, 1, 1).getTime() - 1),
  }
}

/**
 * Parses the calendar route parameter into a year; falls back to the current year.
 *
 * @param calendar - The `calendar` route parameter.
 * @returns The calendar year.
 */
export function getMineralizationYear(calendar: string | undefined): number {
  const year = Number(calendar)
  return Number.isInteger(year) && year > 1900
    ? year
    : Number(toFdmDateString(new Date()).slice(0, 4))
}

/**
 * Loads all FDM data of a farm that is needed for the mineralization calculations of a year.
 *
 * Uses one query per data type for the whole farm.
 *
 * @param args.principal_id - Principal of the session.
 * @param args.b_id_farm - Farm identifier.
 * @param args.year - Calendar year.
 * @returns The farm context.
 */
export async function loadFarmMineralizationContext(args: {
  principal_id: string
  b_id_farm: string
  year: number
}): Promise<FarmMineralizationContext> {
  const { principal_id, b_id_farm, year } = args
  const timeframe = getMineralizationTimeframe(year)
  const [fields, cultivations, harvests, applications, fertilizers, soil] = await Promise.all([
    getFields(fdm, principal_id, b_id_farm, timeframe),
    getCultivationsForFarm(fdm, principal_id, b_id_farm),
    getHarvestsForFarm(fdm, principal_id, b_id_farm, timeframe),
    getFertilizerApplicationsForFarm(fdm, principal_id, b_id_farm, timeframe),
    getFertilizers(fdm, principal_id, b_id_farm),
    getCurrentSoilDataForFarm(fdm, principal_id, b_id_farm),
  ])

  const fertilizerMap = new Map(fertilizers.map((f) => [f.p_id, f]))
  const data = new Map<string, MineralizationFieldData>()
  for (const field of fields) {
    data.set(field.b_id, {
      field: {
        b_id: field.b_id,
        b_name: field.b_name,
        b_centroid: field.b_centroid ?? null,
        b_bufferstrip: field.b_bufferstrip,
      },
      soil: soil.get(field.b_id) ?? [],
      cultivations: cultivations.get(field.b_id) ?? [],
      harvests,
      applications: applications.get(field.b_id) ?? [],
      fertilizers: fertilizerMap,
    })
  }

  return { year, today: new Date(), fields, data, fertilizers }
}

/**
 * Runs Dyna for a prepared request.
 *
 * Requests with several cultivations can fail at the API. In that case the calculation is
 * repeated with only the main cultivation and the outcome is marked as partial.
 */
async function runDyna(
  nmiApiKey: string,
  request: DynaV2Request,
  mainB_lu: string,
  calculationDate: string,
): Promise<{ result: DynaV2Result; partial: boolean }> {
  try {
    const result = await getDynaV2(fdm, { nmiApiKey, request, calculationDate })
    return { result, partial: false }
  } catch (error) {
    const multipleCultivations = (request.cultivations?.length ?? 0) > 1
    if (error instanceof NmiApiError && error.status >= 500 && multipleCultivations) {
      const result = await getDynaV2(fdm, {
        nmiApiKey,
        request: restrictToMainCultivation(request, mainB_lu),
        calculationDate,
      })
      return { result, partial: true }
    }
    throw error
  }
}

/** Reduces a cultivation to the fields that are sent to the browser. */
function summarizeCultivation(c: MineralizationCultivation): MineralizationMainCultivation {
  return {
    b_lu: c.b_lu,
    b_lu_catalogue: c.b_lu_catalogue,
    b_lu_name: c.b_lu_name,
    b_lu_harvestable: c.b_lu_harvestable,
  }
}

/**
 * Calculates the mineralization of one field.
 *
 * Never rejects: problems are returned as an outcome with `status: "error"` and a Dutch message.
 *
 * @param ctx - Farm context from {@link loadFarmMineralizationContext}.
 * @param b_id - Field identifier.
 * @param principal_id - Principal of the session.
 * @param b_id_farm - Farm identifier.
 * @param options.calculation - Optional replacement of the prepared request (used for scenarios).
 * @returns The outcome of the field.
 */
export async function calculateFieldMineralization(
  ctx: FarmMineralizationContext,
  b_id: string,
  principal_id: string,
  b_id_farm: string,
  options: {
    transformRequest?: (
      request: DynaV2Request,
      mainCultivation: MineralizationCultivation,
    ) => DynaV2Request
  } = {},
): Promise<FieldMineralizationOutcome> {
  const field = ctx.fields.find((f) => f.b_id === b_id)
  const base: OutcomeBase = {
    b_id,
    b_name: field?.b_name ?? null,
    b_area: field?.b_area ?? null,
  }
  try {
    const data = ctx.data.get(b_id)
    if (!data) {
      return { ...base, status: "error", message: "Dit perceel is niet gevonden in dit jaar." }
    }

    const preparation = prepareMineralizationInput(data, ctx.year, ctx.today)
    switch (preparation.status) {
      case "excluded":
        return { ...base, status: "excluded", reason: preparation.reason }
      case "missing_location":
      case "no_cultivation":
        return { ...base, status: preparation.status }
      case "missing_harvest": {
        const main = preparation.mainCultivation
        let defaultHarvestDate: string | null = null
        try {
          const defaults = await getDefaultDatesOfCultivation(
            fdm,
            principal_id,
            b_id_farm,
            main.b_lu_catalogue,
            ctx.year,
          )
          defaultHarvestDate = defaults.b_lu_end ? toFdmDateString(defaults.b_lu_end) : null
        } catch {
          defaultHarvestDate = null
        }
        return {
          ...base,
          status: "missing_harvest",
          mainCultivation: summarizeCultivation(main),
          defaultHarvestDate,
        }
      }
      case "ready":
        break
    }

    const nmiApiKey = getNmiApiKey()
    if (!nmiApiKey) {
      return {
        ...base,
        status: "error",
        message: "De berekening is niet beschikbaar: er is geen NMI API-sleutel ingesteld.",
      }
    }

    const main = preparation.mainCultivation
    const request = options.transformRequest
      ? options.transformRequest(preparation.request, main)
      : preparation.request
    const todayDate = toFdmDateString(ctx.today)
    const currentYear = Number(todayDate.slice(0, 4))

    const forecastPromise: Promise<WeatherForecast | null> =
      ctx.year === currentYear
        ? getWeatherForecast(fdm, {
            nmiApiKey,
            a_lat: roundCoordinate(request.field.a_lat),
            a_lon: roundCoordinate(request.field.a_lon),
            date: todayDate,
          }).catch(() => null)
        : Promise.resolve(null)

    const [{ result, partial }, forecast] = await Promise.all([
      runDyna(nmiApiKey, request, main.b_lu, todayDate),
      forecastPromise,
    ])

    const mainCultivation = request.cultivations?.find((c) => c.b_lu_id === main.b_lu)
    const mainStart = mainCultivation?.b_lu_start ?? `${ctx.year}-01-01`
    const mainHarvest =
      request.harvests?.filter((h) => h.b_lu_id === main.b_lu).at(-1)?.b_date_harvest ??
      mainCultivation?.b_lu_end ??
      `${ctx.year}-12-31`

    const insights = deriveMineralizationInsights({
      result,
      events: preparation.events,
      forecast,
      year: ctx.year,
      today: ctx.today,
      mainStart,
      mainHarvest,
    })

    return {
      ...base,
      status: "ok",
      mainCultivation: summarizeCultivation(main),
      result,
      insights,
      events: preparation.events,
      usedInput: preparation.usedInput,
      forecast,
      mainStart,
      mainHarvest,
      partial,
    }
  } catch (error) {
    console.error(`Mineralization calculation failed for field ${b_id}:`, error)
    return {
      ...base,
      status: "error",
      message: error instanceof NmiApiError ? error.message : "Er ging iets mis bij de berekening.",
    }
  }
}
