import type * as authZSchema from "./db/schema-authz"

export type Resource =
    | "user"
    | "organization"
    | "farm"
    | "field"
    | "cultivation"
    | "fertilizer"
    | "soil"
    | "harvest"
export type Role = "owner" | "advisor" | "researcher"
export type Action = "read" | "write" | "list" | "share"

export interface Permission {
    resource: Resource
    role: Role | Role[]
    action: Action | Action[]
}

export type PrincipalId =
    | authZSchema.roleTypeSelect["principal_id"]
    | authZSchema.roleTypeSelect["principal_id"][]
