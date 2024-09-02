import type { Guard } from '../guards/index.ts'

const IsGuards = new WeakMap<WeakKey, (input: boolean) => boolean>()

/**
 * Test that `input` is valid, returning a boolean representing whether it is valid or not.
 * @param guard type-guard to check against
 */
export const is = <T>(
  guard: Guard<T>
): /**
 * Test that `input` is valid, returning a boolean representing whether it is valid or not.
 * @param input to be checked
 */
((input: unknown) => input is T) => {
  const existingIs = IsGuards.get(guard)

  if (existingIs !== undefined) {
    return existingIs as (input: unknown) => input is T
  }

  const isGuard = (input: unknown): input is T => guard.accept(input)

  IsGuards.set(guard, isGuard)

  return isGuard
}
