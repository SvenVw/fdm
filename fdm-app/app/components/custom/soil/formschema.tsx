import type { SoilParameterDescription } from "@svenvw/fdm-core"
import { z } from "zod"

export function generateFormSchema(
    soilParameterDescription: SoilParameterDescription,
) {
    const FormSchema = z.object(
        soilParameterDescription.reduce(
            (acc, param) => {
                switch (param.type) {
                    case "numeric":
                        acc[param.parameter] = z.coerce
                            .number({
                                invalid_type_error: `${param.name} is ongeldig`,
                            })
                            .refine(
                                (value) => {
                                    if (
                                        param.min !== undefined &&
                                        value < param.min
                                    ) {
                                        return false
                                    }
                                    if (
                                        param.max !== undefined &&
                                        value > param.max
                                    ) {
                                        return false
                                    }
                                    return true
                                },
                                {
                                    message:
                                        param.min !== undefined &&
                                        param.max !== undefined
                                            ? `${param.name} moet tussen ${param.min} en ${param.max} liggen`
                                            : param.min !== undefined
                                              ? `${param.name} mag niet kleiner zijn dan ${param.min}`
                                              : param.max !== undefined
                                                ? `${param.name} mag niet groter zijn dan ${param.max}`
                                                : `${param.name} is ongeldig`,
                                },
                            )
                        break
                    case "enum":
                        acc[param.parameter] = z
                            .string({
                                invalid_type_error: `${param.name} is ongeldig`,
                            })
                            .refine(
                                (value) =>
                                    param.options?.includes(value) || false,
                                {
                                    message: `${param.name} is ongeldig`,
                                },
                            )
                        break
                    case "date":
                        acc[param.parameter] = z.coerce.date({
                            invalid_type_error: `${param.name} is ongeldig`,
                        })
                        break
                    case "text":
                        acc[param.parameter] = z.string({
                            invalid_type_error: `${param.name} is ongeldig`,
                        })
                        break
                    default:
                        break
                }
                return acc
            },
            {} as { [key: string]: any },
        ),
    )
    return FormSchema
}
