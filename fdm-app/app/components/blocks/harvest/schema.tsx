import { z } from "zod"

export const FormSchema = z
    .object({
        b_lu_harvest_date: z
            .string({
                required_error:
                    "Geef een datum voor wanneer dit gewas is geoogst",
                invalid_type_error:
                    "Geef een datum voor wanneer dit gewas is geoogst",
            })
            .transform((val, ctx) => {
                const date = new Date(val)
                if (Number.isNaN(date.getTime())) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message:
                            "Geef een datum voor wanneer dit gewas is geoogst",
                    })
                    return z.NEVER
                }
                return date
            }),
        b_lu_yield: z.preprocess(
            (val) => (val === "" ? undefined : val),
            z.coerce
                .number({
                    invalid_type_error: "Hoeveelheid moet een getal zijn",
                })
                .positive({
                    message: "Hoeveelheid moet groter zijn dan 0",
                })
                .finite({
                    message: "Hoeveelheid moet een geheel getal zijn",
                })
                .max(250000, {
                    message:
                        "Hoeveelheid mag niet groter zijn dan 250.000 kg DS / ha",
                })
                .safe({
                    message: "Hoeveelheid moet een safe getal zijn",
                })
                .optional(),
        ),
        b_lu_yield_fresh: z.preprocess(
            (val) => (val === "" ? undefined : val),
            z.coerce
                .number({
                    invalid_type_error: "Hoeveelheid moet een getal zijn",
                })
                .positive({
                    message: "Hoeveelheid moet groter zijn dan 0",
                })
                .finite({
                    message: "Hoeveelheid moet een geheel getal zijn",
                })
                .max(250000, {
                    message:
                        "Hoeveelheid mag niet groter zijn dan 250.000 kg versproduct / ha",
                })
                .safe({
                    message: "Hoeveelheid moet een safe getal zijn",
                })
                .optional(),
        ),
        b_lu_yield_bruto: z.preprocess(
            (val) => (val === "" ? undefined : val),
            z.coerce
                .number({
                    invalid_type_error: "Hoeveelheid moet een getal zijn",
                })
                .positive({
                    message: "Hoeveelheid moet groter zijn dan 0",
                })
                .finite({
                    message: "Hoeveelheid moet een geheel getal zijn",
                })
                .max(250000, {
                    message:
                        "Hoeveelheid mag niet groter zijn dan 250.000 kg versproduct (incl. tarra) / ha",
                })
                .safe({
                    message: "Hoeveelheid moet een safe getal zijn",
                })
                .optional(),
        ),
        b_lu_dm: z.preprocess(
            (val) => (val === "" ? undefined : val),
            z.coerce
                .number({
                    invalid_type_error: "Hoeveelheid moet een getal zijn",
                })
                .positive({
                    message: "Hoeveelheid moet groter zijn dan 0",
                })
                .finite({
                    message: "Hoeveelheid moet een geheel getal zijn",
                })
                .max(1000, {
                    message:
                        "Hoeveelheid mag niet groter zijn dan 1.000 g Ds / kg versproduct",
                })
                .safe({
                    message: "Hoeveelheid moet een safe getal zijn",
                })
                .optional(),
        ),
        b_lu_n_harvestable: z.preprocess(
            (val) => (val === "" ? undefined : val),
            z.coerce
                .number({
                    invalid_type_error: "Hoeveelheid moet een getal zijn",
                })
                .positive({
                    message: "Hoeveelheid moet groter zijn dan 0",
                })
                .max(1000, {
                    message: "Hoeveelheid mag niet groter zijn dan 1000",
                })
                .optional(),
        ),
        b_lu_tarra: z.preprocess(
            (val) => (val === "" ? undefined : val),
            z.coerce
                .number({
                    invalid_type_error: "Hoeveelheid moet een getal zijn",
                })
                .positive({
                    message: "Hoeveelheid moet groter zijn dan 0",
                })
                .finite({
                    message: "Hoeveelheid moet een geheel getal zijn",
                })
                .max(25, {
                    message: "Hoeveelheid mag niet groter zijn dan 25 %",
                })
                .safe({
                    message: "Hoeveelheid moet een safe getal zijn",
                })
                .optional(),
        ),
        b_lu_uww: z.preprocess(
            (val) => (val === "" ? undefined : val),
            z.coerce
                .number({
                    invalid_type_error: "Hoeveelheid moet een getal zijn",
                })
                .positive({
                    message: "Hoeveelheid moet groter zijn dan 0",
                })
                .finite({
                    message: "Hoeveelheid moet een geheel getal zijn",
                })
                .min(100, {
                    message: "Hoeveelheid mag niet kleiner zijn dan 100",
                })
                .max(1000, {
                    message:
                        "Hoeveelheid mag niet groter zijn dan 1.000 g / 5 kg",
                })
                .safe({
                    message: "Hoeveelheid moet een safe getal zijn",
                })
                .optional(),
        ),
        b_lu_moist: z.preprocess(
            (val) => (val === "" ? undefined : val),
            z.coerce
                .number({
                    invalid_type_error: "Hoeveelheid moet een getal zijn",
                })
                .positive({
                    message: "Hoeveelheid moet groter zijn dan 0",
                })
                .finite({
                    message: "Hoeveelheid moet een geheel getal zijn",
                })
                .max(100, {
                    message: "Hoeveelheid mag niet groter zijn dan 100 %",
                })
                .safe({
                    message: "Hoeveelheid moet een safe getal zijn",
                })
                .optional(),
        ),
        b_lu_cp: z.preprocess(
            (val) => (val === "" ? undefined : val),
            z.coerce
                .number({
                    invalid_type_error: "Hoeveelheid moet een getal zijn",
                })
                .positive({
                    message: "Hoeveelheid moet groter zijn dan 0",
                })
                .finite({
                    message: "Hoeveelheid moet een geheel getal zijn",
                })
                .max(500, {
                    message:
                        "Hoeveelheid mag niet groter zijn dan 500 g RE / kg DS",
                })
                .safe({
                    message: "Hoeveelheid moet een safe getal zijn",
                })
                .optional(),
        ),
        b_lu_start: z
            .union([z.coerce.date().optional(), z.literal("null")])
            .nullable(),
        b_lu_end: z
            .union([z.coerce.date().optional(), z.literal("null")])
            .nullable(),
        b_lu_harvestable: z.enum(["once", "multiple", "none"]),
    })
    .superRefine((data, ctx) => {
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
            data.b_lu_harvest_date > data.b_lu_end &&
            data.b_lu_harvestable === "multiple"
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                    "Oogstdatum mag niet na de einddatum van de teelt liggen",
                path: ["b_lu_harvest_date"],
            })
        }
    })
