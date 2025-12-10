import bbox from "@turf/bbox"
import intersect from "@turf/intersect"
import union from "@turf/union"
import area from "@turf/area"
import { feature, featureCollection } from "@turf/helpers"
import type { Field } from "@svenvw/fdm-core"
import {
    type RvoField,
    ReconciliationStatus,
    type ReconciliationItem,
    type FieldDiff,
} from "./types"

// Threshold for IoU (Intersection over Union) to consider fields "the same" spatially
const IOU_THRESHOLD = 0.9

/**
 * Calculates Intersection over Union (IoU) for two geometries.
 */
function calculateIoU(geom1: any, geom2: any): number {
    try {
        // Cast to Polygon or MultiPolygon because Turf expects specific geometry types for intersect/union
        const f1 = feature(geom1)
        const f2 = feature(geom2)

        // Turf v7 intersect takes a FeatureCollection of polygons
        const intResult = intersect(featureCollection([f1, f2]))
        if (!intResult) return 0

        // Union also takes a FeatureCollection in some versions or strict types
        const unionResult = union(featureCollection([f1, f2]))
        if (!unionResult) return 0

        const areaInt = area(intResult)
        const areaUnion = area(unionResult)

        if (areaUnion === 0) return 0
        return areaInt / areaUnion
    } catch (e) {
        console.error("Error calculating IoU", e)
        return 0
    }
}

/**
 * Checks if two bounding boxes overlap.
 */
function bboxOverlap(bbox1: number[], bbox2: number[]): boolean {
    return !(
        (
            bbox1[2] < bbox2[0] || // left
            bbox1[0] > bbox2[2] || // right
            bbox1[3] < bbox2[1] || // bottom
            bbox1[1] > bbox2[3]
        ) // top
    )
}

export function compareFields(
    localFields: Field[],
    rvoFields: RvoField[],
): ReconciliationItem<Field>[] {
    const results: ReconciliationItem<Field>[] = []
    const matchedRvoIds = new Set<string>()
    const matchedLocalIds = new Set<string>()

    // Tier 1: ID Match
    for (const local of localFields) {
        if (local.b_id_source) {
            const rvoMatch = rvoFields.find(
                (r) => r.properties.CropFieldID === local.b_id_source,
            )
            if (rvoMatch) {
                matchedLocalIds.add(local.b_id)
                matchedRvoIds.add(rvoMatch.properties.CropFieldID)

                const diffs = detectDiffs(local, rvoMatch)
                results.push({
                    status:
                        diffs.length > 0
                            ? ReconciliationStatus.CONFLICT
                            : ReconciliationStatus.MATCH,
                    localField: local,
                    rvoField: rvoMatch,
                    diffs,
                })
            }
        }
    }

    // Tier 2: Spatial Match (for remaining fields)
    // Pre-calculate bboxes for remaining local fields
    const remainingLocals = localFields
        .filter((f) => !matchedLocalIds.has(f.b_id))
        .map((f) => ({
            field: f,
            bbox: bbox(f.b_geometry as any),
        }))

    for (const rvo of rvoFields) {
        if (matchedRvoIds.has(rvo.properties.CropFieldID)) continue

        const rvoBbox = bbox(rvo.geometry)
        let bestMatch: Field | null = null
        let bestIoU = 0

        // Filter candidates by BBox first
        const candidates = remainingLocals.filter((l) =>
            bboxOverlap(l.bbox, rvoBbox),
        )

        for (const candidate of candidates) {
            const iou = calculateIoU(candidate.field.b_geometry, rvo.geometry)
            if (iou > bestIoU) {
                bestIoU = iou
                bestMatch = candidate.field
            }
        }

        if (bestMatch && bestIoU > IOU_THRESHOLD) {
            matchedRvoIds.add(rvo.properties.CropFieldID)
            matchedLocalIds.add(bestMatch.b_id) // Important: mark as matched so it doesn't duplicate

            const diffs = detectDiffs(bestMatch, rvo)
            results.push({
                status:
                    diffs.length > 0
                        ? ReconciliationStatus.CONFLICT
                        : ReconciliationStatus.MATCH,
                localField: bestMatch,
                rvoField: rvo,
                diffs,
            })
        } else {
            // No match found -> New Remote Field
            results.push({
                status: ReconciliationStatus.NEW_REMOTE,
                rvoField: rvo,
                diffs: [],
            })
        }
    }

    // Remaining Local Fields -> New Local (suggest remove?)
    for (const local of localFields) {
        if (!matchedLocalIds.has(local.b_id)) {
            results.push({
                status: ReconciliationStatus.NEW_LOCAL,
                localField: local,
                diffs: [],
            })
        }
    }

    return results
}

function detectDiffs(local: Field, rvo: RvoField): FieldDiff[] {
    const diffs: FieldDiff[] = []

    // 1. Name
    if (
        local.b_name !== rvo.properties.CropFieldDesignator &&
        rvo.properties.CropFieldDesignator
    ) {
        diffs.push("b_name")
    }

    // 2. Geometry (Approximate check using IoU)
    const iou = calculateIoU(local.b_geometry, rvo.geometry)
    if (iou < 0.99) {
        // Strict threshold for "exact" match
        diffs.push("b_geometry")
    }

    // 3. Dates (Start)
    const localStart =
        local.b_start instanceof Date
            ? local.b_start.toISOString().split("T")[0]
            : local.b_start
    const rvoStart = rvo.properties.BeginDate
        ? new Date(rvo.properties.BeginDate).toISOString().split("T")[0]
        : null

    if (localStart !== rvoStart) {
        diffs.push("b_start")
    }

    // 4. Dates (End)
    const localEnd =
        local.b_end instanceof Date
            ? local.b_end.toISOString().split("T")[0]
            : null
    const rvoEnd = rvo.properties.EndDate
        ? new Date(rvo.properties.EndDate).toISOString().split("T")[0]
        : null

    if (localEnd !== rvoEnd) {
        diffs.push("b_end")
    }

    return diffs
}
