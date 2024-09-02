import { type } from './type.ts'

import type { Guard } from './guard.ts'

const BOOLEAN = type('boolean')

export function boolean(): Guard<boolean> {
  return BOOLEAN
}
