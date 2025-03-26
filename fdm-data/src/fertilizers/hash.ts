import type { CatalogueFertilizerItem } from "./d"
import xxhash from "xxhash-wasm"

const { h32ToString } = await xxhash()

export function hashFertilizer(fertilizer: CatalogueFertilizerItem) {
    const hash = h32ToString(JSON.stringify(fertilizer))
    return hash
}
