import { z } from "zod"

export const RotationTableFormSchema = z.object({
    fieldIds: z
        .string({ invalid_type_error: "fieldIds is verplicht." })
        .min(1, "fieldIds is verplicht."),
    cultivationIds: z
        .string({ invalid_type_error: "cultivationIds is verplicht." })
        .min(1, "cultivationIds is verplicht."),
    m_cropresidue: z.preprocess((value) => {
        if (typeof value === "string") {
            if (value.toLowerCase() === "false") return false
            if (value.toLowerCase() === "true") return true
            if (value.toLowerCase() === "null") return null
        }
        return value
    }, z.coerce.boolean().optional().nullable()),
})

export type RotationTableFormSchemaType = z.infer<
    typeof RotationTableFormSchema
>
