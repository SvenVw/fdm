import z from "zod"

export const FormSchema = z.object({
    b_name: z
        .string({
            required_error: "Naam van perceel is verplicht",
        })
        .min(3, {
            message: "Naam van perceel moet minimaal 3 karakters bevatten",
        }),
    b_area: z.coerce
        .number({
            required_error: "Oppervlakte van perceel is verplicht",
        })
        .optional(),
    b_lu_catalogue: z.string({
        required_error: "Hoofdgewas is verplicht",
    }),
    b_bufferstrip: z.boolean().optional(),
})
