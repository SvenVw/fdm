import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle, CheckCircle, FileUp, Info } from "lucide-react"
import { useEffect, useRef, useState } from "react"
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
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert"
import { MijnPercelenUploadAnimation } from "./upload-animation"
import { parseDbf } from "shpjs"

type UploadState = "idle" | "animating" | "success" | "error"

const ANIMATION_ENABLED = true // Switch for the animation

export function MijnPercelenUploadForm() {
    const [fileNames, setFileNames] = useState<string[]>([])
    const [fieldNames, setFieldNames] = useState<string[]>([])
    const [hasAllRequiredFiles, setHasAllRequiredFiles] = useState(false)
    const [uploadState, setUploadState] = useState<UploadState>("idle")
    const uploadStartTime = useRef<number | null>(null)

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

    // Effect to start the animation
    useEffect(() => {
        if (isSubmitting) {
            setUploadState("animating")
            uploadStartTime.current = Date.now()
        }
    }, [isSubmitting])

    // Effect to handle the end of the animation
    useEffect(() => {
        if (actionData && uploadState === "animating") {
            const elapsedTime =
                Date.now() - (uploadStartTime.current || Date.now())
            const minAnimationTime = 4000
            const remainingTime = Math.max(0, minAnimationTime - elapsedTime)

            const timer = setTimeout(() => {
                if (actionData.message) {
                    setUploadState("success")
                } else {
                    setUploadState("error")
                }
            }, remainingTime)

            return () => clearTimeout(timer)
        }
    }, [actionData, uploadState])

    // Effect to reset the form after success/error message
    useEffect(() => {
        if (uploadState === "success" || uploadState === "error") {
            const timer = setTimeout(() => {
                setUploadState("idle")
                form.reset()
                setFileNames([])
                setFieldNames([])
                setHasAllRequiredFiles(false)
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [uploadState, form.reset])

    const checkRequiredFiles = (files: File[]) => {
        const extensions = files.map((file) =>
            file.name.slice(file.name.lastIndexOf(".")),
        )
        const hasAll = requiredExtensions.every((ext) =>
            extensions.includes(ext),
        )
        setHasAllRequiredFiles(hasAll)
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files)
            setFileNames(files.map((file) => file.name))
            checkRequiredFiles(files)
            setUploadState("idle")

            const dbfFile = files.find((file) => file.name.endsWith(".dbf"))
            if (dbfFile) {
                const dbfBuffer = await dbfFile.arrayBuffer()
                const dbfData = parseDbf(dbfBuffer) as any[]
                const names = dbfData.map((row) => row.NAAM)
                setFieldNames(names)
            }
        } else {
            setFileNames([])
            setFieldNames([])
            setHasAllRequiredFiles(false)
        }
    }

    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault()
    }

    const handleDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault()
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files)
            form.setValue("shapefile", files, { shouldValidate: true })
            setFileNames(files.map((file) => file.name))
            checkRequiredFiles(files)
            setUploadState("idle")
            e.dataTransfer.clearData()

            const dbfFile = files.find((file) => file.name.endsWith(".dbf"))
            if (dbfFile) {
                const dbfBuffer = await dbfFile.arrayBuffer()
                const dbfData = parseDbf(dbfBuffer) as any[]
                const names = dbfData.map((row) => row.NAAM)
                setFieldNames(names)
            }
        }
    }

    const disabledForm = (
        <Card className="w-full max-w-lg mx-auto">
            <CardHeader className="space-y-6">
                <CardTitle>Shapefile uploaden</CardTitle>
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Experimentele functie</AlertTitle>
                    <AlertDescription className="text-muted-foreground">
                        Deze functie is nog in ontwikkeling. Laat ons het weten
                        als je feedback hebt!
                    </AlertDescription>
                </Alert>
                <CardDescription>
                    Selecteer de bestanden van uw RVO Mijn Percelen export. Zorg
                    ervoor dat u alle bijbehorende bestanden selecteert (.shp,
                    .shx, .dbf, .prj).
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                        <div
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-32 rounded-md border border-dashed border-muted-foreground/25 px-6 py-4 text-center transition-colors",
                            )}
                        >
                            <FileUp className="w-8 h-8 mb-2 text-muted-foreground" />
                            <div className="text-sm text-muted-foreground">
                                {fileNames.length > 0
                                    ? fileNames.join(", ")
                                    : "Klik om te uploaden of sleep de bestanden hierheen"}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                .shp, .shx, .dbf, .prj
                            </div>
                        </div>
                        <Button className="w-full" disabled>
                            Uploaden
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )

    return (
        <div className="flex justify-center">
            {uploadState === "animating" && ANIMATION_ENABLED ? (
                <MijnPercelenUploadAnimation fieldNames={fieldNames}>
                    {disabledForm}
                </MijnPercelenUploadAnimation>
            ) : uploadState === "animating" && !ANIMATION_ENABLED ? (
                disabledForm
            ) : (
                <Card className="w-full max-w-lg mx-auto">
                    <CardHeader className="space-y-6">
                        <CardTitle>Shapefile uploaden</CardTitle>
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>Experimentele functie</AlertTitle>
                            <AlertDescription className="text-muted-foreground">
                                Deze functie is nog in ontwikkeling. Laat ons
                                het weten als je feedback hebt!
                            </AlertDescription>
                        </Alert>
                        <CardDescription>
                            Selecteer de bestanden van uw RVO Mijn Percelen
                            export. Zorg ervoor dat u alle bijbehorende
                            bestanden selecteert (.shp, .shx, .dbf, .prj).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <RemixFormProvider {...form}>
                            <Form
                                id="MijnPercelenUploadForm"
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
                                                                    uploadState ===
                                                                        "error" &&
                                                                        "border-red-500 bg-red-50",
                                                                    uploadState ===
                                                                        "success" &&
                                                                        "border-green-500 bg-green-50",
                                                                )}
                                                            >
                                                                <Input
                                                                    name={name}
                                                                    onBlur={
                                                                        onBlur
                                                                    }
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
                                                                    onDragOver={
                                                                        handleDragOver
                                                                    }
                                                                    onDrop={
                                                                        handleDrop
                                                                    }
                                                                >
                                                                    {uploadState ===
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
                                                                    {uploadState ===
                                                                        "success" && (
                                                                        <>
                                                                            <CheckCircle className="w-8 h-8 mb-2 text-green-500" />
                                                                            <div className="text-sm text-green-600">
                                                                                Uploaden
                                                                                succesvol!
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                    {uploadState ===
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
            )}
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
