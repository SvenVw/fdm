import { data } from "react-router"
import type { ZodSchema, z } from "zod"
import { handleActionError } from "./error"

/**
 * Extracts, validates, and transforms form data from a request using a Zod schema.
 *
 * This function is designed to simplify the process of handling form data in Remix
 * action functions. It extracts the form data from the request, validates it against
 * the provided Zod schema, and returns the parsed data. If validation fails, it throws
 * an error with detailed information about the validation errors.
 *
 * @param request - The HTTP request object.
 * @param schema - The Zod schema to validate the form data against.
 * @returns The parsed and validated form data.
 * @throws {Response} If the form data fails validation, includes error details.
 */
export async function extractFormValuesFromRequest<T extends ZodSchema>(
    request: Request,
    schema: T,
) {
    try {
        const formData = await request.formData()

        // Trim all values and remove quotation marks
        // Note: Somewhere additional quotation marks are added, preferably that is not the case, but this workaround removes them
        for (const key of formData.keys()) {
            const value = formData.get(key)
            if (typeof value === "string") {
                formData.set(key, value.replace(/['"]+/g, "").trim())

                // Daypicker return 01 Jan 1970 if no date is selected. This workaround removes the date if it is 01 Jan 1970
                if (value === "1970-01-01T00:00:00.000Z") {
                    formData.delete(key)
                }
            }
        }

        const formObject = Object.fromEntries(formData)
        const parsedData = schema.safeParse(formObject)

        if (!parsedData.success) {
            const errors = parsedData.error.errors.map((err) => ({
                path: err.path.join("."),
                message: err.message,
            }))

            throw new Error(JSON.stringify(errors))
        }

        return parsedData.data as z.infer<T>
    } catch (error) {
        throw handleActionError(error)
    }
}
