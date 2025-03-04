import { z } from "zod"

export const FormSchema = z.object({
    b_lu_catalogue: z.string({
        required_error: "Gewas is verplicht",
    }),
    b_lu_start: z.coerce.date({
        required_error: "Datum is verplicht",
        invalid_type_error: "Datum is ongeldig",
    }),
    b_terminating_date: z.coerce
        .date({
            invalid_type_error: "Datum is ongeldig",
        })
        .optional(),
})
