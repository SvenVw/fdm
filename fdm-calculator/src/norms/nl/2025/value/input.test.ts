import type {
    Cultivation,
    FdmType,
    Field,
    SoilAnalysis,
} from "@svenvw/fdm-core"
import * as fdmCore from "@svenvw/fdm-core"
import { describe, expect, it, vi } from "vitest"
import { collectNL2025InputForNorms } from "./input"

vi.mock("@svenvw/fdm-core", async () => {
    const actual = await vi.importActual("@svenvw/fdm-core")
    return {
        ...actual,
        getField: vi.fn(),
        getCultivations: vi.fn(),
        getCurrentSoilData: vi.fn(),
        isDerogationGrantedForYear: vi.fn(),
        getGrazingIntention: vi.fn(),
    }
})

describe("collectNL2025InputForNorms", () => {
    it("should collect input correctly", async () => {
        const mockFdm = {} as FdmType
        const mockPrincipalId = "principal-1"
        const mockFieldId = "field-1"

        const mockField = {
            b_id: mockFieldId,
            b_id_farm: "farm-1",
            b_centroid: { type: "Point", coordinates: [5.0, 52.0] },
        } as Field
        const mockCultivations = [{ b_lu: "test" }] as Cultivation[]
        const mockSoilAnalysis = [
            { parameter: "a_p_cc", value: 1.0 },
            { parameter: "a_p_al", value: 20 },
        ]

        const timeframe = {
            start: new Date(2025, 0, 1),
            end: new Date(2025, 11, 31),
        }

        const timeframeCultivation = {
            start: new Date(2024, 0, 1),
            end: new Date(2025, 11, 31),
        }

        vi.mocked(fdmCore.getField).mockResolvedValue(mockField)
        vi.mocked(fdmCore.getCultivations).mockResolvedValue(mockCultivations)
        vi.mocked(fdmCore.getCurrentSoilData).mockResolvedValue(
            mockSoilAnalysis as unknown as SoilAnalysis[],
        )
        vi.mocked(fdmCore.isDerogationGrantedForYear).mockResolvedValue(false)
        vi.mocked(fdmCore.getGrazingIntention).mockResolvedValue(false)

        const result = await collectNL2025InputForNorms(
            mockFdm,
            mockPrincipalId,
            mockFieldId,
        )

        expect(result.farm.is_derogatie_bedrijf).toBe(false)
        expect(result.farm.has_grazing_intention).toBe(false)
        expect(result.field).toBe(mockField)
        expect(result.cultivations).toBe(mockCultivations)
        expect(result.soilAnalysis).toEqual({ a_p_cc: 1.0, a_p_al: 20 })
        expect(fdmCore.getField).toHaveBeenCalledWith(
            mockFdm,
            mockPrincipalId,
            mockFieldId,
        )
        expect(fdmCore.isDerogationGrantedForYear).toHaveBeenCalledWith(
            mockFdm,
            mockPrincipalId,
            "farm-1",
            2025,
        )
        expect(fdmCore.getGrazingIntention).toHaveBeenCalledWith(
            mockFdm,
            mockPrincipalId,
            "farm-1",
            2025,
        )
        expect(fdmCore.getCultivations).toHaveBeenCalledWith(
            mockFdm,
            mockPrincipalId,
            mockFieldId,
            timeframeCultivation,
        )
        expect(fdmCore.getCurrentSoilData).toHaveBeenCalledWith(
            mockFdm,
            mockPrincipalId,
            mockFieldId,
            timeframe,
        )
    })
})
