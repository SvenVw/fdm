import { zodResolver } from "@hookform/resolvers/zod"
import {
    AlertCircle,
    CheckCircle,
    Circle,
    FileUp,
    FlaskConical,
    X,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Form, NavLink, useActionData, useNavigation } from "react-router"
import { RemixFormProvider, useRemixForm } from "remix-hook-form"
import { z } from "zod"
import { cn } from "@/app/lib/utils"
import { LoadingSpinner } from "~/components/custom/loadingspinner"
import { Button } from "~/components/ui/button"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "~/components/ui/accordion"
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
import { toast as notify } from "sonner"

type UploadState = "idle" | "animating" | "success" | "error"

const ANIMATION_ENABLED = true // Switch for the animation

export function MijnPercelenUploadForm({
    b_id_farm,
    calendar,
}: {
    b_id_farm: string
    calendar: string
}) {
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
        const extensions = files.map((file) => getFileExtension(file.name))
        const hasAll = requiredExtensions.every((ext) =>
            extensions.includes(ext),
        )
        setHasAllRequiredFiles(hasAll)
    }

    useEffect(() => {
        return () => {
            form.reset()
        }
    }, [form.reset])

    const handleFilesSet = async (files: File[]) => {
        const validFiles = files.filter((file) => {
            const extension = getFileExtension(file.name)
            const isValid = requiredExtensions.includes(extension)
            if (!isValid) {
                notify.warning(`Bestandstype niet ondersteund: ${extension}`, {
                    id: `invalid-file-type-${file.name}`,
                })
            }
            return isValid
        })

        setFileNames(validFiles.map((file) => file.name))
        checkRequiredFiles(validFiles)
        setUploadState("idle")

        const dbfFile = validFiles.find((file) => file.name.endsWith(".dbf"))
        if (dbfFile) {
            try {
                const dbfBuffer = await dbfFile.arrayBuffer()
                const dbfData = parseDbf(dbfBuffer) as any[]
                const names = dbfData.map((row) => row?.NAAM).filter(Boolean) // Remove null/undefined values
                setFieldNames(names)
            } catch (error) {
                console.error("Failed to parse DBF file:", error)
                notify.error("Kon het DBF bestand niet verwerken")
                setFieldNames([])
            }
        } else {
            setFieldNames([])
        }
    }

    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault()
    }

    const handleFileChange = async (
        event: React.ChangeEvent<HTMLInputElement>,
        onChange: (files: File[]) => void,
    ) => {
        if (event.target.files) {
            const newFiles = Array.from(event.target.files)
            const validNewFiles = newFiles.filter((file) => {
                const extension = getFileExtension(file.name)
                const isValid = requiredExtensions.includes(extension)
                if (!isValid) {
                    notify.warning(
                        `Bestandstype niet ondersteund: ${extension}`,
                        {
                            id: `invalid-file-type-${file.name}`,
                        },
                    )
                }
                return isValid
            })

            if (validNewFiles.length === 0) return

            const currentFiles = form.getValues("shapefile") || []
            const updatedFiles = [...currentFiles, ...validNewFiles]
            const uniqueFiles = updatedFiles.reduce((acc, current) => {
                if (!acc.find((item) => item.name === current.name)) {
                    acc.push(current)
                }
                return acc
            }, [] as File[])

            onChange(uniqueFiles)
            await handleFilesSet(uniqueFiles)
        }
    }

    const handleDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault()
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const newFiles = Array.from(e.dataTransfer.files)
            const validNewFiles = newFiles.filter((file) => {
                const extension = getFileExtension(file.name)
                const isValid = requiredExtensions.includes(extension)
                if (!isValid) {
                    notify.warning(
                        `Bestandstype niet ondersteund: ${extension}`,
                        {
                            id: `invalid-file-type-${file.name}`,
                        },
                    )
                }
                return isValid
            })

            if (validNewFiles.length === 0) return

            const currentFiles = form.getValues("shapefile") || []
            const updatedFiles = [...currentFiles, ...validNewFiles]
            const uniqueFiles = updatedFiles.reduce((acc, current) => {
                if (!acc.find((item) => item.name === current.name)) {
                    acc.push(current)
                }
                return acc
            }, [] as File[])

            form.setValue("shapefile", uniqueFiles, { shouldValidate: true })
            handleFilesSet(uniqueFiles)
            e.dataTransfer.clearData()
        }
    }

    const disabledForm = (
        <Card className="w-full max-w-lg mx-auto">
            <CardHeader className="space-y-6">
                <CardTitle>Shapefile uploaden</CardTitle>
                <Alert>
                    <FlaskConical className="h-4 w-4" />
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
                <Accordion type="single" collapsible>
                    <AccordionItem value="item-1">
                        <AccordionTrigger>
                            Hoe download ik een shapefile van mijn.rvo.nl?
                        </AccordionTrigger>
                        <AccordionContent>
                            <ol className="list-decimal list-inside space-y-2">
                                <li>Log in op mijn.rvo.nl.</li>
                                <li>
                                    Ga via ‘’Registratie en meldingen
                                    doorgeven’’ naar ‘’Percelen registreren’’.
                                </li>
                                <li>
                                    Klik op ‘’Registreren en wijzigen’’ onder
                                    ‘’Mijn percelen’’.
                                </li>
                                <li>
                                    Ga bij ‘’Mijn percelen’’ naar ‘’Wijzigen’’.
                                </li>
                                <li>
                                    Klik op de datum om het juiste jaar en de
                                    juiste peildatum in te stellen waarvoor u de
                                    gecombineerde opgave wilt downloaden.
                                </li>
                                <li>
                                    Klik op het zwarte/blauwe pijltje dat naar
                                    beneden wijst. Vervolgens verschijnt er een
                                    klein uitklapmenu waar ‘”Shape’’ tussen
                                    staat. Klik hierop om de gecombineerde
                                    opgave in ‘’shapefile’’ formaat te
                                    downloaden.
                                </li>
                            </ol>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
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
                            <FlaskConical className="h-4 w-4" />
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
                                                        <div>Shapefile</div>
                                                        <div className="relative">
                                                            {fileNames.length >
                                                                0 && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="absolute top-2 right-2 h-6 w-6"
                                                                    onClick={() => {
                                                                        form.reset()
                                                                        setFileNames(
                                                                            [],
                                                                        )
                                                                        setFieldNames(
                                                                            [],
                                                                        )
                                                                        setHasAllRequiredFiles(
                                                                            false,
                                                                        )
                                                                    }}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            )}
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
                                                                    onChange={async (
                                                                        event,
                                                                    ) => {
                                                                        await handleFileChange(
                                                                            event,
                                                                            onChange,
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
                                                                    aria-label="Upload shapefile files by clicking or dragging and dropping"
                                                                    onKeyDown={(
                                                                        e,
                                                                    ) => {
                                                                        if (
                                                                            e.key ===
                                                                                "Enter" ||
                                                                            e.key ===
                                                                                " "
                                                                        ) {
                                                                            e.preventDefault()
                                                                            document
                                                                                .getElementById(
                                                                                    "file-upload",
                                                                                )
                                                                                ?.click()
                                                                        }
                                                                    }}
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
                                                                                {/* .shp,
                                                                                .shx,
                                                                                .dbf,
                                                                                .prj */}
                                                                            </div>
                                                                            <RequiredFilesStatus
                                                                                files={
                                                                                    form.getValues(
                                                                                        "shapefile",
                                                                                    ) ||
                                                                                    []
                                                                                }
                                                                                requiredExtensions={
                                                                                    requiredExtensions
                                                                                }
                                                                            />
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
                                            <NavLink
                                                to={`/farm/create/${b_id_farm}/${calendar}`}
                                                className="w-full"
                                            >
                                                <Button
                                                    className="w-full"
                                                    variant={"outline"}
                                                    disabled={isSubmitting}
                                                >
                                                    Terug
                                                </Button>
                                            </NavLink>
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

function RequiredFilesStatus({
    files,
    requiredExtensions,
}: {
    files: File[]
    requiredExtensions: string[]
}) {
    const uploadedExtensions = new Set(
        files.map((file) => getFileExtension(file.name)),
    )

    return (
        <div className="grid grid-cols-4 gap-x-4 mt-2 text-xs text-muted-foreground">
            {requiredExtensions.map((ext) => {
                const isUploaded = uploadedExtensions.has(ext)
                return (
                    <div
                        key={ext}
                        className={`flex items-center ${isUploaded ? "text-green-500" : "text-gray-500"}`}
                    >
                        {isUploaded ? (
                            <CheckCircle className="w-4 h-4 mr-1" />
                        ) : (
                            <Circle className="w-4 h-4 mr-1" />
                        )}
                        <span>{ext}</span>
                    </div>
                )
            })}
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
                const validMimeTypes = [
                    "application/octet-stream", // Common for .shp, .shx, .dbf
                    "application/x-dbf", // .dbf files
                    "text/plain", // .prj files
                ]
                return files.every(
                    (file) =>
                        validMimeTypes.includes(file.type) || file.type === "",
                )
            },
            {
                message:
                    "Een of meerdere bestanden hebben een ongeldig bestandstype.",
            },
        )
        .refine(
            (files) => {
                const extensions = files.map((file) =>
                    getFileExtension(file.name),
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

const getFileExtension = (filename: string): string => {
    return filename.slice(filename.lastIndexOf(".")).toLowerCase()
}
