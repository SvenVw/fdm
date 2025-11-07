/**
 * @file This file contains a function for hashing fertilizer data.
 */
import { ensureInitialized, h32ToString } from "../hash"
import type { CatalogueFertilizerItem } from "./d"

/**
 * Generates a hash for a fertilizer item.
 *
 * This function creates a hash based on the properties of a fertilizer item, which can be used
 * to uniquely identify it.
 *
 * @param fertilizer The fertilizer item to hash.
 * @returns A promise that resolves to the hash string.
 */
export async function hashFertilizer(fertilizer: CatalogueFertilizerItem) {
    await ensureInitialized()
    // Set hash to null for consistent hashing
    fertilizer.hash = null

    // Remove all keys without a value
    const filteredFertilizer = Object.fromEntries(
        Object.entries(fertilizer).filter(
            ([, value]) => value !== undefined && value !== null,
        ),
    )

    // Sort keys to ensure consistent hash generation for identical objects
    const sortedKeys = Object.keys(filteredFertilizer).sort()
    const sortedFertilizer = sortedKeys.reduce<Record<string, unknown>>(
        (obj, key) => {
            obj[key] = fertilizer[key as keyof typeof fertilizer]
            return obj
        },
        {},
    )

    const hash = h32ToString(JSON.stringify(sortedFertilizer))
    return hash
}
