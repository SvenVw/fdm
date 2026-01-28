import { z } from "zod"

export const FormSchema = z.object({
    p_app_amount: z.coerce
        .number({
            error: (issue) =>
                issue.input === undefined
                    ? "Hoeveelheid is verplicht"
                    : "Hoeveelheid moet een getal zijn",
        })
        .positive({
            error: "Hoeveelheid moet positief zijn",
        })
        .finite({
            error: "Hoeveelheid moet een geheel getal zijn",
        }),
    p_app_method: z.string().min(1, "Toepassingsmethode is verplicht"),
    p_app_date: z.coerce.date({
        error: (issue) =>
            issue.input === undefined
                ? "Datum is verplicht"
                : "Datum is ongeldig",
    }),
    p_id: z.string({
        // TODO: Validate against the options that are available
        error: (issue) =>
            issue.input === undefined
                ? "Keuze van meststof is verplicht"
                : "Meststof is ongeldig",
    }),
})

export const FormSchemaModify = FormSchema.extend({
    p_app_id: z.string({
        // TODO: Validate against the options that are available
        error: (issue) =>
            issue.input === undefined
                ? "Bemesting id is verplicht"
                : "Bemesting id is ongeldig",
    }),
})

export type FieldFertilizerFormValues = z.infer<typeof FormSchema> & {
    p_app_id?: string | undefined
}
