import { z } from "zod"

export const CultivationDetailsFormSchema = z.object({
    b_lu_start: z.coerce.date({
        required_error: "Zaaidatum is verplicht.",
    }),
    b_lu_end: z.coerce.date().optional().nullable(),
    m_cropresidue: z.coerce.boolean().optional().nullable(),
})

export type CultivationDetailsFormSchemaType = z.infer<
    typeof CultivationDetailsFormSchema
>

export const CultivationAddFormSchema = z.object({
    b_lu_catalogue: z.string().min(1, "Gewas is verplicht."),
    b_lu_start: z.coerce.date({
        required_error: "Zaaidatum is verplicht.",
    }),
    b_lu_end: z.coerce.date().optional().nullable(),
})

export type CultivationAddFormSchemaType = z.infer<
    typeof CultivationAddFormSchema
>
