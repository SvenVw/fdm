import { adjustEndDateAtYearStart } from "@nmi-agro/fdm-core"
import { describe, expect, it } from "vitest"
import { getYearTimeframe } from "./index"

describe("getYearTimeframe", () => {
  it("should start at 1 January 00:00 in Europe/Amsterdam", () => {
    expect(getYearTimeframe(2026).start?.toISOString()).toBe("2025-12-31T23:00:00.000Z")
  })

  it("should end at 31 December 23:59:59.999 in Europe/Amsterdam", () => {
    expect(getYearTimeframe(2026).end?.toISOString()).toBe("2026-12-31T22:59:59.999Z")
  })

  it("should end at the same moment as an end date on 1 January of the next year", () => {
    expect(getYearTimeframe(2026).end?.getTime()).toBe(
      adjustEndDateAtYearStart(new Date("2027-01-01")).getTime(),
    )
  })
})
