import z from "zod"

export const FormSchema = z.object({
    code: z
        .string({
            required_error: "Vul de verificatiecode in",
        })
        .min(8, {
            message: "De code moet uit 8 tekens bestaan",
        })
        .max(8, {
            message: "De code moet uit 8 tekens bestaan",
        }),
    redirectTo: z.string().optional(),
})