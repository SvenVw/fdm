import { pgTable, text, date, pgEnum } from 'drizzle-orm/pg-core';
import { farms } from './farms'
import { fields } from './fields'

export const manageTypeEnum = pgEnum('b_manage_type', ['owner', 'lease']);

export const farmManaging = pgTable('farm_managing', {
    b_id: text('b_id').notNull().references(() => fields.b_id),
    b_id_farm: text('b_id_farm').notNull().references(() => farms.b_id_farm),
    b_manage_start: date('b_manage_start'),
    b_manage_end: date('b_manage_end'),
    b_manage_type: manageTypeEnum('b_manage_type')
})

export type farmManagingTypeSelect = typeof farms.$inferSelect;
export type farmManagingTypeInsert = typeof farms.$inferInsert;