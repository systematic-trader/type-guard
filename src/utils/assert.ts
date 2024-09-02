import { is } from './is.ts'
import { AssertionError } from '../guards/index.ts'

import type { Guard, Invalidation } from '../guards/index.ts'

type Assert = <T>(
  guard: Guard<T>,
  input: unknown,
  error?:
    | undefined
    | string
    | Error
    | ((invalidations: readonly Invalidation[]) => Error)
) => asserts input is T

/**
 * Asserts `input` to be valid according to `guard`. If `input` is invalid a AssertionError will be thrown.
 * @param guard type-guard used for assertion
 * @param input input to be asserted
 * @param error error to be trown when assertion fails
 */
export const assert: Assert = function <T>(
  guard: Guard<T>,
  input: unknown,
  error?: string | Error | ((invalidations: readonly Invalidation[]) => Error)
): asserts input is T {
  if (guard.accept(input) === false) {
    if (error instanceof Error) {
      throw error
    } else if (typeof error === 'string') {
      throw new TypeError(error)
    } else if (typeof error === 'function') {
      const invalidations: Invalidation[] = []
      guard.validate(input, [], invalidations)
      throw error(invalidations)
    } else {
      const invalidations: Invalidation[] = []
      guard.validate(input, [], invalidations)
      throw new AssertionError(invalidations)
    }
  }
}

/**
 * Fake asserts `input` against `guard` to get the correct type for input.
 * @param guard type-guard used for assertion
 * @param input input to be asserted
 * @param error error to be trown when assertion fails
 */

export const fakeAssert: Assert = function <T>(
  _guard: Guard<T>,
  _input: unknown,
  _error?: string | Error | ((invalidations: readonly Invalidation[]) => Error)
  // eslint-disable-next-line @typescript-eslint/no-empty-function -- this is a fake assert
): asserts _input is T {}

/**
 * Asserts `input` against `guard` and returns the asserted input.
 * @param guard type-guard used for assertion
 * @param input input to be asserted
 * @param error error to be trown when assertion fails
 * @returns typed input of the guard´s type
 */
export const assertReturn = <T>(
  guard: Guard<T>,
  input: unknown,
  error?: string | Error | ((invalidations: readonly Invalidation[]) => Error)
): T => {
  assert(guard, input, error)

  return input
}

/**
 * Asserts `input` against `guard` and returns the asserted input if successful, otherwise `undefined`.
 * @param guard type-guard used for assertion
 * @param input input to be asserted
 * @returns typed input of the guard´s type or `undefined`
 */
export const tryAssertReturn = <T>(
  guard: Guard<T>,
  input: unknown
): T | undefined => (is(guard)(input) ? input : undefined)
