"use client"

import { X } from "lucide-react"
import type { InputHTMLAttributes, ReactNode } from "react"
import {
    createContext,
    useContext,
    useEffect,
    useId,
    useRef,
    useState,
} from "react"
import { toast as notify } from "sonner"
import { Button } from "~/components/ui/button"
import { cn } from "~/lib/utils"

type DropzoneContextType = {
    files?: File[]
    error?: string
    accept?: string[]
    maxSize?: number | undefined
    minSize?: number | undefined
    multiple?: boolean
}

const DropzoneContext = createContext<DropzoneContextType | undefined>(
    undefined,
)

const getFileExtension = (filename: string): string => {
    return filename.slice(filename.lastIndexOf(".")).toLowerCase()
}

export type DropzoneProps = {
    ref: (instance: any) => void
    value?: File[]
    accept?: string | string[]
    name: string
    className?: string
    allowReset?: boolean
    minSize?: number
    maxSize?: number
    multiple?: boolean
    required?: boolean
    disabled?: boolean
    readonly?: boolean
    error?: string | undefined
    onBlur?: InputHTMLAttributes<HTMLInputElement>["onBlur"]
    onFilesChange?: (files: File[]) => void
    mergeFiles?: (
        oldFiles: File[],
        newFiles: File[],
    ) => Promise<[File[] | null, string?]> | [File[] | null, string?]
    children?: ReactNode
}

export const Dropzone = ({
    name,
    accept,
    maxSize,
    minSize,
    multiple,
    required,
    disabled,
    className,
    children,
    allowReset = true,
    value: propFiles,
    error: propError,
    ref,
    onBlur,
    onFilesChange: propSetFiles,
    mergeFiles = (oldFiles, newFiles) => [
        [
            ...newFiles.reduce((combined, newFile) => {
                combined.add(newFile)
                return combined
            }, new Set<File>(oldFiles)),
        ],
    ],
}: DropzoneProps) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const [internalFiles, setInternalFiles] = useState<File[]>([])
    const [error, setError] = useState<string>()
    const labelId = useId()
    const acceptedFileExtensions =
        typeof accept === "string" ? accept.split(",") : accept

    const files = propFiles ?? internalFiles
    const setFiles = propSetFiles ?? setInternalFiles
    const fileNames = files.map((f) => f.name)

    useEffect(() => {
        setError(propError)
    }, [propError])

    useEffect(() => {
        if (files.length === 0 && inputRef.current) {
            inputRef.current.value = null
        }
    }, [files])

    const handleFilesSet = async (oldFiles: File[], newFiles: File[]) => {
        const [finalFiles, error] = await mergeFiles(oldFiles, newFiles)
        if (finalFiles) {
            setFiles(finalFiles)
        }
        setError(error)
        return finalFiles ?? files
    }

    const handleFilesClear = async () => {
        setFiles([])
    }

    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault()
    }

    const checkNewFile = (file: File) => {
        const extension = getFileExtension(file.name)
        const isValid =
            !acceptedFileExtensions ||
            acceptedFileExtensions.includes(extension)
        if (!isValid) {
            notify.warning(`Bestandstype niet ondersteund: ${extension}`, {
                id: `invalid-file-type-${file.name}`,
            })
        }
        return isValid
    }

    const handleFileChange = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        if (event.target.files) {
            const newFiles = Array.from(event.target.files)
            const validNewFiles = newFiles.filter(checkNewFile)

            if (validNewFiles.length === 0) return

            await handleFilesSet(files, validNewFiles)
        }
    }

    const handleDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault()
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const newFiles = Array.from(e.dataTransfer.files)
            const validNewFiles = newFiles.filter(checkNewFile)

            if (validNewFiles.length === 0) return

            const finalFiles = await handleFilesSet(files, validNewFiles)

            if (inputRef.current) {
                const container = new DataTransfer()
                finalFiles.forEach((f) => {
                    container.items.add(f)
                })
                inputRef.current.files = container.files
            }
            e.dataTransfer.clearData()
        }
    }

    return (
        <DropzoneContext.Provider
            key={JSON.stringify(fileNames)}
            value={{
                files,
                accept: acceptedFileExtensions,
                error,
                maxSize,
                minSize,
                multiple,
            }}
        >
            <div className="relative">
                <input
                    id={labelId}
                    type="file"
                    name={name}
                    onBlur={onBlur}
                    onChange={(event) => {
                        handleFileChange(event)
                    }}
                    ref={inputRef}
                    placeholder=""
                    className="hidden"
                    accept={
                        typeof accept === "string" ? accept : accept?.join(",")
                    }
                    multiple={multiple}
                    required={required}
                    disabled={disabled}
                />
                <label
                    tabIndex={0}
                    className={cn(
                        "flex-col items-center justify-center w-full h-32 rounded-md border border-dashed border-muted-foreground/25 px-6 py-4 text-center transition-colors hover:bg-muted/25",
                        disabled ? "hidden" : "flex",
                        className,
                    )}
                    ref={ref}
                    htmlFor={labelId}
                    aria-label="Upload shapefile files by clicking or dragging and dropping"
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            inputRef.current?.click()
                        }
                    }}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    {children}
                </label>
                {fileNames.length > 0 && allowReset && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => handleFilesClear()}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </DropzoneContext.Provider>
    )
}

export const useDropzoneContext = () => {
    const context = useContext(DropzoneContext)

    if (!context) {
        throw new Error("useDropzoneContext must be used within a Dropzone")
    }

    return context
}
