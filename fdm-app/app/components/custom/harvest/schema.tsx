import { z } from "zod"

export const FormSchema = z.object({
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
        .max(100, {
            message: "Hoeveelheid mag niet groter zijn dan 100",
        })
        .safe({
            message: "Hoeveelheid moet een safe getal zijn",
        })
        .optional(),
    b_lu_n_harvestable: z.coerce
        .number({
            invalid_type_error: "Hoeveelheid moet een getal zijn",
        })
        .positive({
            message: "Hoeveelheid moet positief zijn",
        })
        .finite({
            message: "Hoeveelheid moet een geheel getal zijn",
        })
        .max(1000, {
            message: "Hoeveelheid mag niet groter zijn dan 1000",
        })
        .safe({
            message: "Hoeveelheid moet een safe getal zijn",
        })
        .optional(),
    // b_sowing_date: z.coerce.date().optional(),
    b_harvesting_date: z.coerce.date({
        required_error: "Oogstdatum is verplicht",
        invalid_type_error: "Oogstdatum moet een datum zijn",
    }),
})
