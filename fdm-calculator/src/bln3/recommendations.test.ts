import { describe, expect, it } from "vitest"
import type { Bln3Score } from "./types"
import { IndicatorsUnavailableError } from "./errors"
import {
  buildMeasureOptions,
  getBestVariantIds,
  getFieldOpportunityCandidates,
  getMeasureFamilyId,
  getTopOpportunitiesForField,
  type MeasureCatalogueEntry,
} from "./recommendations"
import { aggregateFarmScores } from "./scoring"

const entry = (id: string, extra: Partial<MeasureCatalogueEntry> = {}): MeasureCatalogueEntry => ({
  m_id: id,
  m_source: "bln",
  m_name: `Measure ${id}`,
  m_description: "desc",
  m_summary: null,
  m_source_url: null,
  m_conflicts: null,
  m_stage_applicability: "field",
  ...extra,
})

const score: Bln3Score = {
  indicators: [
    { indicator_id: "C_N", status: 1, target: 2, index: 0.3, impact: 0, score: 0.3 },
    { indicator_id: "C_P", status: 1, target: 2, index: 0.5, impact: 0, score: 0.5 },
    { indicator_id: "P_DS", status: 1, target: 2, index: 0.9, impact: 0, score: 0.9 },
  ],
}

const applicable = (id: string) => ({ m_id: id, applicability: "applicable" as const, message: "" })

describe("buildMeasureOptions", () => {
  it("ranks by weak-indicator impact, keeps all-indicator predicted impacts", () => {
    const options = buildMeasureOptions({
      catalogue: [entry("bln_BM1"), entry("bln_BM2"), entry("bln_BM3")],
      enabledSources: ["bln"],
      activeMeasures: [],
      applicability: { applicability: [applicable("bln_BM1"), applicable("bln_BM2")] },
      advice: {
        indicator_advice: [
          {
            indicator: "C_N",
            measures: [
              { m_id: "bln_BM1", measure_impact: 0.12 },
              { m_id: "bln_BM2", measure_impact: 0.3 },
            ],
          },
          { indicator: "P_DS", measures: [{ m_id: "bln_BM1", measure_impact: 0.5 }] },
        ],
      },
      score,
    })
    expect(options.map((o) => o.m_id)).toEqual(["bln_BM2", "bln_BM1", "bln_BM3"])
    expect(options[0].recommendation).toEqual({
      rank: 1,
      aggregate_impact: 0.3,
      indicator_impacts: [{ indicator_id: "C_N", measure_impact: 0.3 }],
    })
    // green indicator P_DS does not influence the ranking but stays a predicted impact
    expect(options[1].recommendation?.aggregate_impact).toBe(0.12)
    expect(options[1].predicted_impacts).toHaveLength(2)
    // unknown applicability is neither selectable nor recommended
    expect(options[2].applicability.status).toBe("unknown")
    expect(options[2].selectable).toBe(false)
    expect(options[2].recommendation).toBeNull()
  })

  it("limits recommendations to five", () => {
    const ids = ["A", "B", "C", "D", "E", "F"].map((x) => `bln_${x}`)
    const options = buildMeasureOptions({
      catalogue: ids.map((id) => entry(id)),
      enabledSources: ["bln"],
      activeMeasures: [],
      applicability: { applicability: ids.map(applicable) },
      advice: {
        indicator_advice: [
          {
            indicator: "C_N",
            measures: ids.map((m_id, i) => ({ m_id, measure_impact: 0.1 + i * 0.01 })),
          },
        ],
      },
      score,
    })
    expect(options.filter((o) => o.recommendation).length).toBe(5)
    expect(options.find((o) => o.m_id === "bln_A")?.recommendation).toBeNull()
  })

  it("marks active and conflicting options, excludes farm-only and disabled sources", () => {
    const options = buildMeasureOptions({
      catalogue: [
        entry("bln_BM1", { m_conflicts: ["bln_BM2"] }),
        entry("bln_BM2"),
        entry("bln_BM3", { m_stage_applicability: "farm" }),
        entry("other_X", { m_source: "other" }),
      ],
      enabledSources: ["bln"],
      activeMeasures: [{ b_id_measure: "inst1", m_id: "bln_BM2", m_conflicts: null }],
      applicability: { applicability: [applicable("bln_BM1"), applicable("bln_BM2")] },
      advice: { indicator_advice: [] },
      score,
    })
    expect(options.map((o) => o.m_id).sort()).toEqual(["bln_BM1", "bln_BM2"])
    const bm1 = options.find((o) => o.m_id === "bln_BM1")
    const bm2 = options.find((o) => o.m_id === "bln_BM2")
    expect(bm1?.conflicts_with_active).toEqual(["bln_BM2"])
    expect(bm1?.selectable).toBe(false)
    expect(bm2?.active_measures).toEqual(["inst1"])
    expect(bm2?.selectable).toBe(false)
    expect(options.every((o) => o.recommendation === null)).toBe(true)
  })

  it("throws for malformed advice", () => {
    expect(() =>
      buildMeasureOptions({
        catalogue: [],
        enabledSources: [],
        activeMeasures: [],
        applicability: { applicability: [] },
        advice: {
          indicator_advice: [
            { indicator: "C_N", measures: [{ m_id: "x", measure_impact: Number.NaN }] },
          ],
        },
        score,
      }),
    ).toThrow(IndicatorsUnavailableError)
  })
})

