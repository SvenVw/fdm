import { pgSchema, text, date, timestamp } from "drizzle-orm/pg-core";

// Define postgres schema
export const fdmSchema = pgSchema("fdm-dev")
export type fdmSchemaTypeSelect = typeof fdmSchema

// Define farms table
export const sectorEnum = fdmSchema.enum('sector', ['diary', 'arable', 'tree_nursery', 'bulbs'])

export const farms = fdmSchema.table('farms', {
    b_id_farm: text().primaryKey(),
    b_name_farm: text(),
    b_sector: sectorEnum(),
    created: timestamp({withTimezone: true}).notNull().defaultNow(),
    updated: timestamp({withTimezone: true})
})

export type farmsTypeSelect = typeof farms.$inferSelect
export type farmsTypeInsert = typeof farms.$inferInsert


// Define farm_managing table
export const manageTypeEnum = fdmSchema.enum('b_manage_type', ['owner', 'lease'])

export const farmManaging = fdmSchema.table('farm_managing', {
    b_id: text('b_id').notNull().references(() => fields.b_id),
    b_id_farm: text('b_id_farm').notNull().references(() => farms.b_id_farm),
    b_manage_start: date('b_manage_start'),
    b_manage_end: date('b_manage_end'),
    b_manage_type: manageTypeEnum('b_manage_type'),
    created: timestamp({withTimezone: true}).notNull().defaultNow(),
    updated: timestamp({withTimezone: true})
})

export type farmManagingTypeSelect = typeof farms.$inferSelect
export type farmManagingTypeInsert = typeof farms.$inferInsert


// Define fields table
export const fields = fdmSchema.table('fields', {
    b_id: text('b_id').primaryKey(),
    b_name_field: text('b_name_field'),
    // b_geometry
    created: timestamp({withTimezone: true}).notNull().defaultNow(),
    updated: timestamp({withTimezone: true})
})

export type fieldsTypeSelect = typeof fields.$inferSelect
export type fieldsTypeInsert = typeof fields.$inferInsert