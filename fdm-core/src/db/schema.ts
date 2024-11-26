import { pgSchema, text, date, timestamp, boolean, primaryKey, uniqueIndex, index} from 'drizzle-orm/pg-core'
import { geometryPolygon, numericCasted } from './schema-custom-types'

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
    pk: primaryKey({ columns: [table.b_id, table.b_id_farm] })
  }
})

export type farmManagingTypeSelect = typeof farmManaging.$inferSelect
export type farmManagingTypeInsert = typeof farmManaging.$inferInsert

// Define fields table
export const fields = fdmSchema.table('fields', {
  b_id: text().primaryKey(),
  b_name: text(),
  b_geometry: geometryPolygon(), // PGLite does not support PostGIS yet; I expect to be supported in Q4 2024: https://github.com/electric-sql/pglite/issues/11
  b_id_source: text(),
  created: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updated: timestamp({ withTimezone: true })
}, (table) => {
  return {
    b_id_idx: uniqueIndex('b_id_idx').on(table.b_id),
    b_geom_idx: index('b_geom_idx').using('gist', table.b_geometry)
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
export type fertilizersTypeInsert = typeof fertilizers.$inferInsert

// Define fertilizers acquiring table
export const fertilizerAcquiring = fdmSchema.table('fertilizer_aquiring', {
  b_id_farm: text().notNull().references(() => farms.b_id_farm),
  p_id: text().notNull().references(() => fertilizers.p_id),
  p_amount: numericCasted(), //kg
  p_date_acquiring: timestamp({ withTimezone: true }),
  created: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updated: timestamp({ withTimezone: true })
})

export type fertilizerAcquiringTypeSelect = typeof fertilizerAcquiring.$inferSelect
export type fertilizerAcquiringTypeInsert = typeof fertilizerAcquiring.$inferInsert

// Define fertilizers_catalogue table
export const fertilizersCatalogue = fdmSchema.table('fertilizers_catalogue', {
  p_id_catalogue: text().primaryKey(),
  p_source: text().notNull(),
  p_name_nl: text(),
  p_name_en: text(),
  p_description: text(),
  p_dm: numericCasted(),
  p_density: numericCasted(),
  p_om: numericCasted(),
  p_a: numericCasted(),
  p_hc: numericCasted(),
  p_eom: numericCasted(),
  p_eoc: numericCasted(),
  p_c_rt: numericCasted(),
  p_c_of: numericCasted(),
  p_c_if: numericCasted(),
  p_c_fr: numericCasted(),
  p_cn_of: numericCasted(),
  p_n_rt: numericCasted(),
  p_n_if: numericCasted(),
  p_n_of: numericCasted(),
  p_n_wc: numericCasted(),
  p_p_rt: numericCasted(),
  p_k_rt: numericCasted(),
  p_mg_rt: numericCasted(),
  p_ca_rt: numericCasted(),
  p_ne: numericCasted(),
  p_s_rt: numericCasted(),
  p_s_wc: numericCasted(),
  p_cu_rt: numericCasted(),
  p_zn_rt: numericCasted(),
  p_na_rt: numericCasted(),
  p_si_rt: numericCasted(),
  p_b_rt: numericCasted(),
  p_mn_rt: numericCasted(),
  p_ni_rt: numericCasted(),
  p_fe_rt: numericCasted(),
  p_mo_rt: numericCasted(),
  p_co_rt: numericCasted(),
  p_as_rt: numericCasted(),
  p_cd_rt: numericCasted(),
  p_cr_rt: numericCasted(),
  p_cr_vi: numericCasted(),
  p_pb_rt: numericCasted(),
  p_hg_rt: numericCasted(),
  p_cl_cr: numericCasted(),
  p_type_manure: boolean(),
  p_type_mineral: boolean(),
  p_type_compost: boolean(),
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

// IAM part
// IN DEVELOPMENT!!
// Will be more advanced in future updates

export const users = fdmSchema.table('users', {
  user_id: text().primaryKey(),  
  firstname: text(),
  surname: text(),
  email: text(),
  created: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updated: timestamp({ withTimezone: true })
}, (table) => {
  return {
    user_id_idx: uniqueIndex('user_id_idx').on(table.user_id)
  }
})

export type usersTypeSelect = typeof users.$inferSelect
export type usersTypeInsert = typeof users.$inferInsert

export const session = fdmSchema.table('session', {
  session_id: text().primaryKey(),
  user_id: text().notNull().references(() => users.user_id),
  created: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updated: timestamp({ withTimezone: true })
}, (table) => {
  return {
    session_id_idx: uniqueIndex('session_id_idx').on(table.session_id)
  }
})

export type sessionTypeSelect = typeof session.$inferSelect
export type sessionTypeInsert = typeof session.$inferInsert

export const grants = fdmSchema.table('grants', {
  b_farm_id: text().notNull().references(() => farms.b_id_farm),
  user_id: text().notNull().references(() => users.user_id),
  created: timestamp({ withTimezone: true }).notNull().defaultNow(),
  destroyed: timestamp({ withTimezone: true })
})

export type grantsTypeSelect = typeof grants.$inferSelect
export type grantsTypeInsert = typeof grants.$inferInsert