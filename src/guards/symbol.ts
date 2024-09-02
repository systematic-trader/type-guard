import { type } from './type.ts'

import type { Guard } from './guard.ts'

let SYMBOL: undefined | Guard<symbol> = undefined

export function symbol(): Guard<symbol> {
  if (SYMBOL === undefined) {
    SYMBOL = type('symbol')
  }

  return SYMBOL
}
