import { ensureInitialized, h32ToString } from "../hash"
import type { CatalogueCultivationItem } from "./d"

export async function hashCultivation(cultivation: CatalogueCultivationItem) {
    await ensureInitialized()
    // Set hash to null for constistent hashing
    cultivation.hash = null

    // Remove all keys without a value
    const filteredCultivation = Object.fromEntries(
        Object.entries(cultivation).filter(
            ([, value]) => value !== undefined || value !== null,
        ),
    )

    // Sort keys to ensure consistent hash generation for identical objects
    const sortedKeys = Object.keys(filteredCultivation).sort()
    const sortedCultivation = sortedKeys.reduce((obj: any, key) => {
        obj[key] = cultivation[key as keyof typeof cultivation]
        return obj
    }, {})

    const hash = h32ToString(JSON.stringify(sortedCultivation))
    return hash
}
