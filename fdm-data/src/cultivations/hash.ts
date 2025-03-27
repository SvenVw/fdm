import type { CatalogueCultivationItem } from "./d"
import xxhash from "xxhash-wasm"

const { h32ToString } = await xxhash()

export function hashCultivation(cultivation: CatalogueCultivationItem) {
    const hash = h32ToString(JSON.stringify(cultivation))
    return hash
}
