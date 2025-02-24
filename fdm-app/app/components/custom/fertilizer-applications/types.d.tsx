export interface FertilizerApplication {
    p_app_id: string
    p_app_ids: string[]
    p_name_nl: string
    p_app_amount: number
    p_app_date: Date
}

export interface FertilizerOption {
    value: string
    label: string
}

export interface FertilizerApplicationsFormProps {
    fertilizerApplications: FertilizerApplication[]
    options: FertilizerOption[]
    defaultValue?: string
    action: string
}

export interface FertilizerApplicationsCardProps {
    title: string
    shortname: string
    value: number
    unit: string
    limit: number | undefined
    advice: number | undefined
}
