import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle, CheckCircle, FileUp, Info, Upload } from "lucide-react"
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
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert"

type UploadStatus = "idle" | "uploading" | "success" | "error"

export function ShapefileUploadForm() {
    const [fileNames, setFileNames] = useState<string[]>([])
    const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle")
    const [uploadProgress, setUploadProgress] = useState(0)
    const [hasAllRequiredFiles, setHasAllRequiredFiles] = useState(false)

    const requiredExtensions = [".shp", ".shx", ".dbf", ".prj"]

    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
        defaultValues: {
            shapefile: [],
        },
    })

    const actionData = useActionData<{
        message?: string
        fieldErrors?: Record<string, string[]>
        formErrors?: string[]
    } | null>()
    const navigation = useNavigation()

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

    const checkRequiredFiles = (files: File[]) => {
        const extensions = files.map((file) =>
            file.name.slice(file.name.lastIndexOf(".")),
        )
        const hasAll = requiredExtensions.every((ext) =>
            extensions.includes(ext),
        )
        setHasAllRequiredFiles(hasAll)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files)
            setFileNames(files.map((file) => file.name))
            checkRequiredFiles(files)
            setUploadStatus("idle")
        } else {
            setFileNames([])
            setHasAllRequiredFiles(false)
        }
    }

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files)
            form.setValue("shapefile", files, { shouldValidate: true })
            setFileNames(files.map((file) => file.name))
            checkRequiredFiles(files)
            setUploadStatus("idle")
            e.dataTransfer.clearData()
        }
    }

    return (
        <div className="flex justify-center">
            <Card className="w-full max-w-lg mx-auto">
                <CardHeader className="space-y-6">
                    <CardTitle>Shapefile uploaden</CardTitle>
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Experimentele functie</AlertTitle>
                        <AlertDescription className="text-muted-foreground">
                            Deze functie is nog in ontwikkeling. Laat ons het
                            weten als je feedback hebt!
                        </AlertDescription>
                    </Alert>
                    <CardDescription>
                        Selecteer de bestanden van uw RVO Mijn Percelen export.
                        Zorg ervoor dat u alle bijbehorende bestanden selecteert
                        (.shp, .shx, .dbf, .prj).
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <RemixFormProvider {...form}>
                        <Form
                            id="shapefileUploadForm"
                            method="post"
                            encType="multipart/form-data"
                        >
                            <fieldset disabled={isSubmitting}>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="shapefile"
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
                                                    <div>Shapefiles</div>
                                                    <div>
                                                        <div
                                                            className={cn(
                                                                "flex flex-col items-center justify-center w-full h-32 rounded-md border border-dashed border-muted-foreground/25 px-6 py-4 text-center transition-colors hover:bg-muted/25",
                                                                hasAllRequiredFiles &&
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
                                                                            .files,
                                                                    )
                                                                    handleFileChange(
                                                                        event,
                                                                    )
                                                                }}
                                                                ref={ref}
                                                                type="file"
                                                                placeholder=""
                                                                className="hidden"
                                                                multiple
                                                                required
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
                                                                            {fileNames.length >
                                                                            0
                                                                                ? fileNames.join(
                                                                                      ", ",
                                                                                  )
                                                                                : "Klik om te uploaden of sleep de bestanden hierheen"}
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground mt-1">
                                                                            .shp,
                                                                            .shx,
                                                                            .dbf,
                                                                            .prj
                                                                        </div>
                                                                    </>
                                                                )}

                                                                {uploadStatus ===
                                                                    "uploading" && (
                                                                    <>
                                                                        <Upload className="w-8 h-8 mb-2 text-primary animate-pulse" />
                                                                        <div className="text-sm">
                                                                            Uploading...
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
                                                !hasAllRequiredFiles
                                            }
                                        >
                                            {isSubmitting ? (
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
    shapefile: z
        .array(z.instanceof(File))
        .refine(
            (files) =>
                files.every(
                    (file) => file.size > 0 && file.size <= fileSizeLimit,
                ),
            {
                message: "Een of meerdere bestanden zijn ongeldig of te groot.",
            },
        )
        .refine(
            (files) => {
                const extensions = files.map((file) =>
                    file.name.slice(file.name.lastIndexOf(".")),
                )
                return [".shp", ".shx", ".dbf", ".prj"].every((ext) =>
                    extensions.includes(ext),
                )
            },
            {
                message:
                    "Zorg ervoor dat u een .shp, .shx, .dbf, en .prj bestand selecteert.",
            },
        ),
})
