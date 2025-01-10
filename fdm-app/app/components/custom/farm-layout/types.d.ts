// components/custom/farm-layouts/types.ts
export interface FarmOption {
    value: string;
    label: string;
}

export interface HeaderAction {
    label: string;
    to: string;
    disabled?: boolean;
}

export interface BaseFarmLayoutProps {
    farmName?: string;
    breadcrumbs?: {
        label: string;
        to?: string;
    }[];
    action?: HeaderAction;
}

export interface SidebarNavItem {
    title: string;
    to: string;
}

export interface ContentLayoutProps extends BaseFarmLayoutProps {
    title: string;
    description?: string;
    sidebarItems?: SidebarNavItem[];
    children?: React.ReactNode;
}

export interface PaginationItem {
    title: string;
    href: string;
}