import { describe, expect, it } from "vitest"
import type { MineralizationApplication } from "./prepare"
import type { DynaV2Request } from "./types"
import {
  applyScenarioToRequest,
  diffScenario,
  getMineralizationScenarioSchema,
  type MineralizationScenario,
  type ScenarioFertilizer,
} from "./scenario"

const kas: ScenarioFertilizer = {
  p_id: "fert_kas",
  p_type: "mineral",
  p_n_rt: 270,
  p_n_if: 270,
  p_n_of: 0,
  p_om: null,
  p_no3_rt: null,
  p_nh4_rt: null,
  p_s_rt: null,
  p_app_amount_unit: "kg/ha",
  p_density: null,
}

const slurry: ScenarioFertilizer = {
  p_id: "fert_slurry",
  p_type: "manure",
  p_n_rt: 4.5,
  p_n_if: 2.5,
  p_n_of: 2,
  p_om: 70,
  p_no3_rt: null,
  p_nh4_rt: null,
  p_s_rt: null,
  p_app_amount_unit: "m3/ha",
  p_density: 1.01,
}

const fertilizers = new Map([
  [kas.p_id, kas],
  [slurry.p_id, slurry],
])

const request: DynaV2Request = {
  field: { a_lat: 52, a_lon: 5.6 },
  cultivations: [
    { b_lu: "nl_2014", b_lu_id: "lu_main", b_lu_start: "2026-04-15", b_lu_end: "2026-09-20" },
  ],
  harvests: [
    { b_lu_id: "lu_main", b_date_harvest: "2026-09-20", b_lu_yield: 45000, m_cropresidue: true },
  ],
  fertilizer_applications: [
    {
      p_id: "fert_kas",
      p_app_amount: 300,
      p_date_fertilization: "2026-05-01",
      p_app_method: "broadcasting",
    },
  ],
  fertilizer_properties: [{ p_id: "fert_kas", p_type_mineral: true, p_n_rt: 270 }],
}

describe("applyScenarioToRequest", () => {
  it("replaces the fertilizer applications and converts amounts to kg/ha", () => {
    const scenario: MineralizationScenario = {
      fertilizerApplications: [
        {
          p_app_id: "app_1",
          p_id: "fert_kas",
          p_app_amount_display: 300,
          p_app_method: "broadcasting",
          p_app_date: "2026-05-04",
        },
        {
          p_id: "fert_slurry",
          p_app_amount_display: 30,
          p_app_method: "slotted coulter",
          p_app_date: "2026-04-01",
        },
      ],
    }
    const result = applyScenarioToRequest({
      request,
      scenario,
      fertilizers,
      mainB_lu: "lu_main",
      mainHarvestable: "once",
    })
    expect(result.fertilizer_applications).toEqual([
      {
        p_id: "fert_slurry",
        p_app_amount: 30300,
        p_date_fertilization: "2026-04-01",
        p_app_method: "slotted coulter",
      },
      {
        p_id: "fert_kas",
        p_app_amount: 300,
        p_date_fertilization: "2026-05-04",
        p_app_method: "broadcasting",
      },
    ])
    expect(result.fertilizer_properties?.map((p) => p.p_id).sort()).toEqual([
      "fert_kas",
      "fert_slurry",
    ])
    expect(result.cultivations).toEqual(request.cultivations)
  })

  it("removes fertilizer keys when the scenario has no applications", () => {
    const result = applyScenarioToRequest({
      request,
      scenario: { fertilizerApplications: [] },
      fertilizers,
      mainB_lu: "lu_main",
      mainHarvestable: "once",
    })
    expect(result.fertilizer_applications).toBeUndefined()
    expect(result.fertilizer_properties).toBeUndefined()
  })

  it("moves the harvest and the end of a crop harvested once", () => {
    const result = applyScenarioToRequest({
      request,
      scenario: {
        fertilizerApplications: [],
        harvest: { b_date_harvest: "2026-09-25", b_lu_yield: 50000 },
      },
      fertilizers,
      mainB_lu: "lu_main",
      mainHarvestable: "once",
    })
    expect(result.harvests).toEqual([
      { b_lu_id: "lu_main", b_date_harvest: "2026-09-25", b_lu_yield: 50000, m_cropresidue: true },
    ])
    expect(result.cultivations?.[0].b_lu_end).toBe("2026-09-25")
  })

  it("moves only the last harvest of a crop harvested multiple times", () => {
    const grass: DynaV2Request = {
      ...request,
      cultivations: [
        { b_lu: "nl_265", b_lu_id: "lu_main", b_lu_start: "2026-01-01", b_lu_end: "2026-12-31" },
      ],
      harvests: [
        { b_lu_id: "lu_main", b_date_harvest: "2026-05-10" },
        { b_lu_id: "lu_main", b_date_harvest: "2026-06-20" },
      ],
    }
    const result = applyScenarioToRequest({
      request: grass,
      scenario: { fertilizerApplications: [], harvest: { b_date_harvest: "2026-06-25" } },
      fertilizers,
      mainB_lu: "lu_main",
      mainHarvestable: "multiple",
    })
    expect(result.harvests?.map((h) => h.b_date_harvest)).toEqual(["2026-05-10", "2026-06-25"])
    expect(result.cultivations?.[0].b_lu_end).toBe("2026-12-31")
  })

  it("throws for an unknown fertilizer", () => {
    expect(() =>
      applyScenarioToRequest({
        request,
        scenario: {
          fertilizerApplications: [
            {
              p_id: "fert_missing",
              p_app_amount_display: 1,
              p_app_method: "broadcasting",
              p_app_date: "2026-05-01",
            },
          ],
        },
        fertilizers,
        mainB_lu: "lu_main",
        mainHarvestable: "once",
      }),
    ).toThrow("Onbekende meststof")
  })
})

