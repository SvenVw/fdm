import { z } from "zod"

export const FormSchema = z
    .object({
        b_lu_yield: z.coerce
            .number({
                invalid_type_error: "Hoeveelheid moet een getal zijn",
            })
            .positive({
                message: "Hoeveelheid moet positief zijn",
            })
            .finite({
                message: "Hoeveelheid moet een geheel getal zijn",
            })
            .max(100000, {
                message: "Hoeveelheid mag niet groter zijn dan 100000",
            })
            .safe({
                message: "Hoeveelheid moet een safe getal zijn",
            })
            .optional(),
        b_lu_n_harvestable: z.coerce
            .number({
                invalid_type_error: "Hoeveelheid moet een getal zijn",
            })
            .min(0, {
                message: "Hoeveelheid moet positief zijn",
            })
            .max(1000, {
                message: "Hoeveelheid mag niet groter zijn dan 1000",
            })
            .optional(),
        b_lu_start: z.coerce.date().optional(),
        b_lu_end: z.coerce.date().optional(),
        b_lu_harvest_date: z.coerce.date({
            required_error: "Oogstdatum is verplicht",
            invalid_type_error: "Oogstdatum moet een datum zijn",
        }),
    })
    .superRefine(
        (data, ctx) => {
        if (
            data.b_lu_start &&
            data.b_lu_harvest_date &&
            data.b_lu_harvest_date <= data.b_lu_start
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Oogstdatum moet na de zaaidatum van de teelt liggen",
                path: ["b_lu_harvest_date"],
            })
        }
        if (
            data.b_lu_end &&
            data.b_lu_harvest_date &&
            data.b_lu_harvest_date > data.b_lu_end
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                    "Oogstdatum mag niet na de einddatum van de teelt liggen",
                path: ["b_lu_harvest_date"],
            })
        }
    })
