import { ensureInitialized, h32ToString } from "../hash"
import type { CatalogueFertilizerItem } from "./d"

export async function hashFertilizer(fertilizer: CatalogueFertilizerItem) {
    await ensureInitialized()
    
    // Set hash to null for constistent hashing
    fertilizer.hash = null

    // Remove all keys without a value
    const filteredFertilizer = Object.fromEntries(
        Object.entries(fertilizer).filter(
            ([, value]) => value !== undefined || value !== null,
        ),
    )

    // Sort keys to ensure consistent hash generation for identical objects
    const sortedKeys = Object.keys(filteredFertilizer).sort()
    const sortedFertilizer = sortedKeys.reduce((obj: any, key) => {
        obj[key] = fertilizer[key as keyof typeof fertilizer]
        return obj
    }, {})

    const hash = h32ToString(JSON.stringify(sortedFertilizer))
    return hash
}
