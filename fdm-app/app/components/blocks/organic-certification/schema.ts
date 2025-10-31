import { z } from "zod"

/**
 * Regular expression for validating EU TRACES document numbers for Organic Operator Certificates.
 * Examples: NL-BIO-01.528-0002967.2025.001, NL-BIO-01.528-0005471.2025.001
 *
 * NOTE: This is duplicated from fdm-core/src/organic.ts because fdm-core is not fully client-side safe.
 */
const TRACES_REGEX = /^NL-BIO-\d{2}\.\d{3}-\d{7}\.\d{4}\.\d{3}$/

/**
 * Regular expression for validating SKAL numbers.
 * Examples: 026281, 024295
 *
 * NOTE: This is duplicated from fdm-core/src/organic.ts because fdm-core is not fully client-side safe.
 */
const SKAL_REGEX = /^\d{6}$/

// Client-side safe validation functions
function isValidTracesNumber(tracesNumber: string): boolean {
    return TRACES_REGEX.test(tracesNumber)
}

function isValidSkalNumber(skalNumber: string): boolean {
    return SKAL_REGEX.test(skalNumber)
}

export const formSchema = z
    .object({
        b_organic_traces: z
            .string()
            .trim()
            .optional()
            .refine((val) => !val || isValidTracesNumber(val), {
                message: "Ongeldig TRACES-nummer",
            }),
        b_organic_skal: z
            .string()
            .trim()
            .optional()
            .refine((val) => !val || isValidSkalNumber(val), {
                message: "Ongeldig SKAL-nummer",
            }),
        b_organic_issued: z.coerce.date({
            required_error: "Startdatum is verplicht",
            invalid_type_error: "Ongeldige datum",
        }),
        b_organic_expires: z.coerce
            .date({
                invalid_type_error: "Ongeldige datum",
            })
            .optional(),
    })
    .refine(
        (data) => {
            if (data.b_organic_issued && data.b_organic_expires) {
                return (
                    data.b_organic_issued.getTime() <
                    data.b_organic_expires.getTime()
                )
            }
            return true
        },
        {
            message: "Startdatum kan niet na einddatum liggen",
            path: ["b_organic_issued"],
        },
    )
    .refine((data) => !!(data.b_organic_traces || data.b_organic_skal), {
        message: "Vul een TRACES- of SKAL-nummer in",
        path: ["b_organic_traces"],
    })
