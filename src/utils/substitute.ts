import type { Guard } from '../guards/guard.ts'

export const substitute = <T extends Guard<unknown> = Guard<unknown>>(
  guard: Guard<unknown>,
  replacer: (
    path: ReadonlyArray<number | string | symbol>,
    guard: Guard<unknown>
  ) => Guard<unknown>
): T => guard.substitute([], replacer) as T
