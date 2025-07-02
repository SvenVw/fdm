import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle, CheckCircle, FileUp, Upload } from "lucide-react"
import { useEffect, useState } from "react"
import { Form, useActionData, useNavigation } from "react-router"
import { RemixFormProvider, useRemixForm } from "remix-hook-form"
import { z } from "zod"
import { cn } from "@/app/lib/utils"
import { LoadingSpinner } from "~/components/custom/loadingspinner"
import { Button } from "~/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import {
    FormDescription,
    FormField,
    FormItem,
    FormMessage,
} from "~/components/ui/form"
import { Input } from "~/components/ui/input"
import { Progress } from "~/components/ui/progress"

type UploadStatus = "idle" | "uploading" | "success" | "error"

export function SoilAnalysisUploadForm() {
    const [fileName, setFileName] = useState<string | null>(null)
    const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle")
    const [uploadProgress, setUploadProgress] = useState(0)

    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
        defaultValues: {
            soilAnalysisFile: undefined,
        },
    })

    const actionData = useActionData<{
        message?: string
        fieldErrors?: Record<string, string[]>
        formErrors?: string[]
    } | null>()
    const navigation = useNavigation()

    // Determine if the form is currently submitting
    const isSubmitting = navigation.state === "submitting"

    useEffect(() => {
        if (isSubmitting) {
            setUploadStatus("uploading")
            setUploadProgress(100)
        } else if (actionData) {
            if (actionData.message) {
                setUploadStatus("success")
            } else if (actionData.fieldErrors || actionData.formErrors) {
                setUploadStatus("error")
            }
            // Reset status after a short delay for visual feedback
            const timer = setTimeout(() => {
                setUploadStatus("idle")
                setUploadProgress(0)
                form.reset()
            }, 2000)
            return () => clearTimeout(timer)
        } else {
            setUploadStatus("idle")
            setUploadProgress(0)
        }
    }, [isSubmitting, actionData, form.reset])

    // Handle file change to display the file name
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFileName(e.target.files[0].name)
            setUploadStatus("idle")
        } else {
            setFileName(null)
        }
    }

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault() // Prevent default to allow drop
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault() // Prevent default file opening in browser
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0]
            form.setValue("soilAnalysisFile", file, { shouldValidate: true })
            setFileName(file.name)
            setUploadStatus("idle") // Reset status when a new file is dropped
            e.dataTransfer.clearData()
        }
    }

    return (
        <div className="flex justify-center">
            <Card className="w-full max-w-lg mx-auto">
                <CardHeader>
                    <CardTitle>Upload bodemanalyse</CardTitle>
                    <CardDescription>
                        Upload het PDF-rapport van uw bodemanalyse van een van
                        onze ondersteunde laboratoria.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <RemixFormProvider {...form}>
                        <Form
                            id="soilAnalysisUploadForm"
                            method="post"
                            encType="multipart/form-data"
                        >
                            <fieldset disabled={isSubmitting}>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="soilAnalysisFile"
                                            render={({
                                                field: {
                                                    name,
                                                    onBlur,
                                                    onChange,
                                                    disabled,
                                                    ref,
                                                },
                                            }) => (
                                                <FormItem>
                                                    <div>Bodemanalyse</div>
                                                    <div>
                                                        <div
                                                            className={cn(
                                                                "flex flex-col items-center justify-center w-full h-32 rounded-md border border-dashed border-muted-foreground/25 px-6 py-4 text-center transition-colors hover:bg-muted/25",
                                                                uploadStatus ===
                                                                    "success" &&
                                                                    "border-green-500 bg-green-50",
                                                                uploadStatus ===
                                                                    "error" &&
                                                                    "border-red-500 bg-red-50",
                                                            )}
                                                            onDragOver={
                                                                handleDragOver
                                                            }
                                                            onDrop={handleDrop}
                                                        >
                                                            <Input
                                                                name={name}
                                                                onBlur={onBlur}
                                                                onChange={(
                                                                    event,
                                                                ) => {
                                                                    onChange(
                                                                        event
                                                                            .target
                                                                            .files?.[0],
                                                                    )
                                                                    handleFileChange(
                                                                        event,
                                                                    )
                                                                }}
                                                                ref={ref}
                                                                type="file"
                                                                placeholder=""
                                                                className="hidden"
                                                                accept=".pdf"
                                                                multiple={false}
                                                                required={true}
                                                                disabled={
                                                                    disabled
                                                                }
                                                                id="file-upload"
                                                            />
                                                            <label
                                                                htmlFor="file-upload"
                                                                className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
                                                            >
                                                                {uploadStatus ===
                                                                    "idle" && (
                                                                    <>
                                                                        <FileUp className="w-8 h-8 mb-2 text-muted-foreground" />
                                                                        <div className="text-sm text-muted-foreground">
                                                                            {fileName
                                                                                ? fileName
                                                                                : "Klik om te uploaden of sleep een PDF bestand naar hier"}
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground mt-1">
                                                                            PDF
                                                                            tot
                                                                            5MB
                                                                        </div>
                                                                    </>
                                                                )}

                                                                {uploadStatus ===
                                                                    "uploading" && (
                                                                    <>
                                                                        <Upload className="w-8 h-8 mb-2 text-primary animate-pulse" />
                                                                        <div className="text-sm">
                                                                            Uploading{" "}
                                                                            {
                                                                                fileName
                                                                            }
                                                                            ...
                                                                        </div>
                                                                        <Progress
                                                                            value={
                                                                                uploadProgress
                                                                            }
                                                                            className="w-full mt-2 h-2"
                                                                        />
                                                                    </>
                                                                )}

                                                                {uploadStatus ===
                                                                    "success" && (
                                                                    <>
                                                                        <CheckCircle className="w-8 h-8 mb-2 text-green-500" />
                                                                        <div className="text-sm text-green-600">
                                                                            Uploaden
                                                                            succesvol!
                                                                        </div>
                                                                    </>
                                                                )}

                                                                {uploadStatus ===
                                                                    "error" && (
                                                                    <>
                                                                        <AlertCircle className="w-8 h-8 mb-2 text-red-500" />
                                                                        <div className="text-sm text-red-600">
                                                                            Uploaden
                                                                            mislukt.
                                                                            Probeer
                                                                            het
                                                                            opnieuw.
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </label>
                                                        </div>
                                                    </div>
                                                    <FormDescription />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={
                                                isSubmitting ||
                                                uploadStatus === "success"
                                            }
                                        >
                                            {isSubmitting ? (
                                                <div className="flex items-center space-x-2">
                                                    <LoadingSpinner />
                                                    <span>Uploaden...</span>
                                                </div>
                                            ) : (
                                                "Upload analyse"
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </fieldset>
                        </Form>
                    </RemixFormProvider>
                </CardContent>
                <CardFooter className="flex flex-col items-start">
                    <p className="text-sm text-muted-foreground">
                        De volgende labs worden op dit moment ondersteunt:
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                        {[
                            "Eurofins Agro",
                            "HLB",
                            "ALNN",
                            "Altic",
                            "Dumea",
                            "Fertilab",
                            "Koch",
                            "Roba",
                            "SoilTech",
                            "Laboratorium Zeeuws-Vlaanderen",
                        ].map((lab) => (
                            <div
                                key={lab}
                                className="border rounded-md p-2 text-center text-sm"
                            >
                                {lab}
                            </div>
                        ))}
                    </div>
                </CardFooter>
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
