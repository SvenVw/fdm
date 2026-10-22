import type { Cultivation, Fertilizer } from "@nmi-agro/fdm-core"
import type { ApplicationMethods } from "@nmi-agro/fdm-data"
import { X } from "lucide-react"
import { useMemo, useState } from "react"
import { type Navigation, useFetcher, useLocation, useNavigation } from "react-router"
import type { FieldFertilizerFormValues } from "~/components/blocks/fertilizer-applications/formschema"
import type {
  FertilizerApplication,
  FertilizerOption,
} from "~/components/blocks/fertilizer-applications/types.d"
import { FertilizerApplicationForm } from "~/components/blocks/fertilizer-applications/form"
import { CultivationSelector } from "~/components/custom/cultivation-selector"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { useCalendarStore } from "~/store/calendar"
import { useFieldFertilizerFormStore } from "~/store/field-fertilizer-form"
import type { BulkCurrentState, BulkFieldOption } from "./types"
import { FieldApplicationsTable } from "./field-applications-table"
import { useImpactState } from "./impact-state"
import { ImpactSummaryCard, NormOutcomeList } from "./impact-summary"
import {
  type PreviewChanges,
  type PreviewFormValues,
  parsePreviewValues,
  useDebouncedPreviewValues,
} from "./use-impact-preview"

const FORM_ID = "field-fertilizer-application-form"

/**
 * The fertilizer page of a single field.
 *
 * The saved applications are listed prominently in a table with the nutrients they supply. The
 * form to add an application is always visible, so the user does not have to open a dialog.
 * Choosing "Wijzigen" on an application loads it into the same form. While the form is filled in,
 * the impact blocks show the farm norms, the advice and the nitrogen balance of the field before
 * and after the change. Nothing is saved until the form is submitted.
 *
 * @param props.field - The field.
 * @param props.fieldNames - Names of all fields of the farm, for messages about other fields.
 * @param props.current - The streamed current state, from `loadBulkCurrentState` for this field.
 * @param props.cultivations - The cultivations of the field, to choose the one the advice is for.
 * @param props.activeCultivationId - The cultivation the advice is for.
 */
