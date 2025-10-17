import { and, eq } from "drizzle-orm"
import type { drizzle } from "drizzle-orm/postgres-js"
import { beforeEach, describe, expect, inject, it } from "vitest"
import {
    getCalculationInputHash,
    setCachedCalculation,
    withCalculationCache,
} from "./calculator"
import { calculationCache, calculationErrors } from "./db/schema-calculator"
import { createFdmServer, type FdmServerType } from "./fdm-server"

describe("withCalculationCache", () => {
    let fdm: FdmServerType

    beforeEach(async () => {
        const host = inject("host")
        const port = inject("port")
        const user = inject("user")
        const password = inject("password")
        const database = inject("database")
        fdm = createFdmServer(host, port, user, password, database)
    })

    it("should calculate if no cached result is present", async () => {
        async function calculate() {
            return "correct result"
        }

        const getCalculation = withCalculationCache(
            "calculation-1",
            "1.0.0",
            calculate,
        )

        await setCachedCalculation(
            fdm,
            "calculation-1",
            "1.0.0",
            { a: "other value" },
            "wrong result",
        )

        await expect(getCalculation(fdm, { a: "my value" })).resolves.toBe(
            "correct result",
        )
    })

    it("should record errors", async () => {
        async function calculate() {
            throw new Error("error occurred")
        }

        const getCalculation = withCalculationCache(
            "test-throwing-calculation",
            "1.0.0",
            calculate,
        )

        // Delete leftovers from previous run
        await fdm
            .delete(calculationCache)
            .where(
                eq(
                    calculationCache.calculation_type,
                    "test-throwing-calculation",
                ),
            )
        await fdm
            .delete(calculationErrors)
            .where(
                eq(
                    calculationErrors.calculation_type,
                    "test-throwing-calculation",
                ),
            )

        await expect(getCalculation(fdm, {})).rejects.toThrow("error occurred")

        expect(
            fdm
                .select()
                .from(calculationCache)
                .where(
                    eq(
                        calculationCache.calculation_type,
                        "test-throwing-calculation",
                    ),
                ),
        ).resolves.toHaveLength(0)

        expect(
            fdm
                .select()
                .from(calculationErrors)
                .where(
                    and(
                        eq(
                            calculationErrors.calculation_type,
                            "test-throwing-calculation",
                        ),
                        eq(calculationErrors.error_message, "error occurred"),
                    ),
                ),
        ).resolves.toHaveLength(1)
    })

    it("should not calculate cached result is present for the same input", async () => {
        // Delete leftovers from previous run
        await fdm
            .delete(calculationCache)
            .where(
                eq(
                    calculationCache.calculation_type,
                    "test-calculation-cached",
                ),
            )

        async function calculate() {
            throw new Error("Calculation shouldn't be redone.")
        }

        const getCalculation = withCalculationCache(
            "test-calculation-cached",
            "1.0.0",
            calculate,
        )

        await setCachedCalculation(
            fdm,
            "test-calculation-cached",
            "1.0.0",
            { a: "same value" },
            "correct result",
        )

        expect(getCalculation(fdm, { a: "same value" })).resolves.toBe(
            "correct result",
        )

        // There shouldn't be a duplicate cached result
        expect(
            fdm
                .select()
                .from(calculationCache)
                .where(
                    eq(
                        calculationCache.input_hash,
                        getCalculationInputHash("1.0.0", { a: "same value" }),
                    ),
                ),
        ).resolves.toHaveLength(1)
    })
})
