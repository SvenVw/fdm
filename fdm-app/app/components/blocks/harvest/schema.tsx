import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { z } from "zod"

export const FormSchema = z
    .object({
        b_lu_harvest_date: z
            .string({
                error: (issue) =>
                    issue.input === undefined
                        ? "Selecteer een oogstdatum"
                        : "Selecteer een geldige oogstdatum",
            })
            .transform((val, ctx) => {
                const date = new Date(val)
                if (Number.isNaN(date.getTime())) {
                    ctx.addIssue({
                        code: "custom",
                        message: "Selecteer een geldige oogstdatum",
                    })
                    return z.NEVER
                }
                return date
            }),
        b_lu_yield: z.preprocess(
            (val) => (val === "" ? undefined : val),
            z.coerce
                .number()
                .int({
                    error: "De waarde is buiten het toegestane bereik",
                })
                .positive({
                    error: "De waarde moet groter zijn dan 0",
                })
                .finite({
                    error: "De waarde moet een geldig getal zijn",
                })
                .max(250000, {
                    error: "Opbrengst mag niet groter zijn dan 250.000 kg DS / ha",
                })
                .optional(),
        ),
        b_lu_yield_fresh: z.preprocess(
            (val) => (val === "" ? undefined : val),
            z.coerce
                .number()
                .int({
                    error: "De waarde is buiten het toegestane bereik",
                })
                .positive({
                    error: "De waarde moet groter zijn dan 0",
                })
                .finite({
                    error: "De waarde moet een geldig getal zijn",
                })
                .max(250000, {
                    error: "Opbrengst mag niet groter zijn dan 250.000 kg versproduct / ha",
                })
                .optional(),
        ),
        b_lu_yield_bruto: z.preprocess(
            (val) => (val === "" ? undefined : val),
            z.coerce
                .number()
                .int({
                    error: "De waarde is buiten het toegestane bereik",
                })
                .positive({
                    error: "De waarde moet groter zijn dan 0",
                })
                .finite({
                    error: "De waarde moet een geldig getal zijn",
                })
                .max(250000, {
                    error: "Opbrengst mag niet groter zijn dan 250.000 kg versproduct (incl. tarra) / ha",
                })
                .optional(),
        ),
        b_lu_dm: z.preprocess(
            (val) => (val === "" ? undefined : val),
            z.coerce
                .number()
                .int({
                    error: "De waarde is buiten het toegestane bereik",
                })
                .positive({
                    error: "De waarde moet groter zijn dan 0",
                })
                .finite({
                    error: "De waarde moet een geldig getal zijn",
                })
                .max(1000, {
                    error: "Het droge stof gehalte mag niet groter zijn dan 1.000 g / kg",
                })
                .optional(),
        ),
        b_lu_n_harvestable: z.preprocess(
            (val) => (val === "" ? undefined : val),
            z.coerce
                .number({
                    error: (issue) =>
                        issue.input === undefined
                            ? undefined
                            : "De waarde moet een getal zijn",
                })
                .positive({
                    error: "De waarde moet groter zijn dan 0",
                })
                .max(1000, {
                    error: "De stikstofopbrengst mag niet groter zijn dan 1.000 kg N / ha",
                })
                .optional(),
        ),
        b_lu_tarra: z.preprocess(
            (val) => (val === "" ? undefined : val),
            z.coerce
                .number()
                .int({
                    error: "De waarde is buiten het toegestane bereik",
                })
                .positive({
                    error: "De waarde moet groter zijn dan 0",
                })
                .finite({
                    error: "De waarde moet een geldig getal zijn",
                })
                .max(25, {
                    error: "Het tarra-percentage mag niet hoger zijn dan 25%",
                })
                .optional(),
        ),
        b_lu_uww: z.preprocess(
            (val) => (val === "" ? undefined : val),
            z.coerce
                .number()
                .int({
                    error: "De waarde is buiten het toegestane bereik",
                })
                .positive({
                    error: "De waarde moet groter zijn dan 0",
                })
                .finite({
                    error: "De waarde moet een geldig getal zijn",
                })
                .min(100, {
                    error: "Het onderwatergewicht mag niet kleiner zijn dan 100 g / 5 kg",
                })
                .max(1000, {
                    error: "Het onderwatergewicht mag niet groter zijn dan 1.000 g / 5 kg",
                })
                .optional(),
        ),
        b_lu_moist: z.preprocess(
            (val) => (val === "" ? undefined : val),
            z.coerce
                .number()
                .int({
                    error: "De waarde is buiten het toegestane bereik",
                })
                .positive({
                    error: "De waarde moet groter zijn dan 0",
                })
                .finite({
                    error: "De waarde moet een geldig getal zijn",
                })
                .max(100, {
                    error: "Het vochtpercentage mag niet hoger zijn dan 100%",
                })
                .optional(),
        ),
        b_lu_cp: z.preprocess(
            (val) => (val === "" ? undefined : val),
            z.coerce
                .number()
                .int({
                    error: "De waarde is buiten het toegestane bereik",
                })
                .positive({
                    error: "De waarde moet groter zijn dan 0",
                })
                .finite({
                    error: "De waarde moet een geldig getal zijn",
                })
                .max(500, {
                    error: "Het ruw eiwit gehalte mag niet groter zijn dan 500 g / kg DS",
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
                code: "custom",
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
                code: "custom",
                message: `De oogstdatum mag niet ná het einde van de teelt (${format(data.b_lu_end, "PP", { locale: nl })}) vallen`,
                path: ["b_lu_harvest_date"],
            })
        }
    })
