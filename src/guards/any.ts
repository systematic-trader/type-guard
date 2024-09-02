import { type } from './type.ts'

import type { Guard } from './guard.ts'

// deno-lint-ignore no-explicit-any
let ANY = undefined as undefined | Guard<any>

// deno-lint-ignore no-explicit-any
export function any(): Guard<any> {
  if (ANY === undefined) {
    ANY = type('any')
  }

  // deno-lint-ignore no-explicit-any
  return ANY as Guard<any>
}
