import { Controller, type Control } from "react-hook-form"
import { AuthCodeInput } from "~/components/blocks/auth/auth-code-input"
import {
    Field,
    FieldContent,
    FieldError,
    FieldLabel,
} from "~/components/ui/field"

interface AuthCodeFieldProps {
    control: Control<any>
    name?: string
    onComplete?: (value: string) => void
    serverError?: string
}

export function AuthCodeField({
    control,
    name = "code",
    onComplete,
    serverError,
}: AuthCodeFieldProps) {
    return (
        <Controller
            control={control}
            name={name}
            render={({ field, fieldState }) => (
                <Field>
                    <FieldLabel className="sr-only">Code</FieldLabel>
                    <FieldContent>
                        <AuthCodeInput field={field} onComplete={onComplete} />
                        <FieldError
                            errors={[
                                fieldState.error,
                                serverError ? { message: serverError } : undefined,
                            ]}
                        />
                    </FieldContent>
                </Field>
            )}
        />
    )
}
