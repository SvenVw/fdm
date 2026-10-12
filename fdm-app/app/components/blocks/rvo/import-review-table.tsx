import type { Field, FieldGeometry } from "@nmi-agro/fdm-core"
import type { RvoImportReviewItem } from "@nmi-agro/fdm-rvo/types"
import { getItemId } from "@nmi-agro/fdm-rvo/utils"
import {
  type ColumnDef,
  columnVisibilityFeature,
  FlexRender,
  tableFeatures,
  useTable,
} from "@tanstack/react-table"
import { area } from "@turf/area"
import { format as libFormatDate, parseISO } from "date-fns"
import { Archive, ArrowLeftRight, Check, Info, Pencil, Plus, Trash2, X } from "lucide-react"
import { ReactNode, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react"
import { clientConfig } from "@/app/lib/config"
import { useActiveTableFormStore } from "@/app/store/active-table-form"
import { DatePicker } from "~/components/custom/date-picker-v2"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Checkbox } from "~/components/ui/checkbox"
import { Input } from "~/components/ui/input"
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip"
import { acquiringMethodOptions } from "~/lib/constants"
import { cn } from "~/lib/utils"

type ReviewItem = RvoImportReviewItem<Field>
type ReviewItemFieldKey =
  | "b_name"
  | "b_geometry"
  | "b_lu_catalogue"
  | "b_start"
  | "b_end"
  | "b_acquiring_method"
  | "b_bufferstrip"
type ReviewItemFieldType = "date" | "enum" | "string" | "boolean" | "geometry"

type SubmittedFieldInit = {
  b_name: string
  b_id_source: string
  b_geometry: FieldGeometry
  b_lu_catalogue: string | null
  b_start: Date | string
  b_end: Date | string | null
  b_acquiring_method: (typeof acquiringMethodOptions)[number]["value"]
  b_bufferstrip: boolean
}

export interface ImportReviewFlags {
  b_bufferstrip_info_available?: boolean
}

interface ImportReviewTableMeta {
  canModify: boolean
  calendar: string
  flags?: ImportReviewFlags
  cultivationOptions: { value: string; label: string }[]
  getUserChoice(itemId: string, key: ReviewItemFieldKey): any
  setUserChoice(itemId: string, key: ReviewItemFieldKey, value: any): void
  fieldsToRemove: Set<string>
  setFieldToRemove(itemId: string, remove: boolean): void
  fieldsToAdd: Set<string>
  setFieldToAdd(itemId: string, add: boolean): void
}

const importReviewTableFeatures = tableFeatures({
  columnVisibilityFeature: columnVisibilityFeature,
  tableMeta: {} as ImportReviewTableMeta,
})

interface RvoImportReviewTableProps extends Omit<ImportReviewTableMeta, "canModify"> {
  data: ReviewItem[]
}

function formatDate(dateString?: string | Date | null) {
  if (!dateString) return "-"
  try {
    const date = typeof dateString === "string" ? parseISO(dateString) : dateString
    return libFormatDate(date, "dd-MM-yyyy")
  } catch {
    return dateString.toString()
  }
}

function formatArea(geometry: FieldGeometry) {
  if (!geometry) return "-"
  const a = area(geometry)
  return `${(a / 10000).toFixed(2)} ha`
}

function compare(type: ReviewItemFieldType, a: any, b: any): true | false {
  const datesEqual =
    type === "date"
      ? a === b ||
        ((typeof a === "string" || a instanceof Date) &&
          (typeof b === "string" || b instanceof Date) &&
          !Number.isNaN(new Date(a).getTime()) &&
          !Number.isNaN(new Date(b).getTime()) &&
          new Date(a).getTime() === new Date(b).getTime())
      : false
  const booleansEqual = type === "boolean" ? a === b : false
  const enumsEqual = type === "enum" ? a === b : false
  const stringsEqual = type === "string" ? a === b : false
  const geometriesEqual = type === "geometry" ? a === b : false

  return !!(booleansEqual || datesEqual || enumsEqual || stringsEqual || geometriesEqual)
}

function format(
  type: ReviewItemFieldType,
  value: any,
  options?: { value: string; label: string }[],
): string {
  if (type === "geometry" && typeof value === "string") {
    // Should not be used
    return "Perceelgeometrie"
  }

  if ((type === "date" && typeof value === "string") || value instanceof Date) {
    return formatDate(value)
  }

  if (type === "string" && typeof value === "string") {
    return value
  }

  if (type === "enum" && typeof value === "string") {
    return options?.find((x) => x.value === value)?.label ?? value
  }

  if (type === "boolean" && typeof value !== "undefined") {
    return value ? "Ja" : "Nee"
  }

  return "-"
}

