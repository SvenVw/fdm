import { describe, expect, it } from "vitest";
import { Decimal } from "decimal.js";
import { calculateNitrogenSupplyByMineralFertilizers } from "./mineral";
import type { FertilizerDetail, FieldInput } from "../../types";

describe("calculateNitrogenSupplyByMineralFertilizers", () => {
  it("should return 0 if no mineral fertilizer applications are found", () => {
    const fertilizerApplications: FieldInput["fertilizerApplications"] = [];
    const fertilizerDetailsMap = new Map<string, FertilizerDetail>();

    const result = calculateNitrogenSupplyByMineralFertilizers(
      fertilizerApplications,
      fertilizerDetailsMap
    );

    expect(result.total.equals(new Decimal(0))).toBe(true);
    expect(result.applications).toEqual([]);
  });

  it("should calculate nitrogen supply from mineral fertilizer applications", () => {
    const fertilizerApplications: FieldInput["fertilizerApplications"] = [
      {
        p_id_catalogue: "app1",
        p_app_amount: 1000,
        p_app_id: "app1",
      },
      {
        p_id_catalogue: "app2",
        p_app_amount: 500,
        p_app_id: "app2",
      },
    ];

    const fertilizerDetailsMap = new Map<string, FertilizerDetail>([
      [
        "app1",
        {
          p_id_catalogue: "app1",
          p_type_compost: false,
          p_n_rt: 20,
          p_type_manure: false,
          p_type_mineral: true,
        },
      ],
      [
        "app2",
        {
          p_id_catalogue: "app2",
          p_type_compost: false,
          p_n_rt: 15,
          p_type_manure: false,
          p_type_mineral: true,
        },
      ],
    ]);

    const result = calculateNitrogenSupplyByMineralFertilizers(
      fertilizerApplications,
      fertilizerDetailsMap
    );

    expect(result.total.equals(new Decimal(27.5))).toBe(true);
    expect(result.applications).toEqual([
      { id: "app1", value: new Decimal(20) },
      { id: "app2", value: new Decimal(7.5) },
    ]);
  });


  it("should throw an error if a fertilizer application has no details", () => {
    const fertilizerApplications: FieldInput["fertilizerApplications"] = [
      {
        p_id_catalogue: "nonExistent",
        p_app_amount: 1000,
        p_app_id: "app1",
      },
    ];

    const fertilizerDetailsMap = new Map<string, FertilizerDetail>();

    expect(() =>
      calculateNitrogenSupplyByMineralFertilizers(
        fertilizerApplications,
        fertilizerDetailsMap
      )
    ).toThrowError("Fertilizer application app1 has no fertilizerDetails");
  });
});