export function FieldFertilizerPage({
  b_id_farm,
  calendar,
  field,
  fieldNames,
  fertilizerOptions,
  fertilizers,
  fertilizerApplications,
  applicationMethodOptions,
  current,
  cultivations,
  activeCultivationId,
  canCreate,
  canModify,
}: {
  b_id_farm: string
  calendar: string
  field: BulkFieldOption
  fieldNames: Map<string, string>
  fertilizerOptions: FertilizerOption[]
  fertilizers: Fertilizer[]
  fertilizerApplications: FertilizerApplication[]
  applicationMethodOptions: { value: ApplicationMethods; label: string }[]
  current: BulkCurrentState
  cultivations: Cultivation[]
  activeCultivationId?: string
  canCreate: boolean
  canModify: Record<string, boolean>
}) {
  const location = useLocation()
  const navigation = useNavigation()
  const fetcher = useFetcher()
  const { calendar: calendarStore } = useCalendarStore()
  const loadDraft = useFieldFertilizerFormStore((s) => s.load)

  // Start editing the application of a saved draft, for example after adding a new fertilizer
  const [editingId, setEditingId] = useState<string | undefined>(() => {
    const draft = loadDraft(b_id_farm, field.b_id, calendarStore)
    const app = draft?.p_app_id
      ? fertilizerApplications.find((a) => a.p_app_id === draft.p_app_id)
      : undefined
    return app && (canModify[app.p_app_id] ?? true) ? app.p_app_id : undefined
  })
  const editing = fertilizerApplications.find((app) => app.p_app_id === editingId)

  // After a save, return to an empty form for the next application
  const isSubmitting = navigation.state !== "idle" && Boolean(navigation.formData)
  const [formKey, setFormKey] = useState(0)
  const [wasSubmitting, setWasSubmitting] = useState(false)
  if (isSubmitting && !wasSubmitting) setWasSubmitting(true)
  if (!isSubmitting && wasSubmitting && navigation.state === "idle") {
    setWasSubmitting(false)
    setEditingId(undefined)
    setFormKey((key) => key + 1)
  }

  const [formValues, setFormValues] = useState<PreviewFormValues>({})
  const debounced = useDebouncedPreviewValues(formValues)
  const changes = useMemo((): PreviewChanges | null => {
    const values = parsePreviewValues(debounced.values)
    if (!values) return null
    return { [field.b_id]: { removeAppIds: editing ? [editing.p_app_id] : [], add: [values] } }
  }, [debounced.values, field.b_id, editing])

  const fields = useMemo(() => [field], [field])
  const included = useMemo(() => new Set([field.b_id]), [field.b_id])
  const state = useImpactState({
    current,
    fields,
    included,
    fieldNames,
    changes,
    pending: debounced.pending,
  })

  const formApplication: Partial<FieldFertilizerFormValues> | null = editing
    ? {
        p_app_id: editing.p_app_id,
        p_id: editing.p_id,
        p_app_method: editing.p_app_method ?? undefined,
        p_app_amount_display: editing.p_app_amount_display ?? undefined,
        p_app_date: editing.p_app_date,
      }
    : null

  const startEditing = (application: FertilizerApplication) => {
    setEditingId(application.p_app_id)
    setFormKey((key) => key + 1)
    // On small screens the form is above the table, so bring it into view
    document.getElementById(FORM_ID)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }
  const stopEditing = () => {
    setEditingId(undefined)
    setFormKey((key) => key + 1)
  }
  const handleDelete = (p_app_id: string) => {
    if (fetcher.state !== "idle") return
    if (p_app_id === editingId) stopEditing()
    void fetcher.submit({ p_app_id }, { method: "DELETE" })
  }

  const base = `/farm/${b_id_farm}/${calendar}`

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(20rem,24rem)_minmax(0,1fr)]">
      <div className="xl:sticky xl:top-4">
        {(canCreate || editing) && (
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div className="space-y-1.5">
                <CardTitle>{editing ? "Gift wijzigen" : "Gift toevoegen"}</CardTitle>
                <CardDescription>
                  Het effect op gebruiksruimte, advies en stikstofbalans ziet u direct, nog voordat
                  u opslaat.
                </CardDescription>
              </div>
              {editing && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={stopEditing}
                  aria-label="Wijzigen annuleren"
                >
                  <X className="size-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <FertilizerApplicationForm
                key={`${editingId ?? "new"}-${formKey}`}
                id={FORM_ID}
                options={fertilizerOptions}
                action={location.pathname}
                navigation={navigation as unknown as Navigation}
                b_id_farm={b_id_farm}
                b_id_or_b_lu_catalogue={field.b_id}
                fertilizerApplication={formApplication}
                fieldsClassName="md:grid-cols-1"
                submitLabel={editing ? "Wijziging opslaan" : "Gift toevoegen"}
                onValuesChange={setFormValues}
                footerSlot={
                  <div className="space-y-2">
                    {state.previewMessage && (
                      <p className="text-muted-foreground text-sm">{state.previewMessage}</p>
                    )}
                    <NormOutcomeList outcomes={state.normOutcomes} />
                  </div>
                }
              />
            </CardContent>
          </Card>
        )}
      </div>
      <div className="min-w-0 space-y-6">
        <FieldApplicationsTable
          calendar={calendar}
          applications={fertilizerApplications}
          fertilizers={fertilizers}
          applicationMethodOptions={applicationMethodOptions}
          canModify={canModify}
          editingId={editingId}
          onEdit={startEditing}
          onDelete={handleDelete}
          isBusy={fetcher.state !== "idle" || isSubmitting}
        />
        <ImpactSummaryCard
          state={state}
          base={base}
          normsField={field.b_id}
          advice={{
            title: "Advies perceel",
            basis: "Dit perceel, per ha",
            detailHref: `${base}/nutrient_advice/${field.b_id}`,
            headerAction:
              cultivations.length > 0 && activeCultivationId ? (
                <CultivationSelector
                  cultivations={cultivations}
                  selectedCultivationId={activeCultivationId}
                  variant="icon"
                />
              ) : undefined,
          }}
          balance={{
            title: "Stikstofbalans perceel",
            basis: field.b_bufferstrip
              ? "Geen stikstofbalans voor een bufferstrook"
              : "Dit perceel, in kg N/ha",
            detailHref: `${base}/balance/nitrogen/${field.b_id}`,
          }}
        />
      </div>
    </div>
  )
}
