import { type } from './type.ts'

import type { Guard } from './guard.ts'

let NEVER: undefined | Guard<never> = undefined

export function never(): Guard<never> {
  if (NEVER === undefined) {
    NEVER = type('never')
  }

  return NEVER
}
