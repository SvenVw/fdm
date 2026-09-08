import { tableFeatures } from "@tanstack/react-table"

export interface FertAppTableMeta {
  returnUrl?: string
}

export const fertAppTableFeatures = tableFeatures({
  tableMeta: {} as FertAppTableMeta,
})
