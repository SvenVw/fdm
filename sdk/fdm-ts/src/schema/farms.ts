import { pgTable, pgEnum, text } from 'drizzle-orm/pg-core';

export const sectorEnum = pgEnum('sector', ['diary', 'arable', 'tree_nursery', 'bulbs']);

export const farms  = pgTable('farms', {
    b_id_farm: text('b_id_farm').primaryKey(),
    b_name_farm: text('b_name_farm'),
    b_sector: sectorEnum( 'b_sector')
})

export type farmsTypeSelect = typeof farms.$inferSelect;
export type farmsTypeInsert = typeof farms.$inferInsert;