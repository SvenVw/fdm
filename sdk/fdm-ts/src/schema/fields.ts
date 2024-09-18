import { pgTable, text } from 'drizzle-orm/pg-core';

export const fields  = pgTable('fields', {
    b_id: text('b_id').primaryKey(),
    b_name_field: text('b_name_field')
    // b_geometry
})

export type fieldsTypeSelect = typeof fields.$inferSelect;
export type fieldsTypeInsert = typeof fields.$inferInsert;