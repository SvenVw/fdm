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

// Threshold for IoU (Intersection over Union) to consider fields "the same" spatially.
// A value of 0.99 means the intersection area must be at least 99% of the union area.
const IOU_THRESHOLD = 0.99

/**
 * Calculates Intersection over Union (IoU) for two geometries.
 *
 * IoU is a standard metric for measuring the overlap between two shapes.
 * Formula: Area(Intersection) / Area(Union)
 *
 * @param geom1 - The first geometry (GeoJSON).
 * @param geom2 - The second geometry (GeoJSON).
 * @returns A number between 0 (no overlap) and 1 (perfect match). Returns 0 on error.
 */
function calculateIoU(geom1: any, geom2: any): number {
    try {
        // Cast to Polygon or MultiPolygon because Turf expects specific geometry types for intersect/union
        const f1 = feature(geom1)
        const f2 = feature(geom2)

        // Turf v7 intersect takes a FeatureCollection of polygons to intersect
        const intResult = intersect(featureCollection([f1, f2]))
        if (!intResult) return 0

        // Union also takes a FeatureCollection
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
 *
 * Used as a fast pre-filter before calculating expensive IoU operations.
 *
 * @param bbox1 - [minX, minY, maxX, maxY]
 * @param bbox2 - [minX, minY, maxX, maxY]
 * @returns True if boxes overlap, false otherwise.
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

/**
 * Compares a list of local fields against a list of RVO fields to determine their reconciliation status.
 *
 * The matching strategy operates in two tiers:
 * 1. **Tier 1: ID Match**: Checks if `localField.b_id_source` matches `rvoField.CropFieldID`.
 *    This is the most reliable method for fields that have been synced before.
 * 2. **Tier 2: Spatial Match**: For fields unmatched by ID, it calculates the spatial overlap (IoU).
 *    If the overlap exceeds `IOU_THRESHOLD` (0.9), they are considered the same field.
 *
 * @param localFields - Array of fields currently in the local database.
 * @param rvoFields - Array of fields retrieved from the RVO webservice.
 * @returns An array of `ReconciliationItem` objects, each representing a field and its status (MATCH, CONFLICT, NEW_REMOTE, NEW_LOCAL).
 */
export function compareFields(
    localFields: Field[],
    rvoFields: RvoField[],
): ReconciliationItem<Field>[] {
    const results: ReconciliationItem<Field>[] = []
    const matchedRvoIds = new Set<string>()
    const matchedLocalIds = new Set<string>()

    // ---------------------------------------------------------
    // Tier 1: Match by Source ID (CropFieldID)
    // ---------------------------------------------------------
    for (const local of localFields) {
        if (local.b_id_source) {
            const rvoMatch = rvoFields.find(
                (r) => r.properties.CropFieldID === local.b_id_source,
            )
            if (rvoMatch) {
                // Mark as matched to prevent re-matching in Tier 2
                matchedLocalIds.add(local.b_id)
                matchedRvoIds.add(rvoMatch.properties.CropFieldID)

                // Detect any property differences (geometry, name, dates)
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

    // ---------------------------------------------------------
    // Tier 2: Spatial Match (IoU) for remaining fields
    // ---------------------------------------------------------

    // Prepare candidates: Only local fields that haven't been matched yet
    const remainingLocals = localFields
        .filter((f) => !matchedLocalIds.has(f.b_id))
        .map((f) => ({
            field: f,
            // Pre-calculate BBox for performance (avoid recalc inside loop)
            bbox: bbox(f.b_geometry as any),
        }))

    for (const rvo of rvoFields) {
        // Skip if this RVO field was already matched in Tier 1
        if (matchedRvoIds.has(rvo.properties.CropFieldID)) continue

        const rvoBbox = bbox(rvo.geometry)
        let bestMatch: Field | null = null
        let bestIoU = 0

        // Optimization: Fast BBox overlap check before accurate IoU
        const candidates = remainingLocals.filter((l) =>
            bboxOverlap(l.bbox, rvoBbox),
        )

        // Find the best spatial match among candidates
        for (const candidate of candidates) {
            const iou = calculateIoU(candidate.field.b_geometry, rvo.geometry)
            if (iou > bestIoU) {
                bestIoU = iou
                bestMatch = candidate.field
            }
        }

        // If the best match exceeds our threshold, link them
        if (bestMatch && bestIoU > IOU_THRESHOLD) {
            matchedRvoIds.add(rvo.properties.CropFieldID)
            matchedLocalIds.add(bestMatch.b_id)

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
            // No match found -> This is a NEW field from RVO
            results.push({
                status: ReconciliationStatus.NEW_REMOTE,
                rvoField: rvo,
                diffs: [],
            })
        }
    }

    // ---------------------------------------------------------
    // Identify orphaned local fields
    // ---------------------------------------------------------
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

/**
 * Detects specific property differences between a matched pair of Local and RVO fields.
 *
 * Compares:
 * - Name (`b_name` vs `CropFieldDesignator`)
 * - Geometry (via IoU < 0.99)
 * - Start Date (`b_start` vs `BeginDate`)
 * - End Date (`b_end` vs `EndDate`)
 *
 * @param local - The local field object.
 * @param rvo - The RVO field object.
 * @returns An array of property names (`FieldDiff`) that differ.
 */
function detectDiffs(local: Field, rvo: RvoField): FieldDiff[] {
    const diffs: FieldDiff[] = []

    // 1. Name
    // We check if RVO has a name (designator) and if it differs from local
    if (
        local.b_name !== rvo.properties.CropFieldDesignator &&
        rvo.properties.CropFieldDesignator
    ) {
        diffs.push("b_name")
    }

    // 2. Geometry
    // We use a very strict IoU (0.99) to detect if the shape has been modified, even slightly.
    const iou = calculateIoU(local.b_geometry, rvo.geometry)
    if (iou < IOU_THRESHOLD) {
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

    // Treat null/undefined as equal if both are missing
    if (localEnd !== rvoEnd && (localEnd !== null || rvoEnd !== null)) {
        diffs.push("b_end")
    }

    return diffs
}
