import type { Permission, Resource, Role, Action } from "./authorization.d"

export const resources: Resource[] = [
    "user",
    "organization",
    "farm",
    "field",
    "cultivation",
    "fertilizer",
    "soil",
    "harvest",
] as const
export const roles: Role[] = ["owner", "advisor", "researcher"] as const
export const actions: Action[] = ["read", "write", "list", "share"] as const

export const permissions: Permission[] = [
    {
        resource: "farm",
        role: "owner",
        action: ["read", "write", "list", "share"],
    },
    {
        resource: "farm",
        role: "advisor",
        action: ["read", "write", "list"],
    },
    {
        resource: "farm",
        role: "researcher",
        action: ["read"],
    },
    {
        resource: "user",
        role: "owner",
        action: ["read", "write", "list", "share"],
    },
    {
        resource: "organization",
        role: "owner",
        action: ["read", "write", "list", "share"],
    },
    {
        resource: "organization",
        role: "advisor",
        action: ["read"],
    },
]
