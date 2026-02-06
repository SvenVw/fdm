import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import type { PgTransaction } from "drizzle-orm/pg-core"
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js"
import * as schema from "./db/schema"

export type FdmServerType = PostgresJsDatabase<typeof schema>
export type FdmServerTransactionType = PgTransaction<
    PostgresJsQueryResultHKT,
    typeof schema,
    typeof schema
>
