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
  if (
    !b_lu_ya ||
    b_lu_ya.length === 0 ||
    typeof maxCultivationAvailabilityYear !== "number" ||
    !period.b_lu_start
  ) {
    return false
  }

  const start = new Date(period.b_lu_start)
  const end = period.b_lu_end ? new Date(period.b_lu_end) : null
  if (end && end.getTime() < start.getTime()) {
    // End before start: show a warning.
    return true
  }
  const startYear = Math.min(maxCultivationAvailabilityYear, start.getFullYear())
  // The boundary offsets can invert the years for very short periods around 1 January.
  const endYear = Math.max(
    startYear,
    Math.min(
      maxCultivationAvailabilityYear,
      end ? end.getFullYear() : maxCultivationAvailabilityYear,
    ),
  )

  if (Number.isNaN(startYear) || Number.isNaN(endYear)) {
    return false
  }
  if (endYear - startYear > MAX_PERIOD_YEARS) {
    // Guard against long-running loops, there probably won't be an
    // agricultural cultivation that has been active for 100+ years.
    return true
  }

  for (let y = startYear; y <= endYear; y++) {
    if (!b_lu_ya.includes(y)) {
      return true
    }
  }
  return false
}