function ActionItem({
  label,
  selected,
  badge,
}: {
  label: string
  selected?: boolean
  badge?: string
}) {
  return (
    <>
      {typeof badge === "string" && (
        <Badge
          variant="outline"
          className="text-muted-foreground border-border h-5 min-w-[45px] justify-center px-1 text-[10px]"
        >
          {clientConfig.name}
        </Badge>
      )}
      <span
        className={cn(
          "text-sm",
          typeof selected !== "undefined" &&
            !selected &&
            "decoration-muted-foreground/50 text-muted-foreground line-through",
          typeof selected !== "undefined" && selected && "font-bold",
        )}
      >
        {label}
      </span>
    </>
  )
}

function ActionInput({
  type,
  options,
  value,
  onChange,
  setInputActive,
}: {
  type: ReviewItemFieldType
  options?: { value: string; label: string }[]
  value: any
  onChange: (value: any) => void
  inputActive: boolean
  setInputActive: (active: boolean) => void
}) {
  const [selectOpen, setSelectOpen] = useKeyedState(options, () => true)
  if (type === "enum" && options) {
    return (
      <Select
        open={selectOpen}
        onOpenChange={(open) => {
          setSelectOpen(open)
          if (!open) {
            setInputActive(false)
          }
        }}
        value={value}
        onValueChange={(value) => {
          onChange?.(value)
          setInputActive(false)
        }}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options?.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  if (type === "date" && options) {
    return (
      <DatePicker
        label={undefined}
        field={{
          onChange: onChange,
          onBlur: () => setInputActive(false),
          value: value,
          disabled: false,
          name: "date",
          ref: () => {},
        }}
        fieldState={{
          invalid: false,
          isTouched: false,
          isDirty: false,
          isValidating: false,
          error: undefined,
        }}
      />
    )
  }

  if (type === "boolean") {
    return (
      <label className="text-muted-foreground flex flex-row items-center gap-1">
        <Checkbox checked={value} onCheckedChange={onChange} />
        <span className="align-top">{value ? "Ja" : "Nee"}</span>
      </label>
    )
  }

  if (type === "geometry") {
    return "niet geïmplementeerd"
  }

  return (
    <Input
      value={value ?? ""}
      onChange={(e) => {
        onChange(e.currentTarget.value)
      }}
    />
  )
}

// Helper to render diff cells
function ActionCell({
  id,
  name,
  status,
  type,
  options,
  local,
  remote,
  formattedLocal,
  formattedRemote,
  allowCustomValue,
  getUserChoice,
  setUserChoice,
}: {
  id: string
  name: ReviewItemFieldKey
  status: string
  type: ReviewItemFieldType
  options?: { value: string; label: string }[]
  local: any
  remote: any
  formattedLocal?: string
  formattedRemote?: string
  allowCustomValue: boolean
  getUserChoice: ImportReviewTableMeta["getUserChoice"]
  setUserChoice: ImportReviewTableMeta["setUserChoice"]
}) {
  const userChoice = getUserChoice(id, name)
  const value = typeof userChoice !== "undefined" ? userChoice : local
  const activeForm = useActiveTableFormStore((store) => store.activeForm)
  const setActiveForm = useActiveTableFormStore((store) => store.setActiveForm)
  const clearActiveForm = useActiveTableFormStore((store) => store.clearActiveForm)
  const cellId = `${id}#${name}`
  const inputActive = activeForm === cellId
  const setInputActive = useCallback(
    (value: boolean) => {
      if (value) {
        setActiveForm(cellId)
      } else {
        const current = useActiveTableFormStore.getState().activeForm
        if (current === cellId) {
          clearActiveForm()
        }
      }
    },
    [cellId, setActiveForm, clearActiveForm],
  )
  let showRadio = inputActive
  let localLabel: ReactNode | null
  let remoteLabel: ReactNode | null
  let action: "KEEP_LOCAL" | "UPDATE_FROM_REMOTE" | "CUSTOM" | "OTHER" = "OTHER"

  // If MATCH, just show one value
  if (status === "MATCH") {
    const matchesLocal = compare(type, value, local)
    if (!matchesLocal) {
      showRadio = true
    }
    localLabel = formattedLocal ?? format(type, local, options)
    remoteLabel = null
    action = matchesLocal ? "KEEP_LOCAL" : "CUSTOM"
  }

  // NEW REMOTE -> Show remote without badge
  if (status === "NEW_REMOTE") {
    const matchesRemote = compare(type, value, remote)
    if (!matchesRemote) {
      showRadio = true
    }
    localLabel = null
    remoteLabel = formattedRemote ?? format(type, remote, options)
    action = matchesRemote ? "UPDATE_FROM_REMOTE" : "CUSTOM"
  }

  // NEW LOCAL -> Show local without badge
  if (status === "NEW_LOCAL") {
    const matchesLocal = compare(type, value, local)
    if (!matchesLocal) {
      showRadio = true
    }
    localLabel = (
      <ActionItem
        label={formattedLocal ?? format(type, local, options)}
        selected={matchesLocal ? undefined : false}
      />
    )
    remoteLabel = null
    action = matchesLocal ? "KEEP_LOCAL" : "CUSTOM"
  }

  if (status === "EXPIRED_LOCAL") {
    const matchesLocal = compare(type, value, local)
    const matchesRemote = compare(type, value, remote)
    if (!matchesLocal && !matchesRemote) {
      showRadio = true
    }
    localLabel = (
      <ActionItem label={formattedLocal ?? format(type, local, options)} selected={matchesLocal} />
    )
    remoteLabel = (
      <ActionItem
        label={formattedRemote ?? format(type, local, options)}
        selected={matchesRemote}
      />
    )
    action = matchesRemote ? "UPDATE_FROM_REMOTE" : matchesLocal ? "KEEP_LOCAL" : "CUSTOM"
  }

  // CONFLICT
  if (status === "CONFLICT") {
    // If values are effectively equal (deep check), show one
    if (JSON.stringify(local) === JSON.stringify(remote)) {
      const matchesLocal = compare(type, value, local)
      if (!matchesLocal) {
        showRadio = true
      }
      localLabel = (
        <ActionItem
          label={formattedLocal ?? format(type, local, options)}
          selected={matchesLocal ? undefined : false}
          badge={clientConfig.name}
        />
      )
      remoteLabel = null
      action = matchesLocal ? "KEEP_LOCAL" : "CUSTOM"
    }

    const matchesLocal = compare(type, value, local)
    const matchesRemote = compare(type, value, remote)
    if (!matchesLocal && !matchesRemote) {
      showRadio = true
    }
    localLabel = (
      <ActionItem
        label={formattedLocal ?? format(type, local, options)}
        selected={matchesLocal}
        badge={clientConfig.name}
      />
    )
    remoteLabel = (
      <ActionItem
        label={formattedRemote ?? format(type, remote, options)}
        selected={matchesRemote}
        badge="RVO"
      />
    )
    action = matchesRemote ? "UPDATE_FROM_REMOTE" : matchesLocal ? "KEEP_LOCAL" : "CUSTOM"
  }

  if (action === "OTHER") {
    console.warn('Showing radio because action was left "OTHER" unexpectedly.')
    showRadio = true
  }

  const showInput = inputActive || action === "CUSTOM"
  const inputItem = showInput ? (
    <ActionInput
      type={type}
      options={options}
      value={value}
      onChange={(value) => setUserChoice(id, name, value)}
      inputActive={inputActive}
      setInputActive={setInputActive}
    />
  ) : null

  if (showRadio) {
    return (
      <div className="group flex flex-row items-start gap-1">
        <RadioGroup
          className="flex flex-col gap-1.5"
          value={action}
          onValueChange={(value) => {
            if (value === "KEEP_LOCAL" && typeof local !== "undefined") {
              setUserChoice(id, name, local)
            }
            if (value === "UPDATE_FROM_REMOTE" && typeof remote !== "undefined") {
              setUserChoice(id, name, remote)
            }
          }}
        >
          {localLabel !== null && (
            <label className="flex items-center">
              <RadioGroupItem value="KEEP_LOCAL" />
              {localLabel}
            </label>
          )}
          {remoteLabel !== null && (
            <label className="flex items-center">
              <RadioGroupItem value="UPDATE_FROM_REMOTE" />
              {remoteLabel}
            </label>
          )}
          {inputItem && (
            <div className="flex items-center">
              <RadioGroupItem value="CUSTOM" />
              {inputItem}
            </div>
          )}
        </RadioGroup>
        <div>
          {allowCustomValue && !showInput && (
            <Button
              variant="ghost"
              className={"invisible size-auto group-hover:visible has-[>svg]:p-1"}
              title="Aanpassen..."
              onClick={() => setInputActive(true)}
            >
              <Pencil />
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="group flex flex-row items-start gap-1">
      <div>
        {localLabel !== null && <div className="flex items-center">{localLabel}</div>}
        {remoteLabel !== null && <div className="flex items-center">{remoteLabel}</div>}
        {inputItem && <div className="flex items-center">{inputItem}</div>}
      </div>
      <div>
        {allowCustomValue && !showInput && (
          <Button
            variant="ghost"
            className={"invisible size-auto group-hover:visible has-[>svg]:p-1"}
            title="Aanpassen..."
            onClick={() => setInputActive(true)}
          >
            <Pencil />
          </Button>
        )}
      </div>
    </div>
  )
}

export const columns: ColumnDef<typeof importReviewTableFeatures, ReviewItem>[] = [
  {
    accessorKey: "status",
    header: () => (
      <Tooltip>
        <TooltipTrigger>Status</TooltipTrigger>
        <TooltipContent>
          Geeft de vergelijkingsstatus weer tussen {clientConfig.name} en RVO.
        </TooltipContent>
      </Tooltip>
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      switch (status) {
        case "MATCH":
          return (
            <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
              <Tooltip>
                <TooltipTrigger>Gelijk</TooltipTrigger>
                <TooltipContent>
                  Perceel komt in {clientConfig.name} en bij RVO volledig overeen.
                </TooltipContent>
              </Tooltip>
            </Badge>
          )
        case "NEW_REMOTE":
          return (
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
              <Tooltip>
                <TooltipTrigger>Nieuw (RVO)</TooltipTrigger>
                <TooltipContent>
                  Perceel bestaat bij RVO, maar niet in {clientConfig.name}.
                </TooltipContent>
              </Tooltip>
            </Badge>
          )
        case "NEW_LOCAL":
          return (
            <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-700">
              <Tooltip>
                <TooltipTrigger>Nieuw ( {clientConfig.name})</TooltipTrigger>
                <TooltipContent>
                  Perceel bestaat in {clientConfig.name}, maar niet bij RVO.
                </TooltipContent>
              </Tooltip>
            </Badge>
          )
        case "EXPIRED_LOCAL":
          return (
            <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">
              <Tooltip>
                <TooltipTrigger>Niet meer actief</TooltipTrigger>
                <TooltipContent>
                  Perceel is in {clientConfig.name} nog actief, maar komt niet meer voor bij RVO.
                </TooltipContent>
              </Tooltip>
            </Badge>
          )
        case "CONFLICT":
          return (
            <Badge variant="destructive" className="border-red-200 bg-red-50 text-red-700">
              <Tooltip>
                <TooltipTrigger>Verschil</TooltipTrigger>
                <TooltipContent>
                  Perceel bestaat in beide, maar met verschillende gegevens.
                </TooltipContent>
              </Tooltip>
            </Badge>
          )
        default:
          return <Badge variant="secondary">{status}</Badge>
      }
    },
  },
  {
    id: "perceel",
    header: () => (
      <Tooltip>
        <TooltipTrigger>Perceel</TooltipTrigger>
        <TooltipContent>De naam en het RVO ID van het perceel.</TooltipContent>
      </Tooltip>
    ),
    cell: ({ row, table }) => {
      const item = row.original
      const id = getItemId(item)
      const { getUserChoice, setUserChoice } = table.options.meta!
      return (
        <ActionCell
          id={id}
          name="b_name"
          type="string"
          local={item.localField?.b_name}
          remote={item.rvoField?.properties.CropFieldDesignator}
          status={item.status}
          allowCustomValue={true}
          getUserChoice={getUserChoice}
          setUserChoice={setUserChoice}
        />
      )
    },
  },
  {
    id: "oppervlakte",
    header: () => (
      <Tooltip>
        <TooltipTrigger>Oppervlakte</TooltipTrigger>
        <TooltipContent>De oppervlakte van het perceel in hectaren.</TooltipContent>
      </Tooltip>
    ),
    cell: ({ row, table }) => {
      const item = row.original
      const id = getItemId(item)
      const { getUserChoice, setUserChoice } = table.options.meta!

      const localArea = item.localField
        ? `${(item.localField.b_area ?? 0).toFixed(2)} ha`
        : undefined
      const remoteArea = item.rvoField ? formatArea(item.rvoField.geometry) : undefined

      return (
        <ActionCell
          id={id}
          name="b_geometry"
          type="geometry"
          local={item.localField?.b_geometry}
          formattedLocal={localArea}
          remote={item.rvoField?.geometry}
          formattedRemote={remoteArea}
          status={item.status}
          allowCustomValue={false}
          getUserChoice={getUserChoice}
          setUserChoice={setUserChoice}
        />
      )
    },
  },
  {
    id: "gewas",
    header: () => (
      <Tooltip>
        <TooltipTrigger>Gewas</TooltipTrigger>
        <TooltipContent>Het gewas dat op 15 mei wordt geteeld.</TooltipContent>
      </Tooltip>
    ),
    cell: ({ row, table }) => {
      const item = row.original
      const id = getItemId(item)
      const { getUserChoice, setUserChoice, cultivationOptions } = table.options.meta!
      return (
        <ActionCell
          id={id}
          name="b_lu_catalogue"
          type="enum"
          local={item.localCultivation?.b_lu_catalogue}
          remote={`nl_${item.rvoField?.properties.CropTypeCode}`}
          status={item.status}
          allowCustomValue={true}
          getUserChoice={getUserChoice}
          setUserChoice={setUserChoice}
          options={cultivationOptions}
        />
      )
    },
  },
  {
    id: "ingangsdatum",
    header: () => (
      <Tooltip>
        <TooltipTrigger>Ingangsdatum</TooltipTrigger>
        <TooltipContent>De datum vanaf wanneer het perceel actief is.</TooltipContent>
      </Tooltip>
    ),
    cell: ({ row, table }) => {
      const item = row.original
      const id = getItemId(item)
      const { getUserChoice, setUserChoice } = table.options.meta!
      return (
        <ActionCell
          id={id}
          name="b_start"
          type="date"
          local={item.localField?.b_start}
          remote={item.rvoField?.properties.BeginDate}
          status={item.status}
          allowCustomValue={true}
          getUserChoice={getUserChoice}
          setUserChoice={setUserChoice}
        />
      )
    },
  },
  {
    id: "einddatum",
    header: () => (
      <Tooltip>
        <TooltipTrigger>Einddatum</TooltipTrigger>
        <TooltipContent>De datum waarop het perceel niet meer actief is.</TooltipContent>
      </Tooltip>
    ),
    cell: ({ row, table }) => {
      const item = row.original
      const id = getItemId(item)
      const { calendar, getUserChoice, setUserChoice } = table.options.meta!
      return (
        <ActionCell
          id={id}
          name="b_end"
          type="date"
          local={item.localField?.b_end}
          remote={
            item.status === "EXPIRED_LOCAL"
              ? new Date(`${calendar}-12-31`).toISOString()
              : item.rvoField?.properties.EndDate
          }
          status={item.status}
          allowCustomValue={true}
          getUserChoice={getUserChoice}
          setUserChoice={setUserChoice}
        />
      )
    },
  },
  {
    id: "gebruikstitel",
    header: () => (
      <Tooltip>
        <TooltipTrigger>Gebruikstitel</TooltipTrigger>
        <TooltipContent>De vorm van gebruikstitel (bv. eigendom, pacht).</TooltipContent>
      </Tooltip>
    ),
    cell: ({ row, table }) => {
      const item = row.original
      const id = getItemId(item)
      const { getUserChoice, setUserChoice } = table.options.meta!

      return (
        <ActionCell
          id={id}
          name="b_acquiring_method"
          type="enum"
          options={acquiringMethodOptions}
          local={item.localField?.b_acquiring_method}
          remote={`nl_${item.rvoField?.properties.UseTitleCode}`}
          status={item.status}
          allowCustomValue={true}
          getUserChoice={getUserChoice}
          setUserChoice={setUserChoice}
        />
      )
    },
  },
  {
    id: "bufferstrook",
    header: () => (
      <Tooltip>
        <TooltipTrigger>Bufferstrook</TooltipTrigger>
        <TooltipContent>
          Geeft aan of het perceel bij RVO geregistreerd staat als bufferstrook.
        </TooltipContent>
      </Tooltip>
    ),
    cell: ({ row, table }) => {
      const item = row.original
      const id = getItemId(item)
      const { getUserChoice, setUserChoice } = table.options.meta!

      const indBufferstrook = item.rvoField?.properties.mestData?.IndBufferstrook
      const rvoValue = indBufferstrook === undefined ? undefined : indBufferstrook === "J"

      return (
        <ActionCell
          id={id}
          name="b_bufferstrip"
          type="boolean"
          local={item.localField?.b_bufferstrip}
          remote={rvoValue}
          status={item.status}
          allowCustomValue={true}
          getUserChoice={getUserChoice}
          setUserChoice={setUserChoice}
        />
      )
    },
  },
  {
    id: "bufferstrook_editable",
    header: () => (
      <Tooltip>
        <TooltipTrigger className="flex flex-row items-center gap-1">
          Bufferstrook
          <Info className="h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent>
          <div className="max-w-75 text-center">
            Shapefile bevat geen informatie over bufferstroken. De getoonde waarden zijn schattingen
            of de huidige ingevulde status voor het perceel.
          </div>
        </TooltipContent>
      </Tooltip>
    ),
    cell: ({ row, table }) => {
      const item = row.original
      const id = getItemId(item)
      const { getUserChoice, setUserChoice } = table.options.meta!
      const value =
        getUserChoice(id, "b_bufferstrip") ?? row.original.localField?.b_bufferstrip ?? false

      return (
        <label className="text-muted-foreground flex flex-row items-center gap-1">
          <Checkbox
            checked={value}
            onCheckedChange={(checked) => setUserChoice(id, "b_bufferstrip", checked)}
          />
          <span className="align-top">{value ? "Ja" : "Nee"}</span>
        </label>
      )
    },
  },
  {
    id: "actions",
    header: () => (
      <Tooltip>
        <TooltipTrigger>Actie</TooltipTrigger>
        <TooltipContent>Kies welke actie moet worden uitgevoerd voor dit perceel.</TooltipContent>
      </Tooltip>
    ),
    cell: ({ row, table }) => {
      const item = row.original
      const id = getItemId(item)
      const {
        getUserChoice,
        setUserChoice,
        fieldsToRemove,
        setFieldToRemove,
        fieldsToAdd,
        setFieldToAdd,
        flags,
      } = table.options.meta!

      const field_to_remove = fieldsToRemove.has(id)
      const field_to_add = fieldsToAdd.has(id)

      if (item.status === "MATCH") {
        return (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Check className="h-4 w-4" />
            <span>Aanwezig</span>
          </div>
        )
      }

      if (item.status === "CONFLICT") {
        const value_b_name = getUserChoice(id, "b_name")
        const value_b_geometry = getUserChoice(id, "b_geometry")
        const value_b_lu_catalogue = getUserChoice(id, "b_lu_catalogue")
        const value_b_start = getUserChoice(id, "b_start")
        const value_b_end = getUserChoice(id, "b_end")
        const value_b_acquiring_method = getUserChoice(id, "b_acquiring_method")
        const value_b_bufferstrip = getUserChoice(id, "b_bufferstrip")

        let action: "OTHER" | "KEEP_LOCAL" | "UPDATE_FROM_REMOTE" = "OTHER"
        if (
          item.rvoField &&
          compare("string", value_b_name, item.rvoField.properties.CropFieldDesignator) &&
          compare("geometry", value_b_geometry, item.rvoField.geometry) &&
          compare("enum", value_b_lu_catalogue, `nl_${item.rvoField.properties.CropTypeCode}`) &&
          compare("date", value_b_start, item.rvoField.properties.BeginDate) &&
          compare("date", value_b_end, item.rvoField.properties.EndDate) &&
          compare(
            "enum",
            value_b_acquiring_method,
            `nl_${item.rvoField.properties.UseTitleCode}`,
          ) &&
          (!flags?.b_bufferstrip_info_available ||
            compare(
              "boolean",
              value_b_bufferstrip,
              item.rvoField.properties.mestData?.IndBufferstrook,
            ))
        ) {
          action = "UPDATE_FROM_REMOTE"
        } else if (
          item.localField &&
          compare("string", value_b_name, item.localField.b_name) &&
          compare("geometry", value_b_geometry, item.localField.b_geometry) &&
          (item.localCultivation
            ? compare("enum", value_b_lu_catalogue, item.localCultivation.b_lu_catalogue)
            : false) &&
          compare("date", value_b_start, item.localField.b_start) &&
          compare("date", value_b_end, item.localField.b_end) &&
          compare("enum", value_b_acquiring_method, item.localField.b_acquiring_method) &&
          item.localField.b_bufferstrip
        ) {
          action = "KEEP_LOCAL"
        }

        return (
          <Select
            value={action}
            onValueChange={(val) => {
              if (val === "KEEP_LOCAL") {
                setUserChoice(id, "b_name", item.localField?.b_name)
                setUserChoice(id, "b_geometry", item.localField?.b_geometry)
                setUserChoice(id, "b_lu_catalogue", item.localCultivation?.b_lu_catalogue)
                setUserChoice(id, "b_start", item.localField?.b_start)
                setUserChoice(id, "b_end", item.localField?.b_end)
                setUserChoice(id, "b_acquiring_method", item.localField?.b_acquiring_method)
                setUserChoice(id, "b_bufferstrip", item.localField?.b_bufferstrip)
              } else if (val === "UPDATE_FROM_REMOTE") {
                setUserChoice(id, "b_name", item.rvoField?.properties.CropFieldDesignator)
                setUserChoice(id, "b_geometry", item.rvoField?.geometry)
                setUserChoice(id, "b_lu_catalogue", `nl_${item.rvoField?.properties.CropTypeCode}`)
                setUserChoice(id, "b_start", item.rvoField?.properties.BeginDate)
                setUserChoice(id, "b_end", item.rvoField?.properties.EndDate)
                setUserChoice(
                  id,
                  "b_acquiring_method",
                  `nl_${item.rvoField?.properties.UseTitleCode}`,
                )
                if (flags?.b_bufferstrip_info_available) {
                  setUserChoice(
                    id,
                    "b_bufferstrip",
                    item.rvoField?.properties.mestData?.IndBufferstrook,
                  )
                }
              }
            }}
          >
            <SelectTrigger className="z-10 h-8 w-[180px] text-xs">
              <SelectValue placeholder="Kies actie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UPDATE_FROM_REMOTE">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="h-3 w-3" /> Gebruik RVO
                </div>
              </SelectItem>
              <SelectItem value="KEEP_LOCAL">
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3" /> Gebruik {clientConfig.name}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        )
      }

      if (item.status === "NEW_REMOTE") {
        return (
          <Select
            value={field_to_add ? "ADD_REMOTE" : "IGNORE"}
            onValueChange={(val) => {
              setFieldToAdd(id, val === "ADD_REMOTE")
            }}
          >
            <SelectTrigger className="z-10 h-8 w-[180px] text-xs">
              <SelectValue placeholder="Kies actie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ADD_REMOTE">
                <div className="flex items-center gap-2">
                  <Plus className="h-3 w-3" /> Toevoegen
                </div>
              </SelectItem>
              <SelectItem value="IGNORE">
                <div className="text-muted-foreground flex items-center gap-2">
                  <X className="h-3 w-3" /> Negeren
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        )
      }
      if (item.status === "NEW_LOCAL") {
        return (
          <Select
            value={field_to_remove ? "REMOVE_LOCAL" : "KEEP_LOCAL"}
            onValueChange={(val) => {
              setFieldToRemove(id, val === "REMOVE_LOCAL")
            }}
          >
            <SelectTrigger className="z-10 h-8 w-[180px] text-xs">
              <SelectValue placeholder="Kies actie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="REMOVE_LOCAL">
                <div className="text-destructive flex items-center gap-2">
                  <Trash2 className="h-3 w-3" /> Verwijderen
                </div>
              </SelectItem>
              <SelectItem value="KEEP_LOCAL">
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3" /> Behouden
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        )
      }

      if (item.status === "EXPIRED_LOCAL") {
        const value_b_end = getUserChoice(id, "b_end")

        return (
          <Select
            value={
              compare("date", value_b_end, item.rvoField?.properties.EndDate)
                ? "CLOSE_LOCAL"
                : "KEEP_LOCAL"
            }
            onValueChange={(val) => {
              if (val === "CLOSE_LOCAL") {
                setUserChoice(id, "b_end", item.rvoField?.properties.EndDate)
              }

              if (val === "KEEP_LOCAL") {
                setUserChoice(id, "b_end", item.localField?.b_end)
              }
            }}
          >
            <SelectTrigger className="z-10 h-8 w-[180px] text-xs">
              <SelectValue placeholder="Kies actie" />
            </SelectTrigger>
            <SelectItem value="CLOSE_LOCAL">
              <div className="flex items-center gap-2 text-orange-700">
                <Archive className="h-3 w-3" /> Afsluiten
              </div>
            </SelectItem>
            <SelectItem value="KEEP_LOCAL">
              <div className="flex items-center gap-2">
                <Check className="h-3 w-3" /> Behouden
              </div>
            </SelectItem>
          </Select>
        )
      }
    },
  },
]

/**
 * Works like setState, however only allows a next value argument, and resets the state whenever
 * `key` changes.
 *
 * Here it is used to reset the user choices when the table data changes.
 *
 * @param key Key used to decide when to reset the state.
 * @param initial Function to compute the state reset value.
 * @returns a tuple of the current state, and a setter function.
 */
export function useKeyedState<K, V>(
  key: K,
  initial: (key: K) => V,
): [V, (next: V | ((prev: V) => V)) => void] {
  const [stored, setStored] = useState<{ key: K; value: V } | null>(null)
  const value = stored !== null && Object.is(stored.key, key) ? stored.value : initial(key)

  const latestRef = useRef({ key, initial })
  useLayoutEffect(() => {
    latestRef.current = { key, initial }
  })

  const setValue = useCallback((next: V | ((prev: V) => V)) => {
    setStored((prev) => {
      const { key, initial } = latestRef.current
      const current = prev !== null && Object.is(prev.key, key) ? prev.value : initial(key)
      return { key, value: typeof next === "function" ? (next as (prev: V) => V)(current) : next }
    })
  }, [])

  return [value, setValue]
}

export function useRvoImportForm(data: ReviewItem[]) {
  const [userChoices, setUserChoices] = useKeyedState(data, () => {
    return new Map<string, Partial<Record<ReviewItemFieldKey, any>>>()
  })
  const [fieldsToAdd, setFieldsToAdd] = useKeyedState(data, () => new Set<string>())
  const [fieldsToRemove, setFieldsToRemove] = useKeyedState(data, () => new Set<string>())

  const getUserChoice = useCallback(
    (id: string, key: ReviewItemFieldKey) => {
      return userChoices.get(id)?.[key]
    },
    [userChoices],
  )

  const setUserChoice = useCallback((id: string, key: ReviewItemFieldKey, value: any) => {
    setUserChoices((current) => {
      const newUserChoices = new Map(current)
      newUserChoices.set(id, { ...current.get(id), [key]: value })
      return newUserChoices
    })
  }, [])

  const setFieldToAdd = useCallback((id: string, add: boolean) => {
    setFieldsToAdd((current) => {
      if (add) {
        if (!current.has(id)) {
          return new Set([...current, id])
        }
      } else {
        if (current.has(id)) {
          const newSet = new Set(current)
          newSet.delete(id)
          return newSet
        }
      }
      return current
    })
  }, [])

  const setFieldToRemove = useCallback((id: string, add: boolean) => {
    setFieldsToRemove((current) => {
      if (add) {
        if (!current.has(id)) {
          return new Set([...current, id])
        }
      } else {
        if (current.has(id)) {
          const newSet = new Set(current)
          newSet.delete(id)
          return newSet
        }
      }
      return current
    })
  }, [])

  const formValues = useMemo(() => {
    const formFieldsToAdd: Partial<SubmittedFieldInit>[] = []
    const formFieldsToRemove: string[] = []
    const formFieldsToUpdate: (Partial<SubmittedFieldInit> & { b_id: string; b_lu?: string })[] = []

    for (const item of data) {
      const id = getItemId(item)
      if (item.status === "NEW_LOCAL") {
        if (!item.localField) {
          console.warn("Review item with status=NEW_LOCAL but no local field.")
          continue
        }

        if (fieldsToRemove.has(id)) {
          formFieldsToRemove.push(item.localField.b_id)
          continue
        }
      }

      if (item.status === "NEW_REMOTE") {
        if (!item.rvoField) {
          console.warn("Review item with status=NEW_REMOTE but no remote field.")
          continue
        }

        if (fieldsToAdd.has(id)) {
          const newFieldInit: SubmittedFieldInit = {
            b_name: item.rvoField.properties.CropFieldDesignator,
            b_id_source: item.rvoField.properties.CropFieldID,
            b_geometry: item.rvoField.geometry,
            b_lu_catalogue: `nl_${item.rvoField.properties.CropTypeCode}`,
            b_start: item.rvoField.properties.BeginDate,
            b_end: item.rvoField.properties.EndDate ?? null,
            b_acquiring_method: `nl_${item.rvoField.properties.UseTitleCode}`,
            b_bufferstrip: item.rvoField.properties.mestData?.IndBufferstrook === "J", // user choices will include it in case mestData isn't defined.
          }

          const userOverrides = userChoices.get(id)
          if (userOverrides) {
            for (const [overrideKey, overrideValue] of Object.entries(userOverrides)) {
              if (overrideKey in newFieldInit) {
                ;(newFieldInit as any)[overrideKey] = overrideValue
              }
            }
          }

          formFieldsToAdd.push(newFieldInit)
        }

        // Nothing else to do if the field was ignored.
        continue
      }

      if (!item.localField) {
        // We have already warned.
        continue
      }

      const userOverrides = userChoices.get(id)
      if (userOverrides) {
        const updatedFieldInit: Partial<SubmittedFieldInit> = {}
        for (const [overrideKey, overrideValue] of Object.entries(userOverrides) as [
          ReviewItemFieldKey,
          any,
        ][]) {
          if (
            overrideKey !== "b_lu_catalogue" &&
            typeof overrideValue !== "undefined" &&
            item.localField[overrideKey] !== userOverrides[overrideKey as ReviewItemFieldKey]
          ) {
            updatedFieldInit[overrideKey as keyof SubmittedFieldInit] = overrideValue
          }
        }

        // Add b_id_source too if it is different now.
        if (item.rvoField && item.rvoField.properties.CropFieldID !== item.localField.b_id_source) {
          updatedFieldInit.b_id_source = item.rvoField.properties.CropFieldID
        }

        if (
          typeof updatedFieldInit.b_lu_catalogue !== "undefined" &&
          (!item.localCultivation ||
            userOverrides.b_lu_catalogue !== updatedFieldInit.b_lu_catalogue)
        ) {
          updatedFieldInit.b_lu_catalogue = userOverrides.b_lu_catalogue
        }

        if (Object.keys(updatedFieldInit).length > 0) {
          formFieldsToUpdate.push({
            ...updatedFieldInit,
            b_id: item.localField.b_id,
            b_lu: item.localCultivation?.b_lu,
          })
        }
      }
    }

    return {
      fieldsToAdd: formFieldsToAdd,
      fieldsToRemove: formFieldsToRemove,
      fieldsToUpdate: formFieldsToUpdate,
    }
  }, [userChoices, fieldsToAdd, fieldsToRemove])

  return {
    getUserChoice,
    setUserChoice,
    fieldsToAdd,
    setFieldToAdd,
    fieldsToRemove,
    setFieldToRemove,
    formValues,
  }
}

export function RvoImportReviewTable({
  data,
  calendar,
  flags,
  setUserChoice,
  getUserChoice,
  fieldsToAdd,
  setFieldToAdd,
  fieldsToRemove,
  setFieldToRemove,
  cultivationOptions,
}: RvoImportReviewTableProps) {
  const clearActiveForm = useActiveTableFormStore((store) => store.clearActiveForm)

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const getArea = (item: typeof a): number | null => {
        if (item.rvoField?.geometry) {
          return area(item.rvoField.geometry) / 10000
        }
        const localArea = item.localField?.b_area
        if (Number.isFinite(localArea)) {
          return localArea as number
        }
        return null
      }
      const areaA = getArea(a)
      const areaB = getArea(b)
      if (areaA === null && areaB === null) return 0
      if (areaA === null) return 1
      if (areaB === null) return -1
      return areaB - areaA
    })
  }, [data])

  const b_bufferstrip_info_available = flags?.b_bufferstrip_info_available ?? true
  const columnVisibility = {
    bufferstrook: b_bufferstrip_info_available,
    bufferstrook_editable: !b_bufferstrip_info_available,
  }

  useLayoutEffect(() => {
    clearActiveForm()
  }, [data])

  const table = useTable({
    data: sortedData,
    features: importReviewTableFeatures,
    columns,
    meta: {
      canModify: true,
      calendar,
      flags,
      setUserChoice,
      getUserChoice,
      fieldsToAdd,
      setFieldToAdd,
      fieldsToRemove,
      setFieldToRemove,
      cultivationOptions,
    },
    state: {
      columnVisibility: columnVisibility,
    },
  })

  return (
    <TooltipProvider>
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      <FlexRender header={header} />
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Geen resultaten.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  )
}
