export interface FarmOption {
    b_id_farm: string
    b_name_farm: string | undefined
}

export type FarmOptions = FarmOption[] | undefined

export interface FieldOption {
    b_id: string
    b_name: string | undefined
    b_area: number | undefined
}

export type FieldOptions = FieldOption[] | undefined

export type LayerKey = "fields" | "soil" | "elevation"

export interface LayerOption {
    layerKey: LayerKey
    layerName: "Percelen" | "Bodem" | "Hoogte"
}

export type LayerOptions = LayerOption[]

export interface HeaderAction {
    label: string
    to: string
    disabled?: boolean
}

export interface PaginationItem {
    label: string
    to: string
}

export type PaginationItems = PaginationItem[]
