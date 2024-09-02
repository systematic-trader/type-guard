import { assert } from './assert.ts'

import type { Guard } from '../guards/guard.ts'

type Key = keyof never

export interface ScanOptions {
  /** return false if you want to stop converting */
  readonly continue?:
    | undefined
    | ((
        path: ReadonlyArray<number | string | symbol>,
        guard: Guard<unknown>
      ) => boolean)
  readonly maxPathLength?: undefined | number
}

/**
 * Scan a `input` of any depth using scanner.
 * @param guard type-guard used for scanning
 * @param scanner custom converter
 */
export function scan(
  guard: Guard<unknown>,
  scanner: (
    input: unknown,
    path: readonly Key[],
    guard: Guard<unknown>,
    context: undefined
  ) => void,
  options?: undefined | ScanOptions
): /**
 * Scan a `input` of any depth using scanner.
 * @param input to be scanned
 */
(input: unknown) => void
/**
 * Scan a `input` of any depth using scanner.
 * @param guard type-guard used for scanning
 * @param scanner custom converter
 */
export function scan<Context extends undefined | object>(
  guard: Guard<unknown>,
  scanner: (
    input: unknown,
    path: readonly Key[],
    guard: Guard<unknown>,
    context: Context
  ) => void,
  options?: undefined | ScanOptions
): /**
 * Scan a `input` of any depth using scanner.
 * @param input to be scanned
 * @param context to inject in scanner
 */
(input: unknown, context: Context, skipAssertion?: boolean) => void
export function scan<Context extends undefined | object = undefined>(
  guard: Guard<unknown>,
  scanner: (
    input: unknown,
    path: readonly Key[],
    guard: Guard<unknown>,
    context: Context
  ) => void,
  options: undefined | ScanOptions = {}
): (input: unknown, context?: Context, skipAssertion?: boolean) => void {
  return (input, context, skipAssertion) => {
    if (skipAssertion !== true) {
      assert(guard, input)
    }

    guard.scan<Context>(input, context as Context, [], scanner, options)
  }
}
