import { z } from "zod"

export const FormSchema = z.object({
    b_lu_harvest_date: z.preprocess(
        (arg) => {
            if (typeof arg == "string" || arg instanceof Date)
                return new Date(arg)
        },
        z.date({
            required_error: "Een oogstdatum is verplicht.",
        }),
    ),
    b_lu_yield: z.coerce.number().optional(),
    b_lu_n_harvestable: z.coerce.number().optional(),
    b_lu_start: z.preprocess(
        (arg) => {
            if (typeof arg == "string" || arg instanceof Date)
                return new Date(arg)
        },
        z.date().nullable().optional(),
    ),
    b_lu_end: z.preprocess(
        (arg) => {
            if (typeof arg == "string" || arg instanceof Date)
                return new Date(arg)
        },
        z.date().nullable().optional(),
    ),
    b_lu_harvestable: z.enum(["once", "multiple", "none"]).optional(),
})
