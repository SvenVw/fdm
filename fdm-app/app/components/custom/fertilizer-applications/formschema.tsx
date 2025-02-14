import { z } from "zod"

export const FormSchema = z.object({
    p_app_amount: z.coerce
        .number({
            required_error: "Hoeveelheid is verplicht",
            invalid_type_error: "Hoeveelheid moet een getal zijn",
        })
        .positive({
            message: "Hoeveelheid moet positief zijn",
        })
        .finite({
            message: "Hoeveelheid moet een geheel getal zijn",
        })
        .safe({
            message: "Hoeveelheid moet een safe getal zijn",
        }),
    p_app_date: z.coerce.date({
        required_error: "Datum is verplicht",
        invalid_type_error: "Datum is ongeldig",
    }),
    p_id: z.coerce.string({
        // TODO: Validate against the options that are available
        required_error: "Keuze van meststof is verplicht",
        invalid_type_error: "Meststof is ongeldig",
    }),
})
