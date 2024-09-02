import { type } from './type.ts'

import type { Guard } from './guard.ts'

let UNKNOWN: undefined | Guard<unknown> = undefined

export function unknown(): Guard<unknown> {
  if (UNKNOWN === undefined) {
    UNKNOWN = type('unknown')
  }

  return UNKNOWN
}
