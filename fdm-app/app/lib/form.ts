import type { z } from "zod"

export async function extractFormValuesFromRequest(
    request: Request,
    FormSchema: z.ZodSchema<any>,
): Promise<{ [key: string]: any }> {
    // Get the formData
    const form = await request.formData()

    // Convert to an object
    const formData = Object.fromEntries(form)

    // Trim all values and remove quotation marks
    // Note: Somewhere additional quotation marks are added, preferablly that is not the case, but this workaround removes them
    for (const key in formData) {
        formData[key] = String(formData[key]).replace(/['"]+/g, "").trim()

        // Daypicker return 01 Jan 1970 if no date is selected. This workaroud removes the date if it is 01 Jan 1970
        if (formData[key] === "1970-01-01T00:00:00.000Z") {
            delete formData[key]
        }
    }

    // Coerce and validate the formdate
    const result = FormSchema.safeParse(formData)

    if (!result.success) {
        // Handle validation errors
        const errors = result.error.flatten()
        console.log(errors)
        throw new Error("Validation failed")
    }

    const formValues = result.data
    return formValues
}
