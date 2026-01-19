import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { z } from "zod"

export const FormSchema = z
    .object({
        b_lu_harvest_date: z
            .string({
                required_error: "Selecteer een oogstdatum",
                invalid_type_error: "Selecteer een geldige oogstdatum",
            })
            .transform((val, ctx) => {
                const date = new Date(val)
                if (Number.isNaN(date.getTime())) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: "Selecteer een geldige oogstdatum",
                    })
                    return z.NEVER
                }
                return date
            }),
        b_lu_yield: z.preprocess(
            (val) => (val === "" ? undefined : val),
            z.coerce
                .number({
                    invalid_type_error: "De waarde moet een getal zijn",
                })
                .positive({
                    message: "De waarde moet groter zijn dan 0",
                })
                .finite({
                    message: "De waarde moet een geldig getal zijn",
                })
                .max(250000, {
                    message:
                        "Opbrengst mag niet groter zijn dan 250.000 kg DS / ha",
                })
                .safe({
                    message: "De waarde is buiten het toegestane bereik",
                })
                .optional(),
        ),
        b_lu_yield_fresh: z.preprocess(
            (val) => (val === "" ? undefined : val),
            z.coerce
                .number({
                    invalid_type_error: "De waarde moet een getal zijn",
                })
                .positive({
                    message: "De waarde moet groter zijn dan 0",
                })
                .finite({
                    message: "De waarde moet een geldig getal zijn",
                })
                .max(250000, {
                    message:
                        "Opbrengst mag niet groter zijn dan 250.000 kg versproduct / ha",
                })
                .safe({
                    message: "De waarde is buiten het toegestane bereik",
                })
                .optional(),
        ),
        b_lu_yield_bruto: z.preprocess(
            (val) => (val === "" ? undefined : val),
            z.coerce
                .number({
                    invalid_type_error: "De waarde moet een getal zijn",
                })
                .positive({
                    message: "De waarde moet groter zijn dan 0",
                })
                .finite({
                    message: "De waarde moet een geldig getal zijn",
                })
                .max(250000, {
                    message:
                        "Opbrengst mag niet groter zijn dan 250.000 kg versproduct (incl. tarra) / ha",
                })
                .safe({
                    message: "De waarde is buiten het toegestane bereik",
                })
                .optional(),
        ),
        b_lu_dm: z.preprocess(
            (val) => (val === "" ? undefined : val),
            z.coerce
                .number({
                    invalid_type_error: "De waarde moet een getal zijn",
                })
                .positive({
                    message: "De waarde moet groter zijn dan 0",
                })
                .finite({
                    message: "De waarde moet een geldig getal zijn",
                })
                .max(1000, {
                    message:
                        "Het droge stof gehalte mag niet groter zijn dan 1.000 g / kg",
                })
                .safe({
                    message: "De waarde is buiten het toegestane bereik",
                })
                .optional(),
        ),
        b_lu_n_harvestable: z.preprocess(
            (val) => (val === "" ? undefined : val),
            z.coerce
                .number({
                    invalid_type_error: "De waarde moet een getal zijn",
                })
                .positive({
                    message: "De waarde moet groter zijn dan 0",
                })
                .max(1000, {
                    message:
                        "De stikstofopbrengst mag niet groter zijn dan 1.000 kg N / ha",
                })
                .optional(),
        ),
        b_lu_tarra: z.preprocess(
            (val) => (val === "" ? undefined : val),
            z.coerce
                .number({
                    invalid_type_error: "De waarde moet een getal zijn",
                })
                .positive({
                    message: "De waarde moet groter zijn dan 0",
                })
                .finite({
                    message: "De waarde moet een geldig getal zijn",
                })
                .max(25, {
                    message: "Het tarra-percentage mag niet hoger zijn dan 25%",
                })
                .safe({
                    message: "De waarde is buiten het toegestane bereik",
                })
                .optional(),
        ),
        b_lu_uww: z.preprocess(
            (val) => (val === "" ? undefined : val),
            z.coerce
                .number({
                    invalid_type_error: "De waarde moet een getal zijn",
                })
                .positive({
                    message: "De waarde moet groter zijn dan 0",
                })
                .finite({
                    message: "De waarde moet een geldig getal zijn",
                })
                .min(100, {
                    message:
                        "Het onderwatergewicht mag niet kleiner zijn dan 100 g / 5 kg",
                })
                .max(1000, {
                    message:
                        "Het onderwatergewicht mag niet groter zijn dan 1.000 g / 5 kg",
                })
                .safe({
                    message: "De waarde is buiten het toegestane bereik",
                })
                .optional(),
        ),
        b_lu_moist: z.preprocess(
            (val) => (val === "" ? undefined : val),
            z.coerce
                .number({
                    invalid_type_error: "De waarde moet een getal zijn",
                })
                .positive({
                    message: "De waarde moet groter zijn dan 0",
                })
                .finite({
                    message: "De waarde moet een geldig getal zijn",
                })
                .max(100, {
                    message: "Het vochtpercentage mag niet hoger zijn dan 100%",
                })
                .safe({
                    message: "De waarde is buiten het toegestane bereik",
                })
                .optional(),
        ),
        b_lu_cp: z.preprocess(
            (val) => (val === "" ? undefined : val),
            z.coerce
                .number({
                    invalid_type_error: "De waarde moet een getal zijn",
                })
                .positive({
                    message: "De waarde moet groter zijn dan 0",
                })
                .finite({
                    message: "De waarde moet een geldig getal zijn",
                })
                .max(500, {
                    message:
                        "Het ruw eiwit gehalte mag niet groter zijn dan 500 g / kg DS",
                })
                .safe({
                    message: "De waarde is buiten het toegestane bereik",
                })
                .optional(),
        ),
        b_lu_start: z.coerce.date().optional().nullable(),
        b_lu_end: z.coerce.date().optional().nullable(),
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
                message: `De oogstdatum mag niet vóór de start van de teelt (${format(data.b_lu_start, "PP", { locale: nl })}) vallen`,
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
                message: `De oogstdatum mag niet ná het einde van de teelt (${format(data.b_lu_end, "PP", { locale: nl })}) vallen`,
                path: ["b_lu_harvest_date"],
            })
        }
    })
