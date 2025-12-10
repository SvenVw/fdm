import { z } from "zod";

// Define RvoFieldSchema matching the GeoJSON Feature structure from rvo-connector
export const RvoFieldSchema = z.object({
  type: z.literal("Feature"),
  geometry: z.any(), // GeoJSON geometry
  properties: z.object({
    CropFieldID: z.string(),
    ThirdPartyCropFieldID: z.string().optional(),
    CropFieldVersion: z.string(),
    CropFieldDesignator: z.string(),
    BeginDate: z.string(),
    EndDate: z.string().optional(),
    Country: z.string(),
    CropTypeCode: z.union([z.string(), z.number()]),
    VarietyCode: z.union([z.string(), z.number()]).optional(),
    CropProductionPurposeCode: z.union([z.string(), z.number()]).optional(),
    FieldUseCode: z.union([z.string(), z.number()]).optional(),
    RegulatorySoiltypeCode: z.union([z.string(), z.number()]).optional(),
    UseTitleCode: z.string(), // "01" | "02" etc.
    CropFieldCause: z.string().optional(),
    // QualityIndicatorType omitted for brevity/relevance for now, can be added if needed
  }),
});

export type RvoField = z.infer<typeof RvoFieldSchema>;

export enum ReconciliationStatus {
  MATCH = "MATCH",
  NEW_REMOTE = "NEW_REMOTE",
  NEW_LOCAL = "NEW_LOCAL",
  CONFLICT = "CONFLICT",
}

export type FieldDiff = "b_name" | "b_geometry" | "b_start" | "b_end" | "b_acquiring_method";

export interface ReconciliationItem<TLocal> {
  status: ReconciliationStatus;
  localField?: TLocal;
  rvoField?: RvoField;
  diffs: FieldDiff[];
}
