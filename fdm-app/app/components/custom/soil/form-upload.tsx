import { RemixFormProvider, useRemixForm } from "remix-hook-form"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { Form } from "react-router"
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "~/components/ui/form"
import { Input } from "~/components/ui/input"
import { Button } from "~/components/ui/button"
import { LoadingSpinner } from "../loadingspinner"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { FileUpload } from "@mjackson/form-data-parser"
import { useEffect } from "react"

export function SoilAnalysisUploadForm() {
    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
        defaultValues: {
            soilAnalysisFile: undefined,
        },
    })

    useEffect(() => {
        if (form.formState.isSubmitSuccessful) {
            form.reset()
        }
    }, [form.formState, form.reset])
    return (
        <div className="flex justify-center">
            <Card className="w-[500px]">
                <CardHeader>
                    <CardTitle>Upload bodemanalyse</CardTitle>
                    <CardDescription>
                        Upload een bodemanalyse en check de gegevens
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <RemixFormProvider {...form}>
                        <Form
                            id="soilAnalysisUploadForm"
                            onSubmit={form.handleSubmit}
                            method="post"
                            encType="multipart/form-data"
                        >
                            <fieldset disabled={form.formState.isSubmitting}>
                                <div className="space-y-6">
                                    <p className="text-sm text-muted-foreground">
                                        Vul de gegevens van de bodemanalyse in.
                                    </p>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="soilAnalysisFile"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Bodemanalyse (pdf)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input
                                                                {...field}
                                                                type="file"
                                                                placeholder=""
                                                                className="block w-full rounded-md"
                                                                accept=".pdf"
                                                                multiple={false}
                                                                // required={true}
                                                                disabled={
                                                                    form
                                                                        .formState
                                                                        .isSubmitting
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) => {
                                                                    field.onChange(
                                                                        event
                                                                            .target
                                                                            .files?.[0],
                                                                    )
                                                                }}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormDescription>
                                                        Kies een pdf met
                                                        bodemanalyse van één van
                                                        de volgende labs:
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex justify-end mt-4">
                                        <Button
                                            type="submit"
                                            disabled={
                                                form.formState.isSubmitting
                                            }
                                        >
                                            {form.formState.isSubmitting ? (
                                                <div className="flex items-center space-x-2">
                                                    <LoadingSpinner />
                                                    <span>Uploaden...</span>
                                                </div>
                                            ) : (
                                                "Uploaden"
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </fieldset>
                        </Form>
                    </RemixFormProvider>
                </CardContent>
            </Card>
        </div>
    )
}

const fileSizeLimit = 5 * 1024 * 1024 // 5MB
export const FormSchema = z.object({
    soilAnalysisFile: z
        .instanceof(File)
        .refine((file) => ["application/pdf"].includes(file.type), {
            message: "Ongeldig bestandstype",
        })
        .refine((file) => file.size > 0, {
            message: "Bestand is ongeldig",
        })
        .refine((file) => file.size <= fileSizeLimit, {
            message: "Bestand mag niet groter zijn dan 5MB",
        }),
})
