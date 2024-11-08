// import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { fdmSchema as schema } from '@svenvw/fdm-core'
import {extendFertilizersCatalogue} from '@svenvw/fdm-data'

// Get credentials to connect to db
const host = process.env.POSTGRES_HOST
const port = Number(process.env.POSTGRES_PORT)
const user = String(process.env.POSTGRES_USER)
const password = String(process.env.POSTGRES_PASSWORD)
const database = String(process.env.POSTGRES_DB)
const migrationsFolderPath = 'node_modules/@svenvw/fdm-core/dist/db/migrations'

export const fdm = drizzle({
  connection : {
    user : user,
    password : password,
    host : host,
    port : port,
    database : database
  },
  logger: false,
  schema: schema
})

// Run migration
await migrate(fdm, { migrationsFolder: migrationsFolderPath, migrationsSchema: 'fdm-migrations' })

// Add SRM fertilzers to catalogue
await extendFertilizersCatalogue(fdm, 'srm')