describe("getMineralizationScenarioSchema", () => {
  const schema = getMineralizationScenarioSchema(2026)

  it("accepts a valid scenario", () => {
    expect(
      schema.safeParse({
        fertilizerApplications: [
          {
            p_id: "fert_kas",
            p_app_amount_display: 300,
            p_app_method: "broadcasting",
            p_app_date: "2026-05-01",
          },
        ],
        harvest: { b_date_harvest: "2026-09-01" },
      }).success,
    ).toBe(true)
  })

  it("rejects applications outside the year", () => {
    expect(
      schema.safeParse({
        fertilizerApplications: [
          {
            p_id: "fert_kas",
            p_app_amount_display: 300,
            p_app_method: "broadcasting",
            p_app_date: "2025-12-31",
          },
        ],
      }).success,
    ).toBe(false)
  })

  it("rejects negative amounts and invalid dates", () => {
    const application = {
      p_id: "fert_kas",
      p_app_amount_display: -1,
      p_app_method: "broadcasting",
      p_app_date: "2026-05-01",
    }
    expect(schema.safeParse({ fertilizerApplications: [application] }).success).toBe(false)
    expect(
      schema.safeParse({
        fertilizerApplications: [
          { ...application, p_app_amount_display: 1, p_app_date: "1-5-2026" },
        ],
      }).success,
    ).toBe(false)
  })
})

describe("diffScenario", () => {
  const current: MineralizationApplication[] = [
    {
      p_app_id: "app_same",
      p_id: "fert_kas",
      p_name_nl: "KAS",
      p_app_amount: 300,
      p_app_amount_display: 300,
      p_app_amount_unit: "kg/ha",
      p_app_method: "broadcasting",
      p_app_date: new Date("2026-05-01T00:00:00+02:00"),
    },
    {
      p_app_id: "app_moved",
      p_id: "fert_kas",
      p_name_nl: "KAS",
      p_app_amount: 200,
      p_app_amount_display: 200,
      p_app_amount_unit: "kg/ha",
      p_app_method: "broadcasting",
      p_app_date: new Date("2026-06-01T00:00:00+02:00"),
    },
    {
      p_app_id: "app_removed",
      p_id: "fert_kas",
      p_name_nl: "KAS",
      p_app_amount: 100,
      p_app_amount_display: 100,
      p_app_amount_unit: "kg/ha",
      p_app_method: "broadcasting",
      p_app_date: new Date("2026-07-01T00:00:00+02:00"),
    },
  ]

  const scenario: MineralizationScenario = {
    fertilizerApplications: [
      {
        p_app_id: "app_same",
        p_id: "fert_kas",
        p_app_amount_display: 300,
        p_app_method: "broadcasting",
        p_app_date: "2026-05-01",
      },
      {
        p_app_id: "app_moved",
        p_id: "fert_kas",
        p_app_amount_display: 200,
        p_app_method: "broadcasting",
        p_app_date: "2026-06-04",
      },
      {
        p_id: "fert_slurry",
        p_app_amount_display: 30,
        p_app_method: "slotted coulter",
        p_app_date: "2026-04-01",
      },
    ],
  }

  it("classifies added, changed and removed applications", () => {
    const diff = diffScenario(current, null, scenario)
    expect(diff.add.map((a) => a.p_id)).toEqual(["fert_slurry"])
    expect(diff.update.map((a) => [a.p_app_id, a.p_app_date])).toEqual([
      ["app_moved", "2026-06-04"],
    ])
    expect(diff.remove).toEqual(["app_removed"])
    expect(diff.harvest).toBeNull()
  })

  it("updates an existing harvest or adds a new one", () => {
    const withHarvest = { ...scenario, harvest: { b_date_harvest: "2026-09-25" } }
    expect(
      diffScenario(
        current,
        { b_id_harvesting: "h1", b_date_harvest: "2026-09-20", b_lu_yield: null },
        withHarvest,
      ).harvest,
    ).toEqual({ b_id_harvesting: "h1", b_date_harvest: "2026-09-25" })
    expect(diffScenario(current, null, withHarvest).harvest).toEqual({
      b_id_harvesting: null,
      b_date_harvest: "2026-09-25",
    })
    expect(
      diffScenario(
        current,
        { b_id_harvesting: "h1", b_date_harvest: "2026-09-25", b_lu_yield: null },
        withHarvest,
      ).harvest,
    ).toBeNull()
  })
})
