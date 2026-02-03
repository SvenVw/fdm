import { useState, useEffect } from "react"
import { Dropzone } from "~/components/custom/dropzone"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { FileUp, Upload, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useFetcher } from "react-router"
import { Spinner } from "~/components/ui/spinner"

export function BulkSoilAnalysisUploadForm({ 
    onSuccess 
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

        if (fetcher.data) {
            // Check for success
            if (fetcher.data.analyses) {
                toast.success(`${files.length} analyses succesvol verwerkt`)
                onSuccess(fetcher.data.analyses)
            } 
            // Check for error (standard error format or custom)
            else if (fetcher.data.warning || fetcher.data.error) {
                 toast.error(fetcher.data.warning || fetcher.data.error || "Er is iets fout gegaan")
            }
        }
    }, [fetcher.data, fetcher.state, files.length, onSuccess])

    const removeFile = (index: number) => {
        const newFiles = [...files]
        newFiles.splice(index, 1)
        setFiles(newFiles)
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Upload bodemanalyses</CardTitle>
                <CardDescription>
                    Sleep meerdere pdf-bestanden hierheen om ze tegelijkertijd te laten analyseren.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Dropzone
                    name="soilAnalysisFiles"
                    accept=".pdf"
                    multiple
                    value={files}
                    onFilesChange={handleFilesChange}
                    className="h-48"
                >
                    <div className="flex flex-col items-center justify-center space-y-2">
                        <FileUp className="h-10 w-10 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                            Klik of sleep pdf-bestanden hierheen
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Maximaal 5MB per bestand
                        </p>
                    </div>
                </Dropzone>

                {files.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium">Geselecteerde bestanden ({files.length})</h3>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setFiles([])}
                                disabled={isUploading}
                            >
                                Alles verwijderen
                            </Button>
                        </div>
                        <ul className="divide-y border rounded-md max-h-60 overflow-y-auto">
                            {files.map((file, index) => (
                                <li key={`${file.name}-${index}`} className="flex items-center justify-between p-3">
                                    <div className="flex items-center space-x-3 overflow-hidden">
                                        <Upload className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                        <span className="text-sm truncate">{file.name}</span>
                                        <span className="text-xs text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-destructive"
                                        onClick={() => removeFile(index)}
                                        disabled={isUploading}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </li>
                            ))}
                        </ul>
                        
                        <Button 
                            className="w-full" 
                            onClick={handleUpload}
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <>
                                    <Spinner className="mr-2 h-4 w-4" />
                                    Analyseren...
                                </>
                            ) : (
                                "Start analyse"
                            )}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
