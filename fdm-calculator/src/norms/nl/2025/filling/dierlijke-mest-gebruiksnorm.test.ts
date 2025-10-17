import { describe, it, expect } from "vitest"
import type { Fertilizer, FertilizerApplication } from "@svenvw/fdm-core"
import { calculateFertilizerApplicationFillingForManure } from "./dierlijke-mest-gebruiksnorm"
import type { NL2025NormsFillingInput } from "./types"

describe("calculateFertilizerApplicationFillingForManure", () => {
	const mockFertilizers: Fertilizer[] = [
		{
			p_id_catalogue: "1",
			p_type_rvo: "11",
			p_n_rt: 0.5,
		},
		{
			p_id_catalogue: "2",
			p_type_rvo: "12",
		},
		{
			p_id_catalogue: "3",
			p_type_rvo: "200", // Not in table11Mestcodes
		},
		{
			p_id_catalogue: "4",
			// No p_type_rvo
		},
		{
			p_id_catalogue: "5",
			p_type_rvo: "115", // Not relevant for nitrates directive
		},
	]

	const mockApplications: FertilizerApplication[] = [
		{
			p_app_id: "app1",
			p_id_catalogue: "1",
			p_app_amount: 10000,
		},
		{
			p_app_id: "app2",
			p_id_catalogue: "2",
			p_app_amount: 20000,
		},
	]

	it("should calculate the norm filling for a single application", () => {
		const result = calculateFertilizerApplicationFillingForManure({
			applications: [mockApplications[0]],
			fertilizers: mockFertilizers,
            cultivations: [],
            has_organic_certification: false,
            has_grazining_intention: false,
            fosfaatgebruiksnorm: 0,
            b_centroid: [0, 0],
		} as NL2025NormsFillingInput)

		expect(result.normFilling).toBe(5)
		expect(result.applicationFilling).toEqual([
			{
				p_app_id: "app1",
				normFilling: 5,
			},
		])
	})

	it("should calculate the norm filling for multiple applications", () => {
		const result = calculateFertilizerApplicationFillingForManure({
			applications: mockApplications,
			fertilizers: mockFertilizers,
            cultivations: [],
            has_organic_certification: false,
            has_grazining_intention: false,
            fosfaatgebruiksnorm: 0,
            b_centroid: [0, 0],
		} as NL2025NormsFillingInput)

		expect(result.normFilling).toBe(85) // 5 + 80
		expect(result.applicationFilling).toEqual([
			{
				p_app_id: "app1",
				normFilling: 5,
			},
			{
				p_app_id: "app2",
				normFilling: 80,
			},
		])
	})

	it("should return zero filling for fertilizers not relevant to the nitrates directive", () => {
		const result = calculateFertilizerApplicationFillingForManure({
			applications: [
				{
					p_app_id: "app3",
					p_id_catalogue: "5",
					p_app_amount: 10,
				},
			],
			fertilizers: mockFertilizers,
            cultivations: [],
            has_organic_certification: false,
            has_grazining_intention: false,
            fosfaatgebruiksnorm: 0,
            b_centroid: [0, 0],
		} as NL2025NormsFillingInput)

		expect(result.normFilling).toBe(0)
		expect(result.applicationFilling).toEqual([
			{
				p_app_id: "app3",
				normFilling: 0,
			},
		])
	})

	it("should throw an error if a fertilizer is not found", () => {
		expect(() =>
			calculateFertilizerApplicationFillingForManure({
				applications: [
					{
						p_app_id: "app4",
						p_id_catalogue: "999",
						p_app_amount: 10,
					},
				],
				fertilizers: mockFertilizers,
                cultivations: [],
                has_organic_certification: false,
                has_grazining_intention: false,
                fosfaatgebruiksnorm: 0,
                b_centroid: [0, 0],
			} as NL2025NormsFillingInput),
		).toThrow("Fertilizer 999 not found for application app4")
	})

	it("should throw an error if a fertilizer has no p_type_rvo", () => {
		expect(() =>
			calculateFertilizerApplicationFillingForManure({
				applications: [
					{
						p_app_id: "app5",
						p_id_catalogue: "4",
						p_app_amount: 10,
					},
				],
				fertilizers: mockFertilizers,
                cultivations: [],
                has_organic_certification: false,
                has_grazining_intention: false,
                fosfaatgebruiksnorm: 0,
                b_centroid: [0, 0],
			} as NL2025NormsFillingInput),
		).toThrow("Fertilizer 4 has no p_type_rvo")
	})

	it("should throw an error if a fertilizer has an unknown p_type_rvo", () => {
		expect(() =>
			calculateFertilizerApplicationFillingForManure({
				applications: [
					{
						p_app_id: "app6",
						p_id_catalogue: "3",
						p_app_amount: 10,
					},
				],
				fertilizers: mockFertilizers,
                cultivations: [],
                has_organic_certification: false,
                has_grazining_intention: false,
                fosfaatgebruiksnorm: 0,
                b_centroid: [0, 0],
			} as NL2025NormsFillingInput),
		).toThrow("Fertilizer 3 has unknown p_type_rvo 200")
	})

	it("should return zero filling when no applications are provided", () => {
		const result = calculateFertilizerApplicationFillingForManure({
			applications: [],
			fertilizers: mockFertilizers,
            cultivations: [],
            has_organic_certification: false,
            has_grazining_intention: false,
            fosfaatgebruiksnorm: 0,
            b_centroid: [0, 0],
		} as NL2025NormsFillingInput)

		expect(result.normFilling).toBe(0)
		expect(result.applicationFilling).toEqual([])
	})
})
