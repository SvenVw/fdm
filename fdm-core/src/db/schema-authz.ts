// Authorization
import { boolean, index, integer, pgSchema, text, timestamp } from "drizzle-orm/pg-core"

// Define postgres schema
export const fdmAuthZSchema = pgSchema("fdm-authz")
export type fdmSchemaAuthZTypeSelect = typeof fdmAuthZSchema

export const role = fdmAuthZSchema.table(
    "role",
    {
        role_id: text().primaryKey(),
        resource: text().notNull(),
        resource_id: text().notNull(),
        principal_id: text().notNull(),
        role: text().notNull(),
        created: timestamp({ withTimezone: true }).notNull().defaultNow(),
        deleted: timestamp({ withTimezone: true }),
    },
    (table) => [
        index("role_idx").on(
            table.resource,
            table.resource_id,
            table.principal_id,
            table.role,
            table.deleted,
        ),
    ],
)

export type roleTypeSelect = typeof role.$inferSelect
export type roleTypeInsert = typeof role.$inferInsert

export const audit = fdmAuthZSchema.table("audit", {
    audit_id: text().primaryKey(),
    audit_timestamp: timestamp({ withTimezone: true }).notNull().defaultNow(),
    principal_id: text().notNull(),
    target_resource: text().notNull(),
    target_resource_id: text().notNull(),
    granting_resource: text().notNull(),
    granting_resource_id: text().notNull(),
    action: text().notNull(),
    allowed: boolean().notNull(),
    duration: integer().notNull(),
})

export type auditTypeSelect = typeof audit.$inferSelect
export type auditTypeInsert = typeof audit.$inferInsert
