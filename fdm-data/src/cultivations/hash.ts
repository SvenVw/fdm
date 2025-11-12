/**
 * @file This file contains a function for hashing cultivation data.
 */
import { ensureInitialized, h32ToString } from "../hash"
import type { CatalogueCultivationItem } from "./d"

/**
 * Generates a hash for a cultivation item.
 *
 * This function creates a hash based on the properties of a cultivation item, which can be used
 * to uniquely identify it.
 *
 * @param cultivation The cultivation item to hash.
 * @returns A promise that resolves to the hash string.
 */
export async function hashCultivation(cultivation: CatalogueCultivationItem) {
    await ensureInitialized()
    // Set hash to null for consistent hashing
    cultivation.hash = null

    // Remove all keys without a value
    const filteredCultivation = Object.fromEntries(
        Object.entries(cultivation).filter(
            ([, value]) => value !== undefined && value !== null,
        ),
    )

    // Sort keys to ensure consistent hash generation for identical objects
    const sortedKeys = Object.keys(filteredCultivation).sort()
    const sortedCultivation = sortedKeys.reduce<Record<string, unknown>>(
        (obj, key) => {
            obj[key] = cultivation[key as keyof typeof cultivation]
            return obj
        },
        {},
    )

    const hash = h32ToString(JSON.stringify(sortedCultivation))
    return hash
}
