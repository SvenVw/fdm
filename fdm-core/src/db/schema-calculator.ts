import {
    json,
    pgSchema,
    primaryKey,
    serial,
    text,
    timestamp,
} from "drizzle-orm/pg-core"

export const fdmCalculatorSchema = pgSchema("fdm-calculator")
export type fdmSchemaAuthNTypeSelect = typeof fdmCalculatorSchema.table

export const calculationCache = fdmCalculatorSchema.table(
    "calculation_cache",
    {
        calculation_type: text().notNull(),
        input_hash: text().notNull(),
        calculator_version: text(),
        inputs: json(),
        result: json(),
        created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
    },
    (table) => {
        return [
            {
                pk: primaryKey({
                    columns: [table.calculation_type, table.input_hash],
                }),
            },
        ]
    },
)

export const calculationErrors = fdmCalculatorSchema.table(
    "calculation_errors",
    {
        id: serial().primaryKey(),
        calculation_type: text(),
        calculator_version: text(),
        inputs: json(),
        error_message: text(),
        stack_trace: text(),
        created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
    },
)

export type CalculationCacheTypeSelect = typeof calculationCache.$inferSelect
