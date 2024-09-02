import { type } from './type.ts'
import { union } from './union.ts'

import type { Guard } from './guard.ts'

const CACHE = new WeakMap<object, Guard<unknown>>()

export function nullable<T>(guard: Guard<T>): Guard<null | T> {
  const existing = CACHE.get(guard)

  if (existing !== undefined) {
    return existing as Guard<null | T>
  }

  // eslint-disable-next-line unicorn/no-null -- "null" is a valid type
  if (guard.accept(null)) {
    return guard
  }

  if (guard.name === 'type') {
    return type([...guard.type, 'null']) as Guard<null | T>
  }

  const nullableGuard = union([type(['null']), guard])

  CACHE.set(guard, nullableGuard)

  return nullableGuard
}
