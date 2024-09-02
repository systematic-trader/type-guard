import type { Guard, Invalidation } from '../guards/index.ts'

const VALIDATORS = new WeakMap<
  Guard<unknown>,
  (input: unknown) => readonly Invalidation[]
>()

/**
 * Validates a `input` and returns an array with invalidations. If the `input` is valid an empty array is returned. If the `input` is invalid an array of Invalidation is returned.
 * @param guard - the type-guard to validate against
 */
export function validate(guard: Guard<unknown>): /**
 * Validates a `input` and returns an array with invalidations. If the `input` is valid an empty array is returned. If the `input` is invalid an array of Invalidation is returned.
 * @param input - to be validated
 */
(input: unknown) => readonly Invalidation[] {
  const existingValidator = VALIDATORS.get(guard)

  if (existingValidator !== undefined) {
    return existingValidator
  }

  const validator = (input: unknown): readonly Invalidation[] => {
    const invalidations: Invalidation[] = []

    guard.validate(input, [], invalidations)

    return invalidations
  }

  VALIDATORS.set(guard, validator)

  return validator
}
