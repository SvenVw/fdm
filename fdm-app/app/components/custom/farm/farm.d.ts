export interface FarmOption {
    b_id_farm: string;
    b_name_farm: string;
}

export type FarmOptions = FarmOption[] | undefined;

export interface HeaderAction {
    label: string;
    to: string;
    disabled?: boolean;
}