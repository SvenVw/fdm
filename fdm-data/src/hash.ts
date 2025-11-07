/**
 * @file This file provides a lazy-initialized hash function.
 *
 * It uses the `xxhash-wasm` library to provide a fast hash function, but it lazy-initializes
 * it to avoid top-level await issues.
 */
import xxhash from "xxhash-wasm"

/**
 * The hash function used to generate a 32-bit hash from a string.
 * This is initialized lazily by `ensureInitialized`.
 */
export let h32ToString: (input: string) => string
let initPromise: Promise<void> | null = null

/**
 * Ensures that the hash function is initialized.
 *
 * This function uses a lazy initialization pattern to avoid a top-level await.
 *
 * @returns A promise that resolves when the hash function is initialized.
 */
export function ensureInitialized() {
    if (!initPromise) {
        initPromise = xxhash().then((hash) => {
            h32ToString = hash.h32ToString
            return
        })
    }
    return initPromise
}
