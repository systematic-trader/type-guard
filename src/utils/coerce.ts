import type { Guard } from '../guards/index.ts'

const SkipCoerce = new WeakMap<Guard<unknown>, boolean>()

/**
 * Coerce a `input` using the coercion logic that is built-in to the guard, returning a coerced output.
 * @param guard type-guard used for coercion
 */
export function coerce(guard: Guard<unknown>): /**
 * Coerce a `input` using the coercion logic that is built-in to the guard, returning a coerced output.
 * @param input input to be coerced
 */
(input: unknown) => unknown {
  let skipCoerce = SkipCoerce.get(guard)

  return (input: unknown): unknown => {
    if (skipCoerce === true) {
      return input
    }

    const result = guard.coerce(input, [])

    if (result.skipCoerce === true) {
      skipCoerce = true
      SkipCoerce.set(guard, true)
    }

    return result.value
  }
}
