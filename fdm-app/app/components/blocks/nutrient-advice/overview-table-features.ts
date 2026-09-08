import {
  columnVisibilityFeature,
  createSortedRowModel,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/react-table"

// Lets each nutrient column carry its group ("Primair" etc.) for the divider styling and the
// "Bekijk" column-visibility dropdown, without needing a nested (and fragile) grouped header row.
interface OverviewTableColumnMeta {
  groupStart?: boolean
  groupLabel?: string
}

export const overviewTableFeatures = tableFeatures({
  columnVisibilityFeature: columnVisibilityFeature,
  rowSortingFeature: rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  columnMeta: {} as OverviewTableColumnMeta,
})
