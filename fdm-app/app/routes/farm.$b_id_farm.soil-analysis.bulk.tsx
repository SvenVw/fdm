import { SidebarInset } from "~/components/ui/sidebar"
import { Header } from "~/components/blocks/header/base"
import { HeaderFarm } from "~/components/blocks/header/farm"
import { FarmTitle } from "~/components/blocks/farm/farm-title"
import { FarmContent } from "~/components/blocks/farm/farm-content"
import { getFarm, getFarms, getFields, getSoilParametersDescription, addSoilAnalysis } from "@svenvw/fdm-core"
import { fdm } from "~/lib/fdm.server"
import { getSession } from "~/lib/auth.server"
import { handleLoaderError, handleActionError } from "~/lib/error"
import { data, type LoaderFunctionArgs, type ActionFunctionArgs, useLoaderData, useNavigate, useNavigation, useSubmit } from "react-router"
import { useState } from "react"
import { BulkSoilAnalysisUploadForm } from "~/components/blocks/soil/bulk-upload-form"
import { BulkSoilAnalysisReview, type ProcessedAnalysis } from "~/components/blocks/soil/bulk-upload-review"
import { extractBulkSoilAnalyses } from "~/integrations/nmi"
import { booleanPointInPolygon } from "@turf/turf"
import { Spinner } from "~/components/ui/spinner"
import { redirectWithSuccess } from "remix-toast"

export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw data("Farm ID is required", { status: 400 })
        }

        const session = await getSession(request)
        const farm = await getFarm(fdm, session.principal_id, b_id_farm)
        const farms = await getFarms(fdm, session.principal_id)
        const fields = await getFields(fdm, session.principal_id, b_id_farm)

        const farmOptions = farms.map((farm) => ({
            b_id_farm: farm.b_id_farm,
            b_name_farm: farm.b_name_farm,
        }))

        // Get soil parameter descriptions
        const soilParameterDescription = getSoilParametersDescription()

        return {
            b_id_farm,
            b_name_farm: farm.b_name_farm,
            farmOptions,
            fields: fields.map(f => ({ b_id: f.b_id, b_name: f.b_name, geometry: f.b_geometry })),
            soilParameterDescription,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

export async function action({ request, params }: ActionFunctionArgs) {
    try {
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) throw data("Farm ID is required", { status: 400 })

        const session = await getSession(request)
        const formData = await request.formData()
        
        // Handle initial upload to NMI
        if (formData.has("soilAnalysisFile")) {
            const analyses = await extractBulkSoilAnalyses(formData)
            return data({ analyses })
        }

        // Handle final save
        if (formData.has("matches")) {
            const matchesRaw = formData.get("matches") as string
            const analysesDataRaw = formData.get("analysesData") as string
            
            const matches = JSON.parse(matchesRaw)
            const analysesData = JSON.parse(analysesDataRaw)

            await Promise.all(
                matches.map(async (match: { analysisId: string; fieldId: string }) => {
                    const analysis = analysesData.find((a: any) => a.id === match.analysisId)
                    if (analysis) {
                        // Strip UI-only properties before saving to DB
                        const { id, location, ...dbAnalysis } = analysis

                        return addSoilAnalysis(
                            fdm,
                            session.principal_id,
                            null,
                            analysis.a_source || "other",
                            match.fieldId,
                            Number(analysis.a_depth_lower),
                            new Date(analysis.b_sampling_date),
                            dbAnalysis,
                            Number(analysis.a_depth_upper),
                        )
                    }
                }),
            )
            
            return redirectWithSuccess(`/farm/${b_id_farm}`, {
                message: "Bodemanalyses succesvol opgeslagen",
            })
        }

        return data({ message: "Invalid request" }, { status: 400 })
    } catch (error) {
        throw handleActionError(error)
    }
}

export default function BulkSoilAnalysisUploadPage() {
    const { b_id_farm, b_name_farm, farmOptions, fields, soilParameterDescription } = useLoaderData<typeof loader>()
    const [processedAnalyses, setProcessedAnalyses] = useState<ProcessedAnalysis[]>([])
    const [step, setStep] = useState<"upload" | "review">("upload")
    const navigate = useNavigate()
    const navigation = useNavigation()
    const submit = useSubmit()

    const isSaving = navigation.state === "submitting" && navigation.formData?.has("matches")

    const handleUploadSuccess = (analyses: any[]) => {
        // Perform geometry matching
        const matchedAnalyses = analyses.map(analysis => {
            let matchedFieldId = ""
            
            if (analysis.location) {
                const fieldMatch = fields.find(field => {
                    if (!field.geometry) return false
                    try {
                        return booleanPointInPolygon(analysis.location, field.geometry)
                    } catch (e) {
                        return false
                    }
                })
                if (fieldMatch) matchedFieldId = fieldMatch.b_id
            }

            // If no geometry match, try name match
            if (!matchedFieldId) {
                const fieldMatch = fields.find(field => 
                    field.b_name.toLowerCase() === analysis.filename.replace(/\.pdf$/i, '').toLowerCase()
                )
                if (fieldMatch) matchedFieldId = fieldMatch.b_id
            }

            return {
                ...analysis,
                matchedFieldId
            }
        })

        setProcessedAnalyses(matchedAnalyses)
        setStep("review")
    }

    const handleSave = (matches: { analysisId: string, fieldId: string }[]) => {
        const formData = new FormData()
        // Filter out "none" selections
        const validMatches = matches.filter(m => m.fieldId !== "none" && m.fieldId !== "")
        formData.append("matches", JSON.stringify(validMatches))
        formData.append("analysesData", JSON.stringify(processedAnalyses))

        submit(formData, { method: "post" })
    }

    return (
        <SidebarInset>
            <Header
                action={{
                    to: `/farm/${b_id_farm}`,
                    label: "Terug naar dashboard",
                    disabled: false,
                }}
            >
                <HeaderFarm
                    b_id_farm={b_id_farm}
                    farmOptions={farmOptions}
                />
            </Header>
            <main>
                <FarmTitle
                    title="Upload bodemanalyses"
                    description={
                        step === "upload" 
                        ? "Upload meerdere bodemanalyses tegelijkertijd en koppel ze aan je percelen."
                        : "Controleer de resultaten en bevestig de koppelingen."
                    }
                />
                <FarmContent>
                    <div className="space-y-6">
                        {isSaving ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                <Spinner className="h-8 w-8 text-primary" />
                                <p className="text-muted-foreground">Opslaan en koppelen...</p>
                            </div>
                        ) : step === "upload" ? (
                            <BulkSoilAnalysisUploadForm onSuccess={handleUploadSuccess} />
                        ) : (
                            <BulkSoilAnalysisReview 
                                analyses={processedAnalyses} 
                                fields={fields} 
                                soilParameterDescription={soilParameterDescription}
                                onSave={handleSave}
                                onCancel={() => setStep("upload")}
                            />
                        )}
                    </div>
                </FarmContent>
            </main>
        </SidebarInset>
    )
}
