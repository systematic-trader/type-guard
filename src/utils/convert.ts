import { assert } from './assert.ts'

import type { Guard } from '../guards/guard.ts'

type Key = keyof never

export function convert<Output = unknown>(
  guard: Guard<unknown>,
  converter: (
    input: unknown,
    path: readonly Key[],
    guard: Guard<unknown>,
    context: undefined
  ) => unknown,
  options?:
    | undefined
    | {
        /** return false if you want to stop converting */
        readonly continue?:
          | undefined
          | ((
              path: ReadonlyArray<number | string | symbol>,
              guard: Guard<unknown>
            ) => boolean)
      }
): /**
 * Convert a `input` of any depth using converter.
 * @param input value to be converted
 * @param context to inject in converter
 */
(input: unknown) => Output
export function convert<Output, Context extends undefined | object>(
  guard: Guard<unknown>,
  converter: (
    input: unknown,
    path: readonly Key[],
    guard: Guard<unknown>,
    context: Context
  ) => unknown,
  options?:
    | undefined
    | {
        /** return false if you want to stop converting */
        readonly continue?:
          | undefined
          | ((
              path: ReadonlyArray<number | string | symbol>,
              guard: Guard<unknown>
            ) => boolean)
      }
): /**
 * Convert a `input` of any depth using converter.
 * @param input value to be converted
 * @param context to inject in converter
 */
(input: unknown, context: Context, skipAssertion?: boolean) => Output
export function convert<
  Output = unknown,
  Context extends undefined | object = undefined
>(
  guard: Guard<unknown>,
  converter: (
    input: unknown,
    path: readonly Key[],
    guard: Guard<unknown>,
    context: Context
  ) => unknown,
  options: {
    /** return false if you want to stop converting */
    readonly continue?:
      | undefined
      | ((
          path: ReadonlyArray<number | string | symbol>,
          guard: Guard<unknown>
        ) => boolean)
  } = {}
): /**
 * Convert a `input` of any depth using converter.
 * @param input value to be converted
 */
(input: unknown, context?: Context, skipAssertion?: boolean) => Output {
  return (input: unknown, context?: Context, skipAssertion?: boolean) => {
    if (skipAssertion !== true) {
      assert(guard, input)
    }

    return guard.convert(
      input,
      context as Context,
      [],
      converter,
      options
    ) as Output
  }
}
