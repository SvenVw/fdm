// Authorization
import { boolean, pgSchema, text, timestamp } from "drizzle-orm/pg-core"
import { roles, resources, actions } from "../authorization"

// Define postgres schema
export const fdmAuthZSchema = pgSchema("fdm-authz")
export type fdmSchemaAuthZTypeSelect = typeof fdmAuthZSchema

export const role = fdmAuthZSchema.table("role", {
    resource: text(),
    resource_id: text(),
    principal_id: text(),
    role: text(),
    created: timestamp({ withTimezone: true }).notNull().defaultNow(),
    deleted: timestamp({ withTimezone: true }),
})

export type roleTypeSelect = typeof role.$inferSelect
export type roleTypeInsert = typeof role.$inferInsert

export const audit = fdmAuthZSchema.table("audit", {
    audit_id: text().primaryKey(),
    audit_timestamp: timestamp({ withTimezone: true }).notNull().defaultNow(),
    principal_id: text(),
    resource: text(),
    resource_id: text(),
    action: text(),
    allowed: boolean(),
})

export type auditTypeSelect = typeof audit.$inferSelect
export type auditTypeInsert = typeof audit.$inferInsert
