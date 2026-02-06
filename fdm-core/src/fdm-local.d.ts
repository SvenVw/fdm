import type { PgliteDatabase } from "drizzle-orm/pglite"
import type { PgTransaction } from "drizzle-orm/pg-core"
import type { PgliteQueryResultHKT } from "drizzle-orm/pglite"
import * as schema from "./db/schema"

export type FdmLocalType = PgliteDatabase<typeof schema>
export type FdmLocalTransactionType = PgTransaction<
    PgliteQueryResultHKT,
    typeof schema,
    typeof schema
>
