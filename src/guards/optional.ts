import { type } from './type.ts'
import { union } from './union.ts'

import type { Guard } from './guard.ts'

const CACHE = new WeakMap<object, Guard<unknown>>()

export function optional<T>(guard: Guard<T>): Guard<undefined | T> {
  const existing = CACHE.get(guard)

  if (existing !== undefined) {
    return existing as Guard<undefined | T>
  }

  if (guard.name === 'type') {
    return type([...guard.type, 'undefined']) as Guard<undefined | T>
  }

  if (guard.accept(undefined)) {
    return guard
  }

  const optionalGuard = union([type('undefined'), guard])

  CACHE.set(guard, optionalGuard)

  return optionalGuard
}
