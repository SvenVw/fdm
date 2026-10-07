import { useState } from "react"

/**
 * State that resets to `initial(key)` whenever `key` changes, without setting state during render
 * or in an effect. A value set by the user only counts for the key it was set under.
 */
export function useKeyedState<K, V>(
  key: K,
  initial: (key: K) => V,
): [V, (next: V | ((prev: V) => V)) => void] {
  const [stored, setStored] = useState<{ key: K; value: V } | null>(null)
  const value = stored !== null && Object.is(stored.key, key) ? stored.value : initial(key)
  const setValue = (next: V | ((prev: V) => V)) =>
    setStored((prev) => {
      const current = prev !== null && Object.is(prev.key, key) ? prev.value : initial(key)
      return { key, value: typeof next === "function" ? (next as (prev: V) => V)(current) : next }
    })
  return [value, setValue]
}
