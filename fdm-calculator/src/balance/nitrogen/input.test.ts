import type {
    Cultivation,
    FdmType,
    FertilizerApplication,
    Field,
    Harvest,
    PrincipalId,
    SoilAnalysis,
    Timeframe,
    fdmSchema,
} from "@svenvw/fdm-core"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { collectInputForNitrogenBalance } from "./input"
import type {
    CultivationDetail,
    FertilizerDetail,
    FieldInput,
    NitrogenBalanceInput,
} from "./types"

// Mock the @svenvw/fdm-core module
vi.mock("@svenvw/fdm-core", async () => {
    const actual = await vi.importActual("@svenvw/fdm-core")
    return {
        ...actual,
        getFields: vi.fn(),
        getCultivations: vi.fn(),
        getHarvests: vi.fn(),
        getSoilAnalyses: vi.fn(),
        getFertilizerApplications: vi.fn(),
        getFertilizers: vi.fn(),
        getCultivationsFromCatalogue: vi.fn(),
    }
})

// Import mocks after vi.mock call
const fdmCoreMocks = await import("@svenvw/fdm-core")
const mockedGetFields = fdmCoreMocks.getFields as vi.MockedFunction<
    typeof fdmCoreMocks.getFields
>
const mockedGetCultivations = fdmCoreMocks.getCultivations as vi.MockedFunction<
    typeof fdmCoreMocks.getCultivations
>
const mockedGetHarvests = fdmCoreMocks.getHarvests as vi.MockedFunction<
    typeof fdmCoreMocks.getHarvests
>
const mockedGetSoilAnalyses = fdmCoreMocks.getSoilAnalyses as vi.MockedFunction<
    typeof fdmCoreMocks.getSoilAnalyses
>
const mockedGetFertilizerApplications =
    fdmCoreMocks.getFertilizerApplications as vi.MockedFunction<
        typeof fdmCoreMocks.getFertilizerApplications
    >
const mockedGetFertilizers = fdmCoreMocks.getFertilizers as vi.MockedFunction<
    typeof fdmCoreMocks.getFertilizers
>
const mockedGetCultivationsFromCatalogue =
    fdmCoreMocks.getCultivationsFromCatalogue as vi.MockedFunction<
        typeof fdmCoreMocks.getCultivationsFromCatalogue
    >