describe("aggregateFarmScores", () => {
  const sc = (v: number, agg = v): Bln3Score => ({
    indicators: [{ indicator_id: "C_N", status: 0, target: 0, index: v, impact: 0, score: v }],
    aggregations: [{ aggregation_id: "S_BLN", score: agg }],
  })

  it("weights by positive area and skips fields without area", () => {
    const res = aggregateFarmScores([
      { b_id: "a", b_area: 1, score: sc(0.2) },
      { b_id: "b", b_area: 3, score: sc(0.6) },
      { b_id: "c", b_area: 0, score: sc(1) },
      { b_id: "d", b_area: null, score: sc(1) },
    ])
    expect(res.indicators[0].score).toBeCloseTo(0.5)
    expect(res.aggregations[0].score).toBeCloseTo(0.5)
  })

  it("returns empty aggregates when nothing contributes", () => {
    expect(aggregateFarmScores([])).toEqual({ indicators: [], aggregations: [] })
    expect(aggregateFarmScores([{ b_id: "a", b_area: 0, score: sc(0.5) }])).toEqual({
      indicators: [],
      aggregations: [],
    })
  })

  it("uses only contributing fields per metric", () => {
    const partial: Bln3Score = {
      indicators: [],
      aggregations: [{ aggregation_id: "S_BLN", score: 0.8 }],
    }
    const res = aggregateFarmScores([
      { b_id: "a", b_area: 1, score: sc(0.2, 0.2) },
      { b_id: "b", b_area: 1, score: partial },
    ])
    expect(res.indicators[0].score).toBeCloseTo(0.2)
    expect(res.aggregations[0].score).toBeCloseTo(0.5)
  })
})

describe("getMeasureFamilyId", () => {
  it("strips one trailing lowercase letter from a BLN3 measure ID", () => {
    expect(getMeasureFamilyId("bln_BM56b")).toBe("bln_BM56")
    expect(getMeasureFamilyId("bln_BM56c")).toBe("bln_BM56")
  })

  it("leaves IDs without a variant suffix unchanged", () => {
    expect(getMeasureFamilyId("bln_BM239")).toBe("bln_BM239")
    expect(getMeasureFamilyId("bln_BM56bc")).toBe("bln_BM56bc")
    expect(getMeasureFamilyId("other_BM56b")).toBe("other_BM56b")
  })
})

describe("getBestVariantIds", () => {
  it("keeps the variant with the highest impact per family", () => {
    const ids = getBestVariantIds(
      new Map([
        ["bln_BM56b", 0.1],
        ["bln_BM56c", 0.3],
        ["bln_BM239", 0.05],
      ]),
    )
    expect([...ids].sort()).toEqual(["bln_BM239", "bln_BM56c"])
  })

  it("prefers the earliest suffix letter on a tie", () => {
    const ids = getBestVariantIds(
      new Map([
        ["bln_BM56c", 0.2],
        ["bln_BM56b", 0.2],
      ]),
    )
    expect([...ids]).toEqual(["bln_BM56b"])
  })
})

describe("getTopOpportunitiesForField", () => {
  const advice = {
    indicator_advice: [
      {
        indicator: "C_N",
        measures: [
          { m_id: "bln_BM56b", measure_impact: 0.2 },
          { m_id: "bln_BM56c", measure_impact: 0.3 },
          { m_id: "bln_BM239", measure_impact: 0.1 },
        ],
      },
      { indicator: "C_P", measures: [{ m_id: "bln_BM56b", measure_impact: 0.05 }] },
    ],
  }
  const applicability = Object.fromEntries(
    ["bln_BM56b", "bln_BM56c", "bln_BM239"].map((id) => [
      id,
      { applicability: "applicable" as const, message: "" },
    ]),
  )

  it("keeps only the best variant per measure family", () => {
    const result = getTopOpportunitiesForField({
      advice,
      score,
      applicability,
      activeMeasureIds: new Set(),
    })
    expect(result.map((o) => o.m_id)).toEqual(["bln_BM56c", "bln_BM239"])
  })

  it("compares variants on their impact summed over weak indicators", () => {
    const result = getTopOpportunitiesForField({
      advice: {
        indicator_advice: [
          ...advice.indicator_advice,
          { indicator: "C_P", measures: [{ m_id: "bln_BM56b", measure_impact: 0.1 }] },
        ],
      },
      score,
      applicability,
      activeMeasureIds: new Set(),
    })
    // bln_BM56b sums to 0.35 and beats bln_BM56c (0.3)
    expect(result.map((o) => o.m_id)).toEqual(["bln_BM56b", "bln_BM239"])
  })

  it("keeps every eligible variant as a candidate for farm-wide selection", () => {
    const result = getFieldOpportunityCandidates({
      advice,
      score,
      applicability,
      activeMeasureIds: new Set(),
    })
    expect(result.map((o) => o.m_id)).toEqual(["bln_BM56c", "bln_BM56b", "bln_BM239"])
  })

  it("does not recommend a variant when another variant of the family is active", () => {
    const result = getTopOpportunitiesForField({
      advice,
      score,
      applicability,
      activeMeasureIds: new Set(["bln_BM56b"]),
    })
    expect(result.map((o) => o.m_id)).toEqual(["bln_BM239"])
  })
})
