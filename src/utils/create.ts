import { assert } from './assert.ts'
import { coerce } from './coerce.ts'

import type { Guard } from '../guards/index.ts'

// deno-lint-ignore no-explicit-any
const CREATORS = new WeakMap<Guard<unknown>, (input: unknown) => any>()

export const create = <T>(guard: Guard<T>): ((input: unknown) => T) => {
  const existingCreator = CREATORS.get(guard)

  if (existingCreator !== undefined) {
    return existingCreator as (input: unknown) => T
  }

  const coerceInput = coerce(guard)

  const creator = (input: unknown): T => {
    const coercedInput = coerceInput(input)

    assert(guard, coercedInput)

    return coercedInput
  }

  CREATORS.set(guard, creator)

  return creator
}
