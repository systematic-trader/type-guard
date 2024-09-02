import equal from 'npm:fast-deep-equal@3.1.3'
import { Guard } from './guard.ts'
import { type } from './type.ts'

import type { Invalidation } from './errors.ts'

export interface BigIntGuardSettings {
  /** Input must be below exclusive maximal value */
  readonly exclusiveMaximum?: undefined | bigint
  /** Input must be below exclusive minimal value */
  readonly exclusiveMinimum?: undefined | bigint
  /** Input must be below or equal inclusive maximal value */
  readonly maximum?: undefined | bigint
  /** Input must be above or equal inclusive maximal value */
  readonly minimum?: undefined | bigint
  /** Parity of the input */
  readonly parity?:
    | undefined
    | 'even'
    | 'odd'
    | { readonly multipleOf: bigint; readonly offset?: undefined | bigint }
}

let BIGINT: undefined | Guard<bigint> = type('bigint')

export const bigint = (settings?: BigIntGuardSettings): Guard<bigint> => {
  if (
    settings === undefined ||
    Object.values(settings).every((setting) => setting === undefined)
  ) {
    if (BIGINT === undefined) {
      BIGINT = type('bigint')
    }

    return BIGINT as Guard<bigint>
  }

  const { exclusiveMaximum, exclusiveMinimum, maximum, minimum, parity } =
    settings

  if (exclusiveMaximum !== undefined && typeof exclusiveMaximum !== 'bigint') {
    throw new Error('"exclusiveMaximum" must be undefined or a bigint')
  }

  if (exclusiveMinimum !== undefined && typeof exclusiveMinimum !== 'bigint') {
    throw new Error('"exclusiveMinimum" must be undefined or a bigint')
  }

  if (maximum !== undefined && typeof maximum !== 'bigint') {
    throw new Error('"maximum" must be undefined or a bigint')
  }

  if (minimum !== undefined && typeof minimum !== 'bigint') {
    throw new Error('"minimum" must be undefined or a bigint')
  }

  if (
    (parity !== undefined &&
      parity !== 'even' &&
      parity !== 'odd' &&
      typeof parity !== 'object') ||
    (typeof parity === 'object' &&
      typeof parity.multipleOf !== 'bigint' &&
      parity.offset !== undefined &&
      typeof parity.offset !== 'bigint')
  ) {
    throw new Error(
      '"parity" must be undefined, "even" or "odd" or an object with "multipleOf" and an optional "offset"'
    )
  }

  const accept = createAcceptMethod(settings)
  const validate = createValidateMethod(settings)

  const bigintGuard = new Guard({
    name: 'bigint',

    type: ['bigint'],

    arguments: [settings],

    accept,

    equals(other): other is Guard<bigint> {
      if (bigintGuard === other) {
        return true
      }

      return (
        other instanceof Guard &&
        other.name === 'bigint' &&
        equal(settings, other.arguments[0])
      )
    },

    validate,
  })

  return bigintGuard
}

const abs = (input: bigint) => (input < 0n ? -1n * input : input)

const createAcceptMethod = (
  settings: BigIntGuardSettings
): Guard<bigint>['accept'] => {
  let isBigInt = (input: unknown): input is bigint => typeof input === 'bigint'

  const { exclusiveMaximum, exclusiveMinimum, maximum, minimum, parity } =
    settings

  if (exclusiveMaximum !== undefined) {
    const previous = isBigInt

    isBigInt = (input): input is bigint => {
      if (previous(input)) {
        return exclusiveMaximum > input
      }

      return false
    }
  }

  if (exclusiveMinimum !== undefined) {
    const previous = isBigInt

    isBigInt = (input): input is bigint => {
      if (previous(input)) {
        return exclusiveMinimum < input
      }

      return false
    }
  }

  if (maximum !== undefined) {
    const previous = isBigInt

    isBigInt = (input): input is bigint => {
      if (previous(input)) {
        return maximum >= input
      }

      return false
    }
  }

  if (minimum !== undefined) {
    const previous = isBigInt

    isBigInt = (input): input is bigint => {
      if (previous(input)) {
        return minimum <= input
      }
      return false
    }
  }

  if (parity === 'even') {
    const previous = isBigInt

    isBigInt = (input): input is bigint => {
      if (previous(input)) {
        return abs(input) % 2n === 0n
      }

      return false
    }
  } else if (parity === 'odd') {
    const previous = isBigInt

    isBigInt = (input): input is bigint => {
      if (previous(input)) {
        return abs(input) % 2n === 1n
      }

      return false
    }
  } else if (typeof parity === 'object') {
    const previous = isBigInt

    const { multipleOf, offset } = parity

    isBigInt =
      offset === undefined
        ? (input): input is bigint =>
            previous(input) && abs(input) % multipleOf === 0n
        : (input): input is bigint => {
            if (previous(input)) {
              return abs(input) % multipleOf === offset
            }

            return false
          }
  }

  return isBigInt
}

