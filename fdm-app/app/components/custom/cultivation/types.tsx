export interface Cultivation {
    b_lu: string
    b_lus: string[] | null
    b_lu_catalogue: string
    b_lu_name: string
    b_sowing_date: Date
    b_terminating_date: Date | null
}

export interface cultivationOption {
    value: string
    label: string
}

export interface CultivationsFormProps {
    b_lu_catalogue: string | undefined
    b_sowing_date: Date | undefined
    b_terminating_date: Date | undefined
    options: cultivationOption[]
    action: string
}
