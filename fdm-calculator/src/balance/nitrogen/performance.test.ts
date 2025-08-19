import { describe, expect, it } from "vitest"
import { calculateNitrogenBalance } from "./index"
import type {
    CultivationDetail,
    FertilizerDetail,
    FieldInput,
    NitrogenBalanceInput,
    SoilAnalysisPicked,
} from "./types"
import { Decimal } from "decimal.js"

/**
 * Utility function to generate mock data for performance testing.
 * This function creates a specified number of fields with realistic, but simplified,
 * associated data for cultivations, fertilizer applications, soil analyses, and harvests.
 *
 * @param numberOfFields - The number of fields to generate.
 * @returns A NitrogenBalanceInput object with dynamically generated data.
 */
function generateMockData(numberOfFields: number): NitrogenBalanceInput {
    const fields: FieldInput[] = []
    const fertilizerDetails: FertilizerDetail[] = [
        {
            p_id_catalogue: "fert-cat-1",
            p_n_rt: 5,
            p_type: "manure",
            p_no3_rt: 1,
            p_nh4_rt: 2,
            p_s_rt: 0,
            p_ef_nh3: 0.1,
        },
        {
            p_id_catalogue: "fert-cat-2",
            p_n_rt: 10,
            p_type: "mineral",
            p_no3_rt: 5,
            p_nh4_rt: 5,
            p_s_rt: 1,
            p_ef_nh3: 0.05,
        },
    ]
    const cultivationDetails: CultivationDetail[] = [
        {
            b_lu_catalogue: "cat-cult-1",
            b_lu_croprotation: "maize",
            b_lu_yield: 5000,
            b_lu_hi: 0.45,
            b_lu_n_harvestable: 1.2,
            b_lu_n_residue: 0.8,
            b_n_fixation: 0,
        },
        {
            b_lu_catalogue: "cat-cult-2",
            b_lu_croprotation: "wheat",
            b_lu_yield: 6000,
            b_lu_hi: 0.4,
            b_lu_n_harvestable: 1.5,
            b_lu_n_residue: 1.0,
            b_n_fixation: 0,
        },
    ]

    for (let i = 0; i < numberOfFields; i++) {
        const fieldId = `field-${i}`
        const fieldStart = new Date(2023, 0, 1)
        const fieldEnd = new Date(2023, 11, 31)

        const field: FieldInput["field"] = {
            b_id: fieldId,
            b_centroid: [
                Math.random() * 10 + 4, // Random longitude between 4 and 14
                Math.random() * 5 + 50, // Random latitude between 50 and 55
            ],
            b_area: Math.floor(Math.random() * 50 + 10), // Random area between 10 and 60
            b_start: fieldStart,
            b_end: fieldEnd,
        }

        const cultivations: FieldInput["cultivations"] = [
            {
                b_lu: `cult-${fieldId}-1`,
                b_lu_catalogue: "cat-cult-1",
                m_cropresidue: 0.5,
                b_lu_start: new Date(2023, 3, 1),
                b_lu_end: new Date(2023, 8, 1),
            },
        ]

        const harvests: FieldInput["harvests"] = [
            {
                b_id_harvesting: `harvest-${fieldId}-1`,
                b_lu: `cult-${fieldId}-1`,
                b_lu_harvest_date: new Date(2023, 8, 15),
                b_lu_yield: 5000,
                b_id_field: fieldId,
                b_id_farm: "test-farm",
                b_principal_id_field: "test-principal",
                b_principal_id_farm: "test-principal",
                harvestable: {
                    harvestable_analyses: [
                        {
                            b_lu_yield: 5000,
                            b_lu_n_harvestable: 1.2,
                        },
                    ],
                },
            },
        ]

        const soilAnalyses: FieldInput["soilAnalyses"] = [
            {
                a_id: `sa-${fieldId}-1`,
                b_sampling_date: new Date(2023, 2, 1),
                a_c_of: Math.random() * 10 + 15, // 15-25
                a_cn_fr: Math.random() * 5 + 8, // 8-13
                a_density_sa: Math.random() * 0.5 + 1.2, // 1.2-1.7
                a_n_rt: Math.random() * 50 + 50, // 50-100
                a_som_loi: Math.random() * 2 + 3, // 3-5
                b_soiltype_agr: "dekzand",
                b_gwl_class: "II",
            },
        ]

        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_app_id: `fa-${fieldId}-1`,
                // Randomly pick one of the available fertilizer catalogue IDs
                p_id_catalogue:
                    fertilizerDetails[
                        Math.floor(Math.random() * fertilizerDetails.length)
                    ].p_id_catalogue,
                p_amount: Math.floor(Math.random() * 500 + 100), // 100-600
                b_id: fieldId,
                b_id_farm: "test-farm",
                p_app_date: new Date(2023, 4, 1),
            },
        ]

        fields.push({
            field,
            cultivations,
            harvests,
            soilAnalyses,
            fertilizerApplications,
        })
    }

    return {
        fields,
        fertilizerDetails,
        cultivationDetails,
        timeFrame: {
            start: new Date(2023, 0, 1),
            end: new Date(2023, 11, 31),
        },
    }
}

describe("Nitrogen Balance Performance", () => {
    // This test is designed to measure the performance of the nitrogen balance calculation
    // for a large number of fields.
    // The timeout is set to 30 seconds (30000 ms). If the test exceeds this, it indicates
    // a potential performance regression or that the batch size needs tuning.
    //
    // To tune the batch size:
    // 1. Open `fdm-calculator/src/balance/nitrogen/index.ts`.
    // 2. Locate the `batchSize` constant (currently set to 20).
    // 3. Adjust the value (e.g., 10, 50, 100) and re-run this test to find the optimal value
    //    for your environment and expected number of fields.
    it("should calculate nitrogen balance for a large farm (~300 fields) within 30 seconds", async () => {
        const numberOfFields = 300
        const mockInput = generateMockData(numberOfFields)

        // Measure execution time
        const startTime = process.hrtime.bigint()

        const result = await calculateNitrogenBalance(mockInput)

        const endTime = process.hrtime.bigint()
        const durationMs = Number(endTime - startTime) / 1_000_000

        console.log(
            `Calculated nitrogen balance for ${numberOfFields} fields in ${durationMs.toFixed(2)} ms`,
        )

        expect(result).toBeDefined()
        expect(result.fields.length).toBe(numberOfFields)
        // Add more specific assertions if needed, e.g., checking total balance values
        // expect(result.balance).toBeCloseTo(...)

        // Assert that the calculation completed within the desired timeout
        expect(durationMs).toBeLessThan(30000) // 30 seconds
    }, 35000) // Set Vitest timeout slightly higher than the expected test duration
})
