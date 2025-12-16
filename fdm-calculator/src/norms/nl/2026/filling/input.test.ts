import type {
    Cultivation,
    FdmType,
    Fertilizer,
    FertilizerApplication,
    Field,
} from "@svenvw/fdm-core"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { collectNL2026InputForFertilizerApplicationFilling } from "./input"
import type { NL2026NormsFillingInput } from "./types"

// Mock the entire @svenvw/fdm-core module
vi.mock("@svenvw/fdm-core", () => ({
    getField: vi.fn(),
    getGrazingIntention: vi.fn(),
    isOrganicCertificationValid: vi.fn(),
    getCultivations: vi.fn(),
    getFertilizerApplications: vi.fn(),
    getFertilizers: vi.fn(),
}))

// Import the mocked functions
import {
    getCultivations,
    getFertilizerApplications,
    getFertilizers,
    getField,
    getGrazingIntention,
    isOrganicCertificationValid,
} from "@svenvw/fdm-core"

describe("collectNL2026InputForFertilizerApplicationFilling", () => {
    const mockFdm = {} as FdmType
    const mockPrincipalId = "principal123"
    const mockFieldId = "field456"
    const mockFosfaatgebruiksnorm = 100

    beforeEach(() => {
        // Reset all mocks before each test
        vi.clearAllMocks()

        // Set up default mock implementations for a successful scenario
        vi.mocked(getField).mockResolvedValue({
            b_id: mockFieldId,
            b_id_farm: "farm789",
            b_centroid: [10, 20],
            // Add other necessary Field properties
        } as Field)
        vi.mocked(getGrazingIntention).mockResolvedValue(true)
        vi.mocked(isOrganicCertificationValid).mockResolvedValue(false)
        vi.mocked(getCultivations).mockResolvedValue([
            {
                b_lu: "cult1",
                b_lu_start: new Date(2026, 0, 1),
                b_lu_end: new Date(2026, 5, 1),
                b_lu_catalogue: "nl_2014",
            },
        ] as unknown as Cultivation[])
        vi.mocked(getFertilizerApplications).mockResolvedValue([
            { p_app_id: "app1", p_id_catalogue: "fert1", p_app_amount: 1000 },
        ] as FertilizerApplication[])
        vi.mocked(getFertilizers).mockResolvedValue([
            { p_id: "fert1", p_n_rt: 5, p_type_rvo: "115" },
        ] as Fertilizer[])
    })

    it("should successfully collect all input data for a valid scenario", async () => {
        const expectedB_centroid: [number, number] = [10, 20]
        const expectedCultivations = [
            {
                b_lu: "cult1",
                b_lu_start: new Date(2026, 0, 1),
                b_lu_end: new Date(2026, 5, 1),
                b_lu_catalogue: "nl_2014",
            },
        ]
        const expectedApplications: FertilizerApplication[] = [
            {
                p_app_id: "app1",
                p_id_catalogue: "fert1",
                p_app_amount: 1000,
                p_id: "",
                p_name_nl: null,
                p_app_method: null,
                p_app_date: new Date("2025-03-15"),
            },
        ]
        const expectedFertilizers: Fertilizer[] = [
            {
                p_id: "fert1",
                p_n_rt: 5,
                p_type_rvo: "115",
                p_name_nl: null,
                p_name_en: null,
                p_description: null,
                p_app_method_options: null,
                p_app_amount: null,
                p_date_acquiring: null,
                p_picking_date: null,
                p_n_if: null,
                p_n_of: null,
                p_n_wc: null,
                p_no3_rt: null,
                p_nh4_rt: null,
                p_p_rt: null,
                p_k_rt: null,
                p_eom: null,
                p_eoc: null,
                p_mg_rt: null,
                p_ca_rt: null,
                p_ne: null,
                p_s_rt: null,
                p_s_wc: null,
                p_cu_rt: null,
                p_zn_rt: null,
                p_na_rt: null,
                p_si_rt: null,
                p_b_rt: null,
                p_mn_rt: null,
                p_ni_rt: null,
                p_fe_rt: null,
                p_mo_rt: null,
                p_co_rt: null,
                p_as_rt: null,
                p_cd_rt: null,
                p_cr_rt: null,
                p_cr_vi: null,
                p_pb_rt: null,
                p_hg_rt: null,
                p_cl_rt: null,
                p_ef_nh3: null,
                p_type: null,
            },
        ]

        const result = await collectNL2026InputForFertilizerApplicationFilling(
            mockFdm,
            mockPrincipalId,
            mockFieldId,
            mockFosfaatgebruiksnorm,
        )

        // Assert that all fdm-core functions were called with the correct arguments
        expect(getField).toHaveBeenCalledWith(
            mockFdm,
            mockPrincipalId,
            mockFieldId,
        )
        expect(getGrazingIntention).toHaveBeenCalledWith(
            mockFdm,
            mockPrincipalId,
            "farm789",
            2026,
        )
        expect(isOrganicCertificationValid).toHaveBeenCalledWith(
            mockFdm,
            mockPrincipalId,
            "farm789",
            new Date(2026, 4, 15),
        )
        expect(getCultivations).toHaveBeenCalledWith(
            mockFdm,
            mockPrincipalId,
            mockFieldId,
            {
                start: new Date(2026, 0, 1),
                end: new Date(2026, 11, 31, 23, 59, 59, 999),
            },
        )
        expect(getFertilizerApplications).toHaveBeenCalledWith(
            mockFdm,
            mockPrincipalId,
            "field456",
            {
                start: new Date(2026, 0, 1),
                end: new Date(2026, 11, 31, 23, 59, 59, 999),
            },
        )
        expect(getFertilizers).toHaveBeenCalledWith(
            mockFdm,
            mockPrincipalId,
            "farm789",
        )

        // Assert the structure and content of the returned NL2026NormsFillingInput object
        expect(result).toEqual({
            cultivations: expectedCultivations,
            applications: expectedApplications,
            fertilizers: expectedFertilizers,
            has_organic_certification: false,
            has_grazing_intention: true,
            fosfaatgebruiksnorm: mockFosfaatgebruiksnorm,
            b_centroid: expectedB_centroid,
        } as NL2026NormsFillingInput)
    })

    it("should throw an error if the field is not found", async () => {
        // @ts-expect-error
        vi.mocked(getField).mockResolvedValue(null) // Simulate field not found

        await expect(
            collectNL2026InputForFertilizerApplicationFilling(
                mockFdm,
                mockPrincipalId,
                mockFieldId,
                mockFosfaatgebruiksnorm,
            ),
        ).rejects.toThrow(
            `Field with id ${mockFieldId} not found for principal ${mockPrincipalId}`,
        )
    })

})
