import { z } from "zod"

export const FormSchema = z
    .object({
        b_lu_harvest_date: z.coerce.date({
            required_error: "Oogstdatum is verplicht",
            invalid_type_error: "Oogstdatum moet een datum zijn",
        }),
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
            .max(250000, {
                message: "Hoeveelheid mag niet groter zijn dan 250000",
            })
            .safe({
                message: "Hoeveelheid moet een safe getal zijn",
            })
            .optional(),
        b_lu_yield_fresh: z.coerce
            .number({
                invalid_type_error: "Hoeveelheid moet een getal zijn",
            })
            .positive({
                message: "Hoeveelheid moet positief zijn",
            })
            .finite({
                message: "Hoeveelheid moet een geheel getal zijn",
            })
            .max(250000, {
                message: "Hoeveelheid mag niet groter zijn dan 250000",
            })
            .safe({
                message: "Hoeveelheid moet een safe getal zijn",
            })
            .optional(),
        b_lu_yield_bruto: z.coerce
            .number({
                invalid_type_error: "Hoeveelheid moet een getal zijn",
            })
            .positive({
                message: "Hoeveelheid moet positief zijn",
            })
            .finite({
                message: "Hoeveelheid moet een geheel getal zijn",
            })
            .max(250000, {
                message: "Hoeveelheid mag niet groter zijn dan 250000",
            })
            .safe({
                message: "Hoeveelheid moet een safe getal zijn",
            })
            .optional(),
        b_lu_dm: z.coerce
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
        b_lu_n_harvestable: z.coerce
            .number({
                invalid_type_error: "Hoeveelheid moet een getal zijn",
            })
            .min(0, {
                message: "Hoeveelheid moet positief zijn",
            })
            .max(1000, {
                message: "Hoeveelheid mag niet groter zijn dan 1000",
            })
            .optional(),
        b_lu_tarra: z.coerce
            .number({
                invalid_type_error: "Hoeveelheid moet een getal zijn",
            })
            .positive({
                message: "Hoeveelheid moet positief zijn",
            })
            .finite({
                message: "Hoeveelheid moet een geheel getal zijn",
            })
            .max(25, {
                message: "Hoeveelheid mag niet groter zijn dan 25",
            })
            .safe({
                message: "Hoeveelheid moet een safe getal zijn",
            })
            .optional(),
        b_lu_uww: z.coerce
            .number({
                invalid_type_error: "Hoeveelheid moet een getal zijn",
            })
            .positive({
                message: "Hoeveelheid moet positief zijn",
            })
            .finite({
                message: "Hoeveelheid moet een geheel getal zijn",
            })
            .min(100, {
                message: "Hoeveelheid mag niet kleiner zijn dan 100",
            })
            .max(1000, {
                message: "Hoeveelheid mag niet groter zijn dan 1000",
            })
            .safe({
                message: "Hoeveelheid moet een safe getal zijn",
            })
            .optional(),
        b_lu_moist: z.coerce
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
        b_lu_cp: z.coerce
            .number({
                invalid_type_error: "Hoeveelheid moet een getal zijn",
            })
            .positive({
                message: "Hoeveelheid moet positief zijn",
            })
            .finite({
                message: "Hoeveelheid moet een geheel getal zijn",
            })
            .max(500, {
                message: "Hoeveelheid mag niet groter zijn dan 500",
            })
            .safe({
                message: "Hoeveelheid moet een safe getal zijn",
            })
            .optional(),
        b_lu_start: z.preprocess(
            (value) =>
                typeof value === "string" && value.toLowerCase() === "null"
                    ? null
                    : value,
            z.coerce.date().optional().nullable(),
        ),
        b_lu_end: z.preprocess(
            (value) =>
                typeof value === "string" && value.toLowerCase() === "null"
                    ? null
                    : value,
            z.coerce.date().optional().nullable(),
        ),
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
