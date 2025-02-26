export type Resource =   "farm" | "field" | "cultivation" | "fertilizer" | "soil" | "harvest"
export type Role = "owner" | "advisor" | "researcher"
export type Action = "read" | "write" | "list" | "share"

export interface Permission {
    resource: Resource
    role: Role | Role[]
    action: Action | Action[]
}