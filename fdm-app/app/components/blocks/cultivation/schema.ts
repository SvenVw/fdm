import { z } from "zod"

export const CultivationDetailsFormSchema = z
    .object({
        b_lu_start: z.coerce.date({
            required_error: "Zaaidatum is verplicht.",
        }),
        b_lu_end: z
            .preprocess((value) => {
                if (typeof value === "string") {
                    if (value.toLowerCase() === "null") return null
                }
                return value
            }, z.coerce.date().optional().nullable())
            .default(null),
        m_cropresidue: z.preprocess((value) => {
            if (typeof value === "string") {
                if (value.toLowerCase() === "false") return false
                if (value.toLowerCase() === "true") return true
                if (value.toLowerCase() === "null") return null
            }
            return value
        }, z.coerce.boolean().optional().nullable()),
        b_lu_variety: z.preprocess((value) => {
            if (typeof value === "string") {
                if (value.toLowerCase() === "null") return null
            }
            return value
        }, z.string().optional().nullable()),
    })
    .refine(
        (data) => {
            if (data.b_lu_start && data.b_lu_end) {
                return data.b_lu_end > data.b_lu_start
            }
            return true
        },
        {
            message: "Einddatum moet na de zaaidatum liggen.",
            path: ["b_lu_end"],
        },
    )

export type CultivationDetailsFormSchemaType = z.infer<
    typeof CultivationDetailsFormSchema
>

export const CultivationAddFormSchema = z.object({
    b_lu_catalogue: z.string().min(1, "Gewas is verplicht."),
    b_lu_start: z.coerce.date({
        required_error: "Zaaidatum is verplicht.",
    }),
    b_lu_end: z.preprocess((value) => {
        if (typeof value === "string") {
            if (value.toLowerCase() === "null") return null
        }
        return value
    }, z.coerce.date().optional().nullable()),
})

export type CultivationAddFormSchemaType = z.infer<
    typeof CultivationAddFormSchema
>
