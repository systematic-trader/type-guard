import { literal } from './literal.ts'
import { never } from './never.ts'
import { union } from './union.ts'

import type { Guard } from './guard.ts'
import type { LiteralType } from './literal.ts'

// /** @deprecated use `literal(1, 2, 3)` */
export function enums<T extends readonly LiteralType[]>(members: readonly [...T]): Guard<T[number]> {
  if (members.length === 0) {
    return never() as Guard<T[number]>
  }

  if (members.length === 1) {
    return literal(members[0])
  }

  return union(members.map((member) => literal(member)))
}
