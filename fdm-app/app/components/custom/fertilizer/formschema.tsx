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
    p_n_rt: z.coerce.number({
        invalid_type_error: "Ongeldige waarde",
    }),
    p_p_rt: z.coerce.number({
        invalid_type_error: "Ongeldige waarde",
    }),
    p_k_rt: z.coerce.number({
        invalid_type_error: "Ongeldige waarde",
    }),
    p_om: z.coerce.number({
        invalid_type_error: "Ongeldige waarde",
    }),
    p_c_rt: z.coerce.number({
        invalid_type_error: "Ongeldige waarde",
    }),
    p_s_rt: z.coerce.number({
        invalid_type_error: "Ongeldige waarde",
    }),
    p_ca_rt: z.coerce.number({
        invalid_type_error: "Ongeldige waarde",
    }),
    p_mg_rt: z.coerce.number({
        invalid_type_error: "Ongeldige waarde",
    }),
})
