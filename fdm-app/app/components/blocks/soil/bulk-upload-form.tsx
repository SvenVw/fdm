import { useState, useEffect } from "react"
import { useFetcher } from "react-router"
import { FileText, Upload, Trash2, X, FileUp } from "lucide-react"
import { Dropzone } from "~/components/custom/dropzone"
import { Button } from "~/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { Spinner } from "~/components/ui/spinner"
import { ScrollArea } from "~/components/ui/scroll-area"
import { cn } from "~/lib/utils"

export function BulkSoilAnalysisUploadForm({
    onSuccess,
}: {
    onSuccess: (data: any[]) => void
}) {
    const [files, setFiles] = useState<File[]>([])
    const fetcher = useFetcher()
    const isUploading = fetcher.state !== "idle"

    const handleFilesChange = (newFiles: File[]) => {
        setFiles(newFiles)
    }

    const handleUpload = () => {
        if (files.length === 0) return

        const formData = new FormData()
        for (const file of files) {
            formData.append("soilAnalysisFile", file)
        }

        fetcher.submit(formData, {
            method: "POST",
            encType: "multipart/form-data",
        })
    }

    useEffect(() => {
        if (isUploading) return

        if (fetcher.data?.analyses) {
            onSuccess(fetcher.data.analyses)
        }
    }, [fetcher.data, isUploading, onSuccess])

    const removeFile = (index: number) => {
        const newFiles = [...files]
        newFiles.splice(index, 1)
        setFiles(newFiles)
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 B"
        const k = 1024
        const sizes = ["B", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Bodemanalyses uploaden</CardTitle>
                <CardDescription>
                    Sleep PDF-bestanden hierheen om ze te analyseren en te
                    koppelen aan percelen.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div
                    className={cn(
                        "grid gap-6",
                        files.length > 0 ? "lg:grid-cols-2" : "",
                    )}
                >
                    {/* Dropzone Column */}
                    <div className="flex flex-col h-full">
                        <Dropzone
                            name="soilAnalysisFiles"
                            accept=".pdf"
                            multiple
                            value={files}
                            onFilesChange={handleFilesChange}
                            allowReset={false}
                            className={cn(
                                "w-full transition-all duration-200 border-2",
                                files.length > 0
                                    ? "h-64 lg:h-full min-h-[300px]"
                                    : "h-64",
                            )}
                        >
                            <div className="flex flex-col items-center justify-center space-y-4 text-center px-4">
                                <div
                                    className={cn(
                                        "flex items-center justify-center rounded-full bg-muted transition-colors",
                                        files.length > 0
                                            ? "h-12 w-12"
                                            : "h-16 w-16",
                                    )}
                                >
                                    <Upload
                                        className={cn(
                                            "text-muted-foreground",
                                            files.length > 0
                                                ? "h-6 w-6"
                                                : "h-8 w-8",
                                        )}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-foreground">
                                        {files.length > 0
                                            ? "Voeg meer bestanden toe"
                                            : "Sleep bestanden hierheen"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        PDF, max 5MB per bestand
                                    </p>
                                </div>
                            </div>
                        </Dropzone>
                    </div>

                    {/* File List Column */}
                    {files.length > 0 && (
                        <div className="flex flex-col h-full min-h-[300px]">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-medium leading-none flex items-center gap-2">
                                    Geselecteerde bestanden{" "}
                                    <span className="text-muted-foreground text-xs font-normal">
                                        ({files.length})
                                    </span>
                                </h4>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setFiles([])}
                                    disabled={isUploading}
                                    className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2 className="mr-2 h-3 w-3" />
                                    Alles wissen
                                </Button>
                            </div>

                            <div className="flex-1 rounded-md border relative flex flex-col overflow-hidden">
                                <ScrollArea className="flex-1 h-[300px] lg:h-auto">
                                    <div className="p-3 space-y-2">
                                        {files.map((file, index) => (
                                            <div
                                                key={`${file.name}-${index}`}
                                                className="flex items-center justify-between rounded-md border bg-card p-2 shadow-sm group"
                                            >
                                                <div className="flex items-center space-x-3 overflow-hidden">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted/50 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                                                        <FileText className="h-4 w-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p
                                                            className="truncate text-sm font-medium leading-none"
                                                            title={file.name}
                                                        >
                                                            {file.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {formatFileSize(
                                                                file.size,
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() =>
                                                        removeFile(index)
                                                    }
                                                    disabled={isUploading}
                                                >
                                                    <X className="h-4 w-4" />
                                                    <span className="sr-only">
                                                        Verwijder bestand
                                                    </span>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>

                            <div className="pt-4 mt-auto flex justify-end">
                                <Button
                                    onClick={handleUpload}
                                    disabled={isUploading}
                                    className="w-full lg:w-auto min-w-[140px]"
                                >
                                    {isUploading ? (
                                        <>
                                            <Spinner className="mr-2 h-4 w-4 animate-spin" />
                                            Verwerken...
                                        </>
                                    ) : (
                                        <>
                                            <FileUp className="mr-2 h-4 w-4" />
                                            Start Analyse
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
