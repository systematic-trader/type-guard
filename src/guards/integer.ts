import { number } from './number.ts'

import type { Guard } from './guard.ts'
import type { NumberGuardSettings } from './number.ts'

export interface IntegerGuardSettings
  extends Pick<NumberGuardSettings, 'exclusiveMaximum' | 'exclusiveMinimum' | 'maximum' | 'minimum' | 'parity'> {}

let GuardInteger: undefined | Guard<number> = undefined

export const integer = (settings?: IntegerGuardSettings): Guard<number> => {
  if (settings === undefined || Object.values(settings).every((setting) => setting === undefined)) {
    if (GuardInteger === undefined) {
      GuardInteger = number({ precision: 0 })
    }

    return GuardInteger
  }

  const { exclusiveMaximum, exclusiveMinimum, maximum, minimum, parity } = settings

  if (exclusiveMaximum !== undefined && exclusiveMaximum % 1 !== 0) {
    throw new Error('"exclusiveMaximum" must be undefined or be an integer')
  }

  if (exclusiveMinimum !== undefined && exclusiveMinimum % 1 !== 0) {
    throw new Error('"exclusiveMinimum" must be undefined or be an integer')
  }

  if (maximum !== undefined && maximum % 1 !== 0) {
    throw new Error('"maximum" must be undefined or be an integer')
  }

  if (minimum !== undefined && minimum % 1 !== 0) {
    throw new Error('"minimum" must be undefined or be an integer')
  }

  if (
    (parity !== undefined && parity !== 'even' && parity !== 'odd' && typeof parity !== 'object') ||
    (typeof parity === 'object' &&
      (typeof parity.multipleOf !== 'number' || parity.multipleOf % 1 !== 0) &&
      parity.offset !== undefined &&
      (typeof parity.offset !== 'number' || parity.offset % 1 !== 0))
  ) {
    throw new Error(
      '"parity" must be undefined, "even" or "odd" or an object with "multipleOf" of integer and an optional "offset" of integer',
    )
  }

  return number({
    precision: 0,
    ...settings,
  })
}
