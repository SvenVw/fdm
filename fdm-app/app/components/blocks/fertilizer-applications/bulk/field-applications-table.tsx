import type { Fertilizer } from "@nmi-agro/fdm-core"
import type { ApplicationMethods } from "@nmi-agro/fdm-data"
import { calculateDose } from "@nmi-agro/fdm-calculator/browser"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { Pencil, Trash2 } from "lucide-react"
import { useMemo } from "react"
import type { FertilizerApplication } from "~/components/blocks/fertilizer-applications/types.d"
import { getApplicationAmountUnitLabel } from "~/components/blocks/fertilizer-applications/utils"
import { FertilizerIcon } from "~/components/custom/fertilizer-icon"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog"
import { Badge } from "~/components/ui/badge"
import { Button, buttonVariants } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip"
import { cn } from "~/lib/utils"
import { formatKg } from "./status"

/**
 * The saved fertilizer applications of a field in a table, with the nutrients each application
 * supplies (workable N, P₂O₅ and K₂O in kg/ha).
 *
 * Applications can be changed or removed from the table. The application that is being changed
 * in the form is highlighted.
 */
export function FieldApplicationsTable({
  calendar,
  applications,
  fertilizers,
  applicationMethodOptions,
  canModify,
  editingId,
  onEdit,
  onDelete,
  isBusy,
}: {
  calendar: string
  applications: FertilizerApplication[]
  fertilizers: Fertilizer[]
  applicationMethodOptions: { value: ApplicationMethods; label: string }[]
  canModify: Record<string, boolean>
  editingId?: string
  onEdit: (application: FertilizerApplication) => void
  onDelete: (p_app_id: string) => void
  isBusy: boolean
}) {
  const sorted = useMemo(
    () => [...applications].sort((a, b) => a.p_app_date.getTime() - b.p_app_date.getTime()),
    [applications],
  )

  // Nutrients supplied per application
  const doses = useMemo(() => {
    try {
      return calculateDose({ applications, fertilizers })
    } catch {
      return undefined
    }
  }, [applications, fertilizers])
  const doseById = new Map(doses?.applications.map((dose) => [dose.p_app_id, dose]))

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2">
            Bemestingen in {calendar}
            <Badge variant="secondary">{applications.length}</Badge>
          </CardTitle>
          <CardDescription>
            Opgeslagen giften op dit perceel, met de aanvoer per gift in kg per ha.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nog geen bemestingen op dit perceel. Een opgeslagen gift verschijnt hier.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Meststof</TableHead>
                  <TableHead className="text-right">Hoeveelheid</TableHead>
                  <TableHead>Methode</TableHead>
                  <TableHead className="text-right">
                    <Tooltip>
                      <TooltipTrigger className="cursor-help underline decoration-dotted underline-offset-4">
                        N
                      </TooltipTrigger>
                      <TooltipContent>Werkzame stikstof, kg N/ha</TooltipContent>
                    </Tooltip>
                  </TableHead>
                  <TableHead className="text-right">P₂O₅</TableHead>
                  <TableHead className="text-right">K₂O</TableHead>
                  <TableHead className="w-24">
                    <span className="sr-only">Acties</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((application) => {
                  const fertilizer = fertilizers.find((f) => f.p_id === application.p_id)
                  const dose = doseById.get(application.p_app_id)
                  const editable = canModify[application.p_app_id] ?? true
                  const isEditing = application.p_app_id === editingId
                  const date = format(application.p_app_date, "PP", { locale: nl })
                  return (
                    <TableRow
                      key={application.p_app_id}
                      data-state={isEditing ? "selected" : undefined}
                      className={cn(isEditing && "bg-muted")}
                    >
                      <TableCell className="whitespace-nowrap">{date}</TableCell>
                      <TableCell className="max-w-56">
                        <span className="flex items-center gap-2">
                          {fertilizer && (
                            <FertilizerIcon
                              p_type={fertilizer.p_type}
                              p_type_rvo={fertilizer.p_type_rvo}
                            />
                          )}
                          <span className="truncate font-medium">{application.p_name_nl}</span>
                          {isEditing && <Badge variant="outline">Wordt gewijzigd</Badge>}
                        </span>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap tabular-nums">
                        {application.p_app_amount_display !== null
                          ? `${application.p_app_amount_display.toLocaleString("nl-NL", { maximumFractionDigits: 2 })} ${getApplicationAmountUnitLabel(application.p_app_amount_unit)}`
                          : "–"}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-40 truncate">
                        {applicationMethodOptions.find((x) => x.value === application.p_app_method)
                          ?.label ?? "Onbekend"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {dose ? formatKg(dose.p_dose_nw) : "–"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {dose ? formatKg(dose.p_dose_p) : "–"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {dose ? formatKg(dose.p_dose_k) : "–"}
                      </TableCell>
                      <TableCell>
                        {editable && (
                          <span className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={`Gift van ${date} wijzigen`}
                              disabled={isBusy || isEditing}
                              onClick={() => onEdit(application)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Gift van ${date} verwijderen`}
                                  disabled={isBusy}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Gift verwijderen?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    De gift van {application.p_name_nl} op {date} wordt verwijderd.
                                    {dose &&
                                      ` De aanvoer op dit perceel daalt daarmee met ${formatKg(dose.p_dose_nw)} kg werkzame N, ${formatKg(dose.p_dose_p)} kg P₂O₅ en ${formatKg(dose.p_dose_k)} kg K₂O per ha.`}{" "}
                                    Dit kan niet ongedaan worden gemaakt.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuleren</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => onDelete(application.p_app_id)}
                                    className={buttonVariants({ variant: "destructive" })}
                                  >
                                    Verwijderen
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
