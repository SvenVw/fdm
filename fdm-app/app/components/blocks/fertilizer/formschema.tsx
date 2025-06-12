import { z } from "zod"

export const FormSchema = z.object({
    p_name_nl: z.string({
        required_error: "Naam is verplicht",
        invalid_type_error: "Ongeldige waarde",
    }),
    p_type: z.string({
        required_error: "Type is verplicht",
        invalid_type_error: "Ongeldige waarde",
    }),
    p_n_rt: z.coerce
        .number({
            invalid_type_error: "Ongeldige waarde",
        })
        .min(0, {
            message: "Waarde mag niet negatief zijn",
        })
        .max(1000, {
            message: "Waarde mag niet groter zijn dan 1000",
        })
        .optional(),
    p_n_wc: z.coerce
        .number({
            invalid_type_error: "Ongeldige waarde",
        })
        .min(0, {
            message: "Waarde mag niet negatief zijn",
        })
        .max(1, {
            message: "Waarde mag niet groter zijn dan 1",
        })
        .optional(),
    p_p_rt: z.coerce
        .number({
            invalid_type_error: "Ongeldige waarde",
        })
        .min(0, {
            message: "Waarde mag niet negatief zijn",
        })
        .max(4583, {
            message: "Waarde mag niet groter zijn dan 4583",
        })
        .optional(),
    p_k_rt: z.coerce
        .number({
            invalid_type_error: "Ongeldige waarde",
        })
        .min(0, {
            message: "Waarde mag niet negatief zijn",
        })
        .max(2409.2, {
            message: "Waarde mag niet groter zijn dan 2409.2",
        })
        .optional(),
    p_om: z.coerce
        .number({
            invalid_type_error: "Ongeldige waarde",
        })
        .min(0, {
            message: "Waarde mag niet negatief zijn",
        })
        .max(1000, {
            message: "Waarde mag niet groter zijn dan 1000",
        })
        .optional(),
    p_eoc: z.coerce
        .number({
            invalid_type_error: "Ongeldige waarde",
        })
        .min(0, {
            message: "Waarde mag niet negatief zijn",
        })
        .max(1000, {
            message: "Waarde mag niet groter zijn dan 1000",
        })
        .optional(),
    p_s_rt: z.coerce
        .number({
            invalid_type_error: "Ongeldige waarde",
        })
        .min(0, {
            message: "Waarde mag niet negatief zijn",
        })
        .max(2497.2, {
            message: "Waarde mag niet groter zijn dan 2497.2",
        })
        .optional(),
    p_ca_rt: z.coerce
        .number({
            invalid_type_error: "Ongeldige waarde",
        })
        .min(0, {
            message: "Waarde mag niet negatief zijn",
        })
        .max(1399.2, {
            message: "Waarde mag niet groter zijn dan 1399.2",
        })
        .optional(),
    p_mg_rt: z.coerce
        .number({
            invalid_type_error: "Ongeldige waarde",
        })
        .min(0, {
            message: "Waarde mag niet negatief zijn",
        })
        .max(1659, {
            message: "Waarde mag niet groter zijn dan 1659",
        })
        .optional(),
})
