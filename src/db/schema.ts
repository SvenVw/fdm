import { pgSchema, text, date, timestamp, primaryKey, uniqueIndex, numeric } from 'drizzle-orm/pg-core'

// Define postgres schema
export const fdmSchema = pgSchema('fdm-dev')
export type fdmSchemaTypeSelect = typeof fdmSchema

// Define farms table
export const sectorEnum = fdmSchema.enum('b_sector', ['diary', 'arable', 'tree_nursery', 'bulbs'])

export const farms = fdmSchema.table('farms', {
  b_id_farm: text().primaryKey(),
  b_name_farm: text(),
  b_sector: sectorEnum(),
  created: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updated: timestamp({ withTimezone: true })
}, (table) => {
  return {
    b_id_farm_idx: uniqueIndex('b_id_farm_idx').on(table.b_id_farm)
  }
})

export type farmsTypeSelect = typeof farms.$inferSelect
export type farmsTypeInsert = typeof farms.$inferInsert

// Define farm_managing table
export const manageTypeEnum = fdmSchema.enum('b_manage_type', ['owner', 'lease'])

export const farmManaging = fdmSchema.table('farm_managing', {
  b_id: text().notNull().references(() => fields.b_id),
  b_id_farm: text().notNull().references(() => farms.b_id_farm),
  b_manage_start: date({ mode: 'date' }),
  b_manage_end: date({ mode: 'date' }),
  b_manage_type: manageTypeEnum(),
  created: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updated: timestamp({ withTimezone: true })
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.b_id, table.b_id_farm] }),
    b_id_b_id_farm_idx: uniqueIndex('b_id_b_id_farm_idx').on(table.b_id, table.b_id_farm)
  }
})

export type farmManagingTypeSelect = typeof farmManaging.$inferSelect
export type farmManagingTypeInsert = typeof farmManaging.$inferInsert

// Define fields table
export const fields = fdmSchema.table('fields', {
  b_id: text().primaryKey(),
  b_name: text(),
  // b_geometry: PGLite does not support PostGIS yet; I expect to be supported in Q4 2024: https://github.com/electric-sql/pglite/issues/11
  created: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updated: timestamp({ withTimezone: true })
}, (table) => {
  return {
    b_id_idx: uniqueIndex('b_id_idx').on(table.b_id)
  }
})

export type fieldsTypeSelect = typeof fields.$inferSelect
export type fieldsTypeInsert = typeof fields.$inferInsert

// Define fertilizers table
export const fertilizers = fdmSchema.table('fertilizers', {
  p_id: text().primaryKey(),
  created: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updated: timestamp({ withTimezone: true })
}, (table) => {
  return {
    b_id_idx: uniqueIndex('p_id_idx').on(table.p_id)
  }
})

export type fertilizersTypeSelect = typeof fertilizers.$inferSelect
export type fertilziersTypeInsert = typeof fertilizers.$inferInsert

// Define fertilizers acquiring table
export const fertilizerAcquiring = fdmSchema.table('fertilizer_aquiring', {
  b_id_farm: text().notNull().references(() => farms.b_id_farm),
  p_id: text().notNull().references(() => fertilizers.p_id),
  p_amount: numeric({precision: 7,scale: 3}), // kg
  p_date_acquiring: timestamp({ withTimezone: true }),
  created: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updated: timestamp({ withTimezone: true })
})

export type fertilizerAcquiringTypeSelect = typeof fertilizerAcquiring.$inferSelect
export type fertilzierAcquiringTypeInsert = typeof fertilizerAcquiring.$inferInsert

// Define fertilizers_catalogue table
export const fertilizersCatalogue = fdmSchema.table('fertilizers_catalogue', {
  p_id_catalogue: text().primaryKey(),
  p_source: text().notNull(),
  p_name_nl: text(),
  p_name_en: text(),
  p_description: text(),
  p_dm: numeric().$type<number>(), // Workaround for bug: https://github.com/drizzle-team/drizzle-orm/issues/2681
  p_om: numeric().$type<number>(),
  p_a: numeric().$type<number>(),
  p_hc: numeric().$type<number>(),
  p_eom: numeric().$type<number>(),
  p_eoc: numeric().$type<number>(),
  p_c_rt: numeric().$type<number>(),
  p_c_of: numeric().$type<number>(),
  p_c_if: numeric().$type<number>(),
  p_c_fr: numeric().$type<number>(),
  p_cn_of: numeric().$type<number>(),
  p_n_rt: numeric().$type<number>(),
  p_n_if: numeric().$type<number>(),
  p_n_of: numeric().$type<number>(),
  p_n_wc: numeric().$type<number>(),
  p_p_rt: numeric().$type<number>(),
  p_k_rt: numeric().$type<number>(),
  p_mg_rt: numeric().$type<number>(),
  p_ca_rt: numeric().$type<number>(),
  p_ne: numeric().$type<number>(),
  p_s_rt: numeric().$type<number>(),
  p_s_wc: numeric().$type<number>(),
  p_cu_rt: numeric().$type<number>(),
  p_zn_rt: numeric().$type<number>(),
  p_na_rt: numeric().$type<number>(),
  p_si_rt: numeric().$type<number>(),
  p_b_rt: numeric().$type<number>(),
  p_mn_rt: numeric().$type<number>(),
  p_ni_rt: numeric().$type<number>(),
  p_fe_rt: numeric().$type<number>(),
  p_mo_rt: numeric().$type<number>(),
  p_co_rt: numeric().$type<number>(),
  p_as_rt: numeric().$type<number>(),
  p_cd_rt: numeric().$type<number>(),
  p_cr_rt: numeric().$type<number>(),
  p_cr_vi: numeric().$type<number>(),
  p_pb_rt: numeric().$type<number>(),
  p_hg_rt: numeric().$type<number>(),
  p_cl_cr: numeric().$type<number>(),
  created: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updated: timestamp({ withTimezone: true })
}, (table) => {
  return {
    p_id_catalogue_idx: uniqueIndex('p_id_catalogue_idx').on(table.p_id_catalogue)
  }
})

export type fertilizersCatalogueTypeSelect = typeof fertilizersCatalogue.$inferSelect
export type fertilizersCatalogueTypeInsert = typeof fertilizersCatalogue.$inferInsert

// Define fertilizer_picking table
export const fertilizerPicking = fdmSchema.table('fertilizer_picking', {
  p_id: text().notNull().references(() => fertilizers.p_id),
  p_id_catalogue: text().notNull().references(() => fertilizersCatalogue.p_id_catalogue),
  p_picking_date: timestamp({ withTimezone: true }),
  created: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updated: timestamp({ withTimezone: true })
})

export type fertilizerPickingTypeSelect = typeof fertilizerPicking.$inferSelect
export type fertilizerPickingTypeInsert = typeof fertilizerPicking.$inferInsert