const createValidateMethod = (
  settings: BigIntGuardSettings
): Guard<bigint>['validate'] => {
  let validate = (
    _input: bigint,
    _path: ReadonlyArray<number | string | symbol>,
    _invalidations: Invalidation[]
  ): _input is bigint => true

  const { exclusiveMaximum, exclusiveMinimum, maximum, minimum, parity } =
    settings

  if (exclusiveMaximum !== undefined) {
    const previous = validate

    validate = (input, path, invalidations): input is bigint => {
      const isValid = previous(input, path, invalidations)

      if (exclusiveMaximum <= input) {
        invalidations.push({
          rule: 'logical',
          guard: 'bigint',
          path,
          function: 'exclusiveMaximum',
          setting: exclusiveMaximum,
          actual: input,
        })

        return false
      }

      return isValid
    }
  }

  if (exclusiveMinimum !== undefined) {
    const previous = validate

    validate = (input, path, invalidations): input is bigint => {
      const isValid = previous(input, path, invalidations)

      if (exclusiveMinimum >= input) {
        invalidations.push({
          rule: 'logical',
          guard: 'bigint',
          path,
          function: 'exclusiveMinimum',
          setting: exclusiveMinimum,
          actual: input,
        })

        return false
      }

      return isValid
    }
  }

  if (maximum !== undefined) {
    const previous = validate

    validate = (input, path, invalidations): input is bigint => {
      const isValid = previous(input, path, invalidations)

      if (maximum < input) {
        invalidations.push({
          rule: 'logical',
          guard: 'bigint',
          path,
          function: 'maximum',
          setting: maximum,
          actual: input,
        })

        return false
      }

      return isValid
    }
  }

  if (minimum !== undefined) {
    const previous = validate

    validate = (input, path, invalidations): input is bigint => {
      const isValid = previous(input, path, invalidations)

      if (minimum > input) {
        invalidations.push({
          rule: 'logical',
          guard: 'bigint',
          path,
          function: 'minimum',
          setting: minimum,
          actual: input,
        })

        return false
      }

      return isValid
    }
  }

  if (parity === 'even') {
    const previous = validate

    validate = (input, path, invalidations): input is bigint => {
      const isValid = previous(input, path, invalidations)

      if (abs(input) % 2n !== 0n) {
        invalidations.push({
          rule: 'logical',
          guard: 'bigint',
          path,
          function: 'parity',
          setting: parity,
          actual: input,
        })

        return false
      }

      return isValid
    }
  } else if (parity === 'odd') {
    const previous = validate

    validate = (input, path, invalidations): input is bigint => {
      const isValid = previous(input, path, invalidations)

      if (abs(input) % 2n !== 1n) {
        invalidations.push({
          rule: 'logical',
          guard: 'bigint',
          path,
          function: 'parity',
          setting: parity,
          actual: input,
        })

        return false
      }

      return isValid
    }
  } else if (typeof parity === 'object') {
    const { multipleOf, offset } = parity

    const previous = validate

    validate =
      offset === undefined
        ? (input, path, invalidations): input is bigint => {
            const isValid = previous(input, path, invalidations)

            if (abs(input) % multipleOf !== 0n) {
              invalidations.push({
                rule: 'logical',
                guard: 'bigint',
                path,
                function: 'parity',
                setting: parity,
                actual: input,
              })

              return false
            }

            return isValid
          }
        : (input, path, invalidations): input is bigint => {
            const isValid = previous(input, path, invalidations)

            if (abs(input) % multipleOf !== offset) {
              invalidations.push({
                rule: 'logical',
                guard: 'bigint',
                path,
                function: 'parity',
                setting: parity,
                actual: input,
              })

              return false
            }

            return isValid
          }
  }

  const bigintGuard = type('bigint')

  return (input, path, previous): input is bigint =>
    bigintGuard.validate(input, path, previous)
      ? validate(input as bigint, path, previous)
      : false
}
