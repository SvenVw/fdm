import { z } from "zod"

/**
 * Zod schema for validating RVO Field data.
 *
 * This schema matches the GeoJSON Feature structure returned by the RVO connector.
 * It validates the essential properties required for field synchronization.
 *
 * @remarks
 * The geometry is typed as `z.any()` here to allow flexibility with GeoJSON types,
 * but in practice, it will be a Polygon or MultiPolygon.
 */
export const RvoFieldSchema = z.object({
    /** Fixed type for GeoJSON Feature */
    type: z.literal("Feature"),
    /** GeoJSON geometry of the field (Polygon or MultiPolygon) */
    geometry: z.any(),
    /** Properties specific to the RVO crop field */
    properties: z.object({
        /** Unique identifier for the crop field (Gewasperceel ID) */
        CropFieldID: z.string(),
        /** Optional third-party identifier */
        ThirdPartyCropFieldID: z.string().optional(),
        /** Version identifier of the crop field data */
        CropFieldVersion: z.string(),
        /** Name or designator of the field (e.g., "Perceel 1") */
        CropFieldDesignator: z.string(),
        /** Start date of the crop field registration (ISO 8601 string) */
        BeginDate: z.string(),
        /** End date of the crop field registration (ISO 8601 string), optional */
        EndDate: z.string().optional(),
        /** Country code (e.g., "NL") */
        Country: z.string(),
        /** Code representing the type of crop grown */
        CropTypeCode: z.union([z.string(), z.number()]),
        /** Optional code for the specific variety of the crop */
        VarietyCode: z.union([z.string(), z.number()]).optional(),
        /** Optional code for the production purpose */
        CropProductionPurposeCode: z.union([z.string(), z.number()]).optional(),
        /** Optional code for field usage */
        FieldUseCode: z.union([z.string(), z.number()]).optional(),
        /** Optional code for regulatory soil type */
        RegulatorySoiltypeCode: z.union([z.string(), z.number()]).optional(),
        /** Code indicating the title/right of use (e.g., "01" for ownership, "02" for lease) */
        UseTitleCode: z.string(),
        /** Optional cause for the field record */
        CropFieldCause: z.string().optional(),
    }),
})

/**
 * TypeScript type inferred from `RvoFieldSchema`.
 * Represents a single agricultural field as retrieved from the RVO webservice.
 */
export type RvoField = z.infer<typeof RvoFieldSchema>

/**
 * Status of a field during the reconciliation process between local data and RVO data.
 */
export enum ReconciliationStatus {
    /** The field exists in both systems and is identical (no conflicts). */
    MATCH = "MATCH",
    /** The field exists in RVO but is missing locally. Suggests adding it to the local system. */
    NEW_REMOTE = "NEW_REMOTE",
    /** The field exists locally but is missing in RVO. Suggests removing it or keeping it as local-only. */
    NEW_LOCAL = "NEW_LOCAL",
    /** The field exists in both systems but has differing properties (e.g., geometry, name). */
    CONFLICT = "CONFLICT",
}

/**
 * Identifiers for specific properties that differ between a local field and an RVO field.
 * Used to highlight changes in the UI.
 */
export type FieldDiff =
    | "b_name" // Name difference
    | "b_geometry" // Spatial/Shape difference
    | "b_start" // Start date difference
    | "b_end" // End date difference
    | "b_acquiring_method" // Method of acquisition difference (implied)

/**
 * Represents the explicit decision made by the user for a reconciliation item.
 */
export enum UserReconciliationDecision {
    /** Use the RVO field's data (for CONFLICT, NEW_REMOTE) */
    USE_RVO = "USE_RVO",
    /** Keep the local field's data (for CONFLICT, NEW_LOCAL) */
    KEEP_LOCAL = "KEEP_LOCAL",
    /** Explicitly add a new RVO field */
    ADD = "ADD",
    /** Explicitly remove a local field */
    REMOVE = "REMOVE",
    /** Ignore this reconciliation item (take no action) */
    IGNORE = "IGNORE",
}

/**
 * Represents the result of comparing a single field between the local database and RVO.
 *
 * @template TLocal - The type of the local field object (defaults to `any` if not specified, typically `Field` from fdm-core).
 */
export interface ReconciliationItem<TLocal> {
    /** The reconciliation status (Match, New, Conflict, etc.) */
    status: ReconciliationStatus
    /** The local field object, if it exists (undefined for NEW_REMOTE) */
    localField?: TLocal
    /** The RVO field object, if it exists (undefined for NEW_LOCAL) */
    rvoField?: RvoField
    /** List of specific properties that differ (empty for MATCH, NEW_REMOTE, NEW_LOCAL) */
    diffs: FieldDiff[]
}
