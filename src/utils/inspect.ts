import type { Guard } from '../guards/index.ts'

export const inspect = <T = unknown>(
  guard: Guard<unknown>,
  inspecter: (
    path: ReadonlyArray<number | string | symbol>,
    guard: Guard<unknown>
  ) => Iterable<T>
): Iterable<T> => guard.inspect([], inspecter)
