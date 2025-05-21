import { z } from "zod"

export const FormSchema = z.object({
    a_source: z
        .string({
            invalid_type_error: "Bron is ongeldig",
        })
        .refine((value) => value.toUpperCase() !== "nl-other-nmi", {
            message: "Bron mag niet 'NMI' zijn.",
        })
        .optional(),
    b_sampling_date: z.coerce.date().optional(),
    a_n_rt: z.coerce
        .number()
        .gte(1, "Waarde moet groter dan 1 zijn")
        .lte(30000, "Waarde moet kleiner dan 30000 zijn")
        .optional(),
    a_c_of: z.coerce
        .number()
        .gte(0.1, "Waarde moet groter dan 0.1 zijn")
        .lte(600, "Waarde moet kleiner dan 600 zijn")
        .optional(),
    a_cn_fr: z.coerce
        .number()
        .gte(5, "Waarde moet groter dan 5 zijn")
        .lte(40, "Waarde moet kleiner dan 100 zijn")
        .optional(),
    a_density_sa: z.coerce
        .number()
        .gte(0.5, "Waarde moet groter dan 0.5 zijn")
        .lte(3, "Waarde moet kleiner dan 3 zijn")
        .optional(),
    a_p_al: z.coerce
        .number()
        .gte(1, "Waarde moet groter dan 1 zijn")
        .lte(250, "Waarde moet kleiner dan 250 zijn")
        .optional(),
    a_p_cc: z.coerce
        .number()
        .gte(0.1, "Waarde moet groter dan 0.1 zijn")
        .lte(100, "Waarde moet kleiner dan 100 zijn")
        .optional(),
    a_som_loi: z.coerce
        .number()
        .gte(0.5, "Waarde moet groter dan 0.5 zijn")
        .lte(75, "Waarde moet kleiner dan 75 zijn")
        .optional(),
    b_soiltype_agr: z.string().optional(),
    b_gwl_class: z.string().optional(),
})
