import { type } from './type.ts'
import { union } from './union.ts'

import type { Guard } from './guard.ts'

const CACHE = new WeakMap<object, Guard<unknown>>()

export function required<T>(guard: Guard<null | undefined | T>): Guard<T> {
  const existing = CACHE.get(guard)

  if (existing !== undefined) {
    return existing as Guard<T>
  }

  if (guard.name === 'type') {
    const requiredTypes = guard.type.filter((name) => name !== 'undefined' && name !== 'null')

    return type(requiredTypes) as Guard<T>
  }

  if (guard.name === 'union') {
    const distinctMembers = guard.arguments[0] as ReadonlyArray<Guard<unknown>>

    const distinctMembersWithoutUndefined = distinctMembers.filter(
      (member) =>
        (member.name === 'type' && (member.type.includes('undefined') || member.type.includes('null'))) === false,
    )

    const requiredGuard = union(distinctMembersWithoutUndefined) as Guard<T>

    CACHE.set(guard, requiredGuard)

    return requiredGuard
  }

  return guard as Guard<T>
}