describe("collectInputForNitrogenBalance", () => {
    const mockFdm: FdmType = {
        // @ts-expect-error - we are mocking the transaction
        transaction: async (callback) => callback(mockFdm), // Simplified mock transaction
        // Add other FdmType properties if needed for type checking, or cast to any
    } as FdmType

    const principal_id: PrincipalId = "test-principal-id"
    const b_id_farm: fdmSchema.farmsTypeSelect["b_id_farm"] = "test-farm-id"
    const timeframe: Timeframe = {
        start: new Date("2023-01-01"),
        end: new Date("2023-12-31"),
    }
    const fdmPublicDataUrl = "https://example.com/public-data"

    beforeEach(() => {
        vi.resetAllMocks()
    })

    it("should collect input successfully when all data is available", async () => {
        // Mock data
        const mockFieldsData: Pick<Field, "b_id" | "b_centroid" | "b_area">[] =
            [
                {
                    b_id: "field-1",
                    b_centroid: { type: "Point", coordinates: [0, 0] },
                    b_area: 10,
                },
                {
                    b_id: "field-2",
                    b_centroid: { type: "Point", coordinates: [1, 1] },
                    b_area: 20,
                },
            ]
        const mockCultivationsData: Pick<
            Cultivation,
            "b_lu" | "b_lu_catalogue" | "m_cropresidue"
        >[] = [
            {
                b_lu: "cult-1",
                b_lu_catalogue: "cat-cult-1",
                m_cropresidue: 0.5,
            },
        ]
        const mockHarvestsData: Harvest[] = [
            {
                b_harvesting_id: "harvest-1",
                b_lu: "cult-1",
                b_lu_harvest_date: new Date(),
                b_lu_yield: 1000,
                b_id_field: "field-1",
                b_id_farm: b_id_farm,
                b_principal_id_field: principal_id,
                b_principal_id_farm: principal_id,
            },
        ]
        const mockSoilAnalysesData: Pick<
            SoilAnalysis,
            | "a_id"
            | "a_c_of"
            | "a_cn_fr"
            | "a_density_sa"
            | "a_n_rt"
            | "b_soiltype_agr"
        >[] = [
            {
                a_id: "sa-1",
                a_c_of: 25,
                a_cn_fr: 10,
                a_density_sa: 1.5,
                a_n_rt: 100,
                b_soiltype_agr: "SAND",
            },
        ]
        const mockFertilizerApplicationsData: FertilizerApplication[] = [
            {
                b_fertilizing_id: "fa-1",
                p_id_fertilizer: "fert-1",
                p_amount: 100,
                p_id_field: "field-1",
                p_id_farm: b_id_farm,
                p_date_applying: new Date(),
                p_principal_id_field: principal_id,
                p_principal_id_farm: principal_id,
            },
        ]
        const mockFertilizerDetailsData: FertilizerDetail[] = [
            {
                p_id_catalogue: "fert-cat-1",
                p_n_rt: 5,
                p_type_manure: "cattle",
                p_type_mineral: null,
                p_type_compost: null,
            },
        ]
        const mockCultivationDetailsData: CultivationDetail[] = [
            {
                b_lu_catalogue: "cat-cult-1",
                b_lu_croprotation: "maize",
                b_lu_yield: 5000,
                b_lu_hi: 0.45,
                b_lu_n_harvestable: 1.2,
                b_lu_n_residue: 0.8,
                b_n_fixation: 0,
            },
        ]

        // Setup mocks
        mockedGetFields.mockResolvedValue(mockFieldsData)
        mockedGetCultivations.mockResolvedValue(mockCultivationsData)
        mockedGetHarvests.mockResolvedValue(mockHarvestsData) // For simplicity, same harvests for all cultivations
        mockedGetSoilAnalyses.mockResolvedValue(mockSoilAnalysesData)
        mockedGetFertilizerApplications.mockResolvedValue(
            mockFertilizerApplicationsData,
        )
        mockedGetFertilizers.mockResolvedValue(mockFertilizerDetailsData)
        mockedGetCultivationsFromCatalogue.mockResolvedValue(
            mockCultivationDetailsData,
        )

        const result = await collectInputForNitrogenBalance(
            mockFdm,
            principal_id,
            b_id_farm,
            timeframe,
            fdmPublicDataUrl,
        )

        const expectedFieldInputs: FieldInput[] = mockFieldsData.map(
            (field) => ({
                field: field,
                cultivations: mockCultivationsData,
                harvests: mockHarvestsData,
                soilAnalyses: mockSoilAnalysesData,
                fertilizerApplications: mockFertilizerApplicationsData,
            }),
        )

        const expectedResult: NitrogenBalanceInput = {
            fields: expectedFieldInputs,
            fertilizerDetails: mockFertilizerDetailsData,
            cultivationDetails: mockCultivationDetailsData,
            timeFrame: timeframe,
            fdmPublicDataUrl: fdmPublicDataUrl,
        }

        expect(result).toEqual(expectedResult)

        // Verify calls
        expect(mockedGetFields).toHaveBeenCalledWith(
            mockFdm,
            principal_id,
            b_id_farm,
            timeframe,
        )
        for (const field of mockFieldsData) {
            expect(mockedGetCultivations).toHaveBeenCalledWith(
                mockFdm,
                principal_id,
                field.b_id,
                timeframe,
            )
            // For each cultivation, getHarvests is called
            for (const cultivation of mockCultivationsData) {
                expect(mockedGetHarvests).toHaveBeenCalledWith(
                    mockFdm,
                    principal_id,
                    cultivation.b_lu,
                    timeframe,
                )
            }
            expect(mockedGetSoilAnalyses).toHaveBeenCalledWith(
                mockFdm,
                principal_id,
                field.b_id,
                timeframe,
            )
            expect(mockedGetFertilizerApplications).toHaveBeenCalledWith(
                mockFdm,
                principal_id,
                field.b_id,
                timeframe,
            )
        }
        expect(mockedGetFertilizers).toHaveBeenCalledWith(
            mockFdm,
            principal_id,
            b_id_farm,
        )
        expect(mockedGetCultivationsFromCatalogue).toHaveBeenCalledWith(
            mockFdm,
            principal_id,
            b_id_farm,
        )
    })

    it("should throw an error if getFields fails", async () => {
        const errorMessage = "Failed to get fields"
        mockedGetFields.mockRejectedValue(new Error(errorMessage))

        await expect(
            collectInputForNitrogenBalance(
                mockFdm,
                principal_id,
                b_id_farm,
                timeframe,
                fdmPublicDataUrl,
            ),
        ).rejects.toThrow(errorMessage)
    })

    it("should throw an error if getCultivations fails for a field", async () => {
        const mockFieldsData: Pick<Field, "b_id" | "b_centroid" | "b_area">[] =
            [
                {
                    b_id: "field-1",
                    b_centroid: { type: "Point", coordinates: [0, 0] },
                    b_area: 10,
                },
            ]
        mockedGetFields.mockResolvedValue(mockFieldsData)

        const errorMessage = "Failed to get cultivations"
        mockedGetCultivations.mockRejectedValue(new Error(errorMessage))

        await expect(
            collectInputForNitrogenBalance(
                mockFdm,
                principal_id,
                b_id_farm,
                timeframe,
                fdmPublicDataUrl,
            ),
        ).rejects.toThrow(errorMessage)
    })

    it("should throw an error if fdm.transaction fails", async () => {
        const errorMessage = "Transaction failed"
        const mockFdmError: FdmType = {
            ...mockFdm,
            transaction: vi.fn().mockRejectedValue(new Error(errorMessage)),
        }

        await expect(
            collectInputForNitrogenBalance(
                mockFdmError,
                principal_id,
                b_id_farm,
                timeframe,
                fdmPublicDataUrl,
            ),
        ).rejects.toThrow(errorMessage)
    })

    it("should handle empty arrays from core functions correctly", async () => {
        mockedGetFields.mockResolvedValue([])
        mockedGetFertilizers.mockResolvedValue([])
        mockedGetCultivationsFromCatalogue.mockResolvedValue([])

        const result = await collectInputForNitrogenBalance(
            mockFdm,
            principal_id,
            b_id_farm,
            timeframe,
            fdmPublicDataUrl,
        )

        const expectedResult: NitrogenBalanceInput = {
            fields: [],
            fertilizerDetails: [],
            cultivationDetails: [],
            timeFrame: timeframe,
            fdmPublicDataUrl: fdmPublicDataUrl,
        }

        expect(result).toEqual(expectedResult)
        expect(mockedGetFields).toHaveBeenCalledWith(
            mockFdm,
            principal_id,
            b_id_farm,
            timeframe,
        )
        expect(mockedGetFertilizers).toHaveBeenCalledWith(
            mockFdm,
            principal_id,
            b_id_farm,
        )
        expect(mockedGetCultivationsFromCatalogue).toHaveBeenCalledWith(
            mockFdm,
            principal_id,
            b_id_farm,
        )
        // Ensure other calls that depend on fields are not made
        expect(mockedGetCultivations).not.toHaveBeenCalled()
        expect(mockedGetHarvests).not.toHaveBeenCalled()
        expect(mockedGetSoilAnalyses).not.toHaveBeenCalled()
        expect(mockedGetFertilizerApplications).not.toHaveBeenCalled()
    })
})
