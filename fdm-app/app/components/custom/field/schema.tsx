import { z } from "zod"

const FormSchema = z.object({
    b_name: z
        .string({
            required_error: "Naam van perceel is verplicht",
        })
        .min(3, {
            message: "Naam van perceel moet minimaal 3 karakters bevatten",
        }),
    b_lu_catalogue: z.string({
        required_error: "Hoofdgewas is verplicht",
    }),
    b_id_source: z.string({
        required_error: "Bron is verplicht",
    }),
    b_geometry: z.string({
        required_error: "Geometrie is verplicht",
    }),
})

export { FormSchema }
