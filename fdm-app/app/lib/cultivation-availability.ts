// Offset used to keep the year derived from a date stable around midnight/timezone boundaries.
const BOUNDARY_OFFSET_MS = 24 * 60 * 1000

// Guards against runaway loops when the dates are clearly wrong.
const MAX_PERIOD_YEARS = 100

/**
 * Determines whether the RVO crop code of a cultivation is unavailable in at least one of the
 * years in which the cultivation is active.
 *
 * @param period - Start and end date of the cultivation. A missing end date means the cultivation
 * is still active and runs up to `maxCultivationAvailabilityYear`.
 * @param b_lu_ya - Years in which the crop code is available, or `null` when no availability
 * information exists for the crop code.
 * @param maxCultivationAvailabilityYear - Last year that is checked for cultivations without an end date.
 * @returns `true` when a warning should be shown. This is also the case when the period is
 * invalid (end before start, or longer than 100 years). `false` when the crop code is available
 * in every year or when availability cannot be determined.
 */
export function isCultivationUnavailableInPeriod(
  period: { b_lu_start?: Date | string | null; b_lu_end?: Date | string | null },
  b_lu_ya: number[] | null | undefined,
  maxCultivationAvailabilityYear: number | undefined,
): boolean {
  if (!b_lu_ya || typeof maxCultivationAvailabilityYear !== "number" || !period.b_lu_start) {
    return false
  }

  const start = new Date(period.b_lu_start)
  const end = period.b_lu_end ? new Date(period.b_lu_end) : null
  const startYear = new Date(start.getTime() + BOUNDARY_OFFSET_MS).getFullYear()
  const endYear = end
    ? new Date(end.getTime() - BOUNDARY_OFFSET_MS).getFullYear()
    : maxCultivationAvailabilityYear

  if (Number.isNaN(startYear) || Number.isNaN(endYear)) {
    return false
  }
  if (startYear > endYear || endYear - startYear > MAX_PERIOD_YEARS) {
    // User is doing very wrong things so show a warning.
    return true
  }

  for (let y = startYear; y <= endYear; y++) {
    if (!b_lu_ya.includes(y)) {
      return true
    }
  }
  return false
}
