import { describe, expect, it, vi, beforeEach, afterAll } from "vitest"
import geojsonExtent from "@mapbox/geojson-extent"
import type { FeatureCollection } from "geojson"
import { getViewState } from "./atlas-viewstate"

// Mock the geojsonExtent module
vi.mock("@mapbox/geojson-extent")
const mockGeojsonExtent = vi.mocked(geojsonExtent)

// Mock console.error to test error handling
const mockConsoleError = vi.spyOn(console, "error").mockImplementation(() => {})

describe("getViewState", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockConsoleError.mockClear()
    })

    afterAll(() => {
        mockConsoleError.mockRestore()
    })

    describe("when fields is null", () => {
        it("should return default viewState with longitude, latitude, and zoom", () => {
            const result = getViewState(null)

            expect(result).toEqual({
                longitude: 4.9,
                latitude: 52.2,
                zoom: 6,
                pitch: 0,
                bearing: 0,
                padding: { top: 0, bottom: 0, left: 0, right: 0 }
            })
        })
    })

    describe("when fields is undefined", () => {
        it("should return default viewState", () => {
            const result = getViewState(undefined as any)

            expect(result).toEqual({
                longitude: 4.9,
                latitude: 52.2,
                zoom: 6,
                pitch: 0,
                bearing: 0,
                padding: { top: 0, bottom: 0, left: 0, right: 0 }
            })
        })
    })

    describe("when fields is provided", () => {
        const validFeatureCollection: FeatureCollection = {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [4.0, 52.0]
                    },
                    properties: {}
                }
            ]
        }

        it("should return bounds-based viewState when geojsonExtent succeeds", () => {
            const mockBounds = [3.5, 51.5, 4.5, 52.5]
            mockGeojsonExtent.mockReturnValue(mockBounds)

            const result = getViewState(validFeatureCollection)

            expect(mockGeojsonExtent).toHaveBeenCalledWith(validFeatureCollection)
            expect(result).toEqual({
                bounds: mockBounds,
                fitBoundsOptions: { padding: 100 },
                pitch: 0,
                bearing: 0,
                padding: { top: 0, bottom: 0, left: 0, right: 0 }
            })
        })

        it("should use initial bounds when geojsonExtent throws an error", () => {
            const errorMessage = "Invalid GeoJSON"
            mockGeojsonExtent.mockImplementation(() => {
                throw new Error(errorMessage)
            })

            const result = getViewState(validFeatureCollection)

            expect(mockGeojsonExtent).toHaveBeenCalledWith(validFeatureCollection)
            expect(mockConsoleError).toHaveBeenCalledWith("Failed to calculate bounds:", expect.any(Error))
            expect(result).toEqual({
                bounds: [3.1, 50.7, 7.2, 53.6], // Initial bounds fallback
                fitBoundsOptions: { padding: 100 },
                pitch: 0,
                bearing: 0,
                padding: { top: 0, bottom: 0, left: 0, right: 0 }
            })
        })

        it("should handle empty FeatureCollection", () => {
            const emptyFeatureCollection: FeatureCollection = {
                type: "FeatureCollection",
                features: []
            }
            const mockBounds = [0, 0, 0, 0]
            mockGeojsonExtent.mockReturnValue(mockBounds)

            const result = getViewState(emptyFeatureCollection)

            expect(mockGeojsonExtent).toHaveBeenCalledWith(emptyFeatureCollection)
            expect(result).toEqual({
                bounds: mockBounds,
                fitBoundsOptions: { padding: 100 },
                pitch: 0,
                bearing: 0,
                padding: { top: 0, bottom: 0, left: 0, right: 0 }
            })
        })

        it("should handle FeatureCollection with multiple features", () => {
            const multiFeatureCollection: FeatureCollection = {
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        geometry: {
                            type: "Point",
                            coordinates: [4.0, 52.0]
                        },
                        properties: {}
                    },
                    {
                        type: "Feature",
                        geometry: {
                            type: "Point",
                            coordinates: [5.0, 53.0]
                        },
                        properties: {}
                    }
                ]
            }
            const mockBounds = [4.0, 52.0, 5.0, 53.0]
            mockGeojsonExtent.mockReturnValue(mockBounds)

            const result = getViewState(multiFeatureCollection)

            expect(mockGeojsonExtent).toHaveBeenCalledWith(multiFeatureCollection)
            expect(result).toEqual({
                bounds: mockBounds,
                fitBoundsOptions: { padding: 100 },
                pitch: 0,
                bearing: 0,
                padding: { top: 0, bottom: 0, left: 0, right: 0 }
            })
        })

        it("should handle FeatureCollection with polygon geometry", () => {
            const polygonFeatureCollection: FeatureCollection = {
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        geometry: {
                            type: "Polygon",
                            coordinates: [[[4.0, 52.0], [5.0, 52.0], [5.0, 53.0], [4.0, 53.0], [4.0, 52.0]]]
                        },
                        properties: {}
                    }
                ]
            }
            const mockBounds = [4.0, 52.0, 5.0, 53.0]
            mockGeojsonExtent.mockReturnValue(mockBounds)

            const result = getViewState(polygonFeatureCollection)

            expect(mockGeojsonExtent).toHaveBeenCalledWith(polygonFeatureCollection)
            expect(result).toEqual({
                bounds: mockBounds,
                fitBoundsOptions: { padding: 100 },
                pitch: 0,
                bearing: 0,
                padding: { top: 0, bottom: 0, left: 0, right: 0 }
            })
        })

        it("should handle LineString geometry", () => {
            const lineStringFeatureCollection: FeatureCollection = {
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        geometry: {
                            type: "LineString",
                            coordinates: [[4.0, 52.0], [5.0, 53.0]]
                        },
                        properties: {}
                    }
                ]
            }
            const mockBounds = [4.0, 52.0, 5.0, 53.0]
            mockGeojsonExtent.mockReturnValue(mockBounds)

            const result = getViewState(lineStringFeatureCollection)

            expect(mockGeojsonExtent).toHaveBeenCalledWith(lineStringFeatureCollection)
            expect(result.bounds).toEqual(mockBounds)
        })

        it("should handle different error types from geojsonExtent", () => {
            mockGeojsonExtent.mockImplementation(() => {
                throw new TypeError("Type error in geojson processing")
            })

            const result = getViewState(validFeatureCollection)

            expect(mockConsoleError).toHaveBeenCalledWith("Failed to calculate bounds:", expect.any(TypeError))
            expect(result.bounds).toEqual([3.1, 50.7, 7.2, 53.6])
        })

        it("should handle string errors from geojsonExtent", () => {
            mockGeojsonExtent.mockImplementation(() => {
                throw "String error"
            })

            const result = getViewState(validFeatureCollection)

            expect(mockConsoleError).toHaveBeenCalledWith("Failed to calculate bounds:", "String error")
            expect(result.bounds).toEqual([3.1, 50.7, 7.2, 53.6])
        })

        it("should handle null error from geojsonExtent", () => {
            mockGeojsonExtent.mockImplementation(() => {
                throw null
            })

            const result = getViewState(validFeatureCollection)

            expect(mockConsoleError).toHaveBeenCalledWith("Failed to calculate bounds:", null)
            expect(result.bounds).toEqual([3.1, 50.7, 7.2, 53.6])
        })
    })

    describe("edge cases and boundary conditions", () => {
        it("should handle FeatureCollection with mixed geometry types", () => {
            const mixedFeatureCollection: FeatureCollection = {
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        geometry: {
                            type: "Point",
                            coordinates: [4.0, 52.0]
                        },
                        properties: {}
                    },
                    {
                        type: "Feature",
                        geometry: {
                            type: "LineString",
                            coordinates: [[5.0, 53.0], [6.0, 54.0]]
                        },
                        properties: {}
                    }
                ]
            }
            const mockBounds = [4.0, 52.0, 6.0, 54.0]
            mockGeojsonExtent.mockReturnValue(mockBounds)

            const result = getViewState(mixedFeatureCollection)

            expect(result.bounds).toEqual(mockBounds)
        })

        it("should handle FeatureCollection with features having null geometry", () => {
            const featureCollectionWithNullGeometry: FeatureCollection = {
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        geometry: null,
                        properties: {}
                    }
                ]
            }
            
            mockGeojsonExtent.mockImplementation(() => {
                throw new Error("Cannot process null geometry")
            })

            const result = getViewState(featureCollectionWithNullGeometry)

            expect(result.bounds).toEqual([3.1, 50.7, 7.2, 53.6])
            expect(mockConsoleError).toHaveBeenCalled()
        })

        it("should handle FeatureCollection with MultiPoint geometry", () => {
            const multiPointFeatureCollection: FeatureCollection = {
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        geometry: {
                            type: "MultiPoint",
                            coordinates: [[4.0, 52.0], [5.0, 53.0]]
                        },
                        properties: {}
                    }
                ]
            }
            const mockBounds = [4.0, 52.0, 5.0, 53.0]
            mockGeojsonExtent.mockReturnValue(mockBounds)

            const result = getViewState(multiPointFeatureCollection)

            expect(result.bounds).toEqual(mockBounds)
        })

        it("should handle FeatureCollection with GeometryCollection", () => {
            const geometryCollectionFeatureCollection: FeatureCollection = {
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        geometry: {
                            type: "GeometryCollection",
                            geometries: [
                                {
                                    type: "Point",
                                    coordinates: [4.0, 52.0]
                                },
                                {
                                    type: "LineString", 
                                    coordinates: [[5.0, 53.0], [6.0, 54.0]]
                                }
                            ]
                        },
                        properties: {}
                    }
                ]
            }
            const mockBounds = [4.0, 52.0, 6.0, 54.0]
            mockGeojsonExtent.mockReturnValue(mockBounds)

            const result = getViewState(geometryCollectionFeatureCollection)

            expect(result.bounds).toEqual(mockBounds)
        })
    })

    describe("return value structure validation", () => {
        const validFeatureCollection: FeatureCollection = {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [4.0, 52.0]
                    },
                    properties: {}
                }
            ]
        }

        it("should return consistent viewState structure for bounds-based result", () => {
            const mockBounds = [1, 2, 3, 4]
            mockGeojsonExtent.mockReturnValue(mockBounds)

            const result = getViewState(validFeatureCollection)

            expect(result).toHaveProperty("bounds")
            expect(result).toHaveProperty("fitBoundsOptions")
            expect(result).toHaveProperty("pitch")
            expect(result).toHaveProperty("bearing")
            expect(result).toHaveProperty("padding")
            expect(result).not.toHaveProperty("longitude")
            expect(result).not.toHaveProperty("latitude")
            expect(result).not.toHaveProperty("zoom")
        })

        it("should return consistent viewState structure for default result", () => {
            const result = getViewState(null)

            expect(result).toHaveProperty("longitude")
            expect(result).toHaveProperty("latitude")
            expect(result).toHaveProperty("zoom")
            expect(result).toHaveProperty("pitch")
            expect(result).toHaveProperty("bearing")
            expect(result).toHaveProperty("padding")
            expect(result).not.toHaveProperty("bounds")
            expect(result).not.toHaveProperty("fitBoundsOptions")
        })

        it("should have correct padding structure", () => {
            const result = getViewState(null)

            expect(result.padding).toEqual({
                top: 0,
                bottom: 0,
                left: 0,
                right: 0
            })
        })

        it("should have correct fitBoundsOptions structure for bounds-based result", () => {
            mockGeojsonExtent.mockReturnValue([1, 2, 3, 4])
            const result = getViewState(validFeatureCollection)

            expect(result.fitBoundsOptions).toEqual({ padding: 100 })
        })
    })

    describe("constants and default values", () => {
        const validFeatureCollection: FeatureCollection = {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [4.0, 52.0]
                    },
                    properties: {}
                }
            ]
        }

        it("should use correct initial bounds as fallback", () => {
            mockGeojsonExtent.mockImplementation(() => {
                throw new Error("Test error")
            })

            const result = getViewState(validFeatureCollection)

            expect(result.bounds).toEqual([3.1, 50.7, 7.2, 53.6])
        })

        it("should use correct default coordinates", () => {
            const result = getViewState(null)

            expect(result.longitude).toBe(4.9)
            expect(result.latitude).toBe(52.2)
            expect(result.zoom).toBe(6)
        })

        it("should use zero values for pitch and bearing", () => {
            mockGeojsonExtent.mockReturnValue([1, 2, 3, 4])
            const boundsResult = getViewState(validFeatureCollection)
            const defaultResult = getViewState(null)

            expect(boundsResult.pitch).toBe(0)
            expect(boundsResult.bearing).toBe(0)
            expect(defaultResult.pitch).toBe(0)
            expect(defaultResult.bearing).toBe(0)
        })

        it("should use correct fitBoundsOptions padding value", () => {
            mockGeojsonExtent.mockReturnValue([1, 2, 3, 4])
            const result = getViewState(validFeatureCollection)

            expect(result.fitBoundsOptions?.padding).toBe(100)
        })
    })

    describe("function behavior", () => {
        it("should not mutate input FeatureCollection", () => {
            const originalFeatureCollection: FeatureCollection = {
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        geometry: {
                            type: "Point",
                            coordinates: [4.0, 52.0]
                        },
                        properties: { name: "test" }
                    }
                ]
            }
            const featureCollectionCopy = JSON.parse(JSON.stringify(originalFeatureCollection))
            mockGeojsonExtent.mockReturnValue([1, 2, 3, 4])

            getViewState(originalFeatureCollection)

            expect(originalFeatureCollection).toEqual(featureCollectionCopy)
        })

        it("should call geojsonExtent exactly once when fields are provided", () => {
            const validFeatureCollection: FeatureCollection = {
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        geometry: {
                            type: "Point",
                            coordinates: [4.0, 52.0]
                        },
                        properties: {}
                    }
                ]
            }
            mockGeojsonExtent.mockReturnValue([1, 2, 3, 4])

            getViewState(validFeatureCollection)

            expect(mockGeojsonExtent).toHaveBeenCalledTimes(1)
        })

        it("should not call geojsonExtent when fields is null", () => {
            getViewState(null)

            expect(mockGeojsonExtent).not.toHaveBeenCalled()
        })

        it("should not call geojsonExtent when fields is undefined", () => {
            getViewState(undefined as any)

            expect(mockGeojsonExtent).not.toHaveBeenCalled()
        })
    })

    describe("bounds array validation", () => {
        it("should handle bounds with negative coordinates", () => {
            const validFeatureCollection: FeatureCollection = {
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        geometry: {
                            type: "Point",
                            coordinates: [-4.0, -52.0]
                        },
                        properties: {}
                    }
                ]
            }
            const mockBounds = [-5.0, -53.0, -3.0, -51.0]
            mockGeojsonExtent.mockReturnValue(mockBounds)

            const result = getViewState(validFeatureCollection)

            expect(result.bounds).toEqual(mockBounds)
        })

        it("should handle bounds that span the antimeridian", () => {
            const validFeatureCollection: FeatureCollection = {
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        geometry: {
                            type: "Point",
                            coordinates: [179.0, 0.0]
                        },
                        properties: {}
                    }
                ]
            }
            const mockBounds = [178.0, -1.0, -178.0, 1.0] // Crosses antimeridian
            mockGeojsonExtent.mockReturnValue(mockBounds)

            const result = getViewState(validFeatureCollection)

            expect(result.bounds).toEqual(mockBounds)
        })

        it("should handle very small bounds", () => {
            const validFeatureCollection: FeatureCollection = {
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        geometry: {
                            type: "Point",
                            coordinates: [4.000001, 52.000001]
                        },
                        properties: {}
                    }
                ]
            }
            const mockBounds = [4.000000, 52.000000, 4.000002, 52.000002]
            mockGeojsonExtent.mockReturnValue(mockBounds)

            const result = getViewState(validFeatureCollection)

            expect(result.bounds).toEqual(mockBounds)
        })
    })
})