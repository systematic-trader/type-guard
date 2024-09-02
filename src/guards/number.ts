import equal from 'npm:fast-deep-equal@3.1.3'
import { Guard } from './guard.ts'
import { type } from './type.ts'

import type { Invalidation } from './errors.ts'

export interface NumberGuardSettings {
  /** Output of coerce will be rounded to the given precision. If no precision given, output of coerce will be an integer */
  readonly round?: undefined | boolean
  /** Input must be of total decimal points */
  readonly precision?: undefined | number
  /** Input must be below exclusive maximal value */
  readonly exclusiveMaximum?: undefined | number
  /** Input must be below exclusive minimal value */
  readonly exclusiveMinimum?: undefined | number
  /** Input must be below or equal inclusive maximal value */
  readonly maximum?: undefined | number
  /** Input must be above or equal inclusive maximal value */
  readonly minimum?: undefined | number
  /** Parity of the input */
  readonly parity?:
    | undefined
    | 'even'
    | 'odd'
    | { readonly multipleOf: number; readonly offset?: undefined | number }
}

let NUMBER: undefined | Guard<number> = undefined

export const number = (settings?: NumberGuardSettings): Guard<number> => {
  if (
    settings === undefined ||
    Object.values(settings).every((setting) => setting === undefined)
  ) {
    if (NUMBER === undefined) {
      NUMBER = type('number')
    }

    return NUMBER
  }

  const {
    round,
    precision,
    exclusiveMaximum,
    exclusiveMinimum,
    maximum,
    minimum,
    parity,
  } = settings

  if (round !== undefined && typeof round !== 'boolean') {
    throw new Error('"round" must be undefined or a boolean')
  }

  if (
    precision !== undefined &&
    (typeof precision !== 'number' ||
      Number.isFinite(precision) === false ||
      precision % 1 !== 0 ||
      precision < 0)
  ) {
    throw new Error(
      '"precision" must be undefined or a number of non-negative integer'
    )
  }

  if (
    exclusiveMaximum !== undefined &&
    (typeof exclusiveMaximum !== 'number' ||
      (typeof exclusiveMaximum === 'number' &&
        Number.isFinite(exclusiveMaximum) === false))
  ) {
    throw new Error('"exclusiveMaximum" must be undefined or a number')
  }

  if (
    exclusiveMinimum !== undefined &&
    (typeof exclusiveMinimum !== 'number' ||
      (typeof exclusiveMinimum === 'number' &&
        Number.isFinite(exclusiveMinimum) === false))
  ) {
    throw new Error('"exclusiveMinimum" must be undefined or a number')
  }

  if (
    maximum !== undefined &&
    (typeof maximum !== 'number' ||
      (typeof maximum === 'number' && Number.isFinite(maximum) === false))
  ) {
    throw new Error('"maximum" must be undefined or a number')
  }

  if (
    minimum !== undefined &&
    (typeof minimum !== 'number' ||
      (typeof minimum === 'number' && Number.isFinite(minimum) === false))
  ) {
    throw new Error('"minimum" must be undefined or a number')
  }

  if (
    (parity !== undefined &&
      parity !== 'even' &&
      parity !== 'odd' &&
      typeof parity !== 'object') ||
    (typeof parity === 'object' &&
      (typeof parity.multipleOf !== 'number' ||
        (typeof parity.multipleOf === 'number' &&
          Number.isFinite(parity.multipleOf) === false)) &&
      parity.offset !== undefined &&
      (typeof parity.offset !== 'number' ||
        (typeof parity.offset === 'number' &&
          Number.isFinite(parity.offset) === false)))
  ) {
    throw new Error(
      '"parity" must be undefined, "even" or "odd" or an object with "multipleOf" and an optional "offset"'
    )
  }

  const accept = createAcceptMethod(settings)
  const coerce = createCoerceMethod(settings)
  const validate = createValidateMethod(settings)

  const numberGuard = new Guard({
    name: 'number',

    type: ['number'],

    arguments: [settings],

    accept,

    coerce,

    equals(other): other is Guard<number> {
      if (numberGuard === other) {
        return true
      }

      return (
        other instanceof Guard &&
        other.name === 'number' &&
        equal(settings, other.arguments[0])
      )
    },

    validate,
  })

  return numberGuard
}

const { abs } = Math

const createAcceptMethod = (
  settings: NumberGuardSettings
): Guard<number>['accept'] => {
  let isNumber = (input: unknown): input is number =>
    Guard.getType(input) === 'number'

  const {
    precision,
    exclusiveMaximum,
    exclusiveMinimum,
    maximum,
    minimum,
    parity,
  } = settings

  if (precision !== undefined) {
    const previous = isNumber

    isNumber = (input): input is number => {
      if (previous(input)) {
        return countDecimals(input) <= precision
      }

      return false
    }
  }

  if (exclusiveMaximum !== undefined) {
    const previous = isNumber

    isNumber = (input): input is number => {
      if (previous(input)) {
        return exclusiveMaximum > input
      }

      return false
    }
  }

  if (exclusiveMinimum !== undefined) {
    const previous = isNumber

    isNumber = (input): input is number => {
      if (previous(input)) {
        return exclusiveMinimum < input
      }

      return false
    }
  }

  if (maximum !== undefined) {
    const previous = isNumber

    isNumber = (input): input is number => {
      if (previous(input)) {
        return maximum >= input
      }

      return false
    }
  }

  if (minimum !== undefined) {
    const previous = isNumber

    isNumber = (input): input is number => {
      if (previous(input)) {
        return minimum <= input
      }
      return false
    }
  }

  if (parity === 'even') {
    const previous = isNumber

    isNumber = (input): input is number => {
      if (previous(input)) {
        return input % 2 === 0
      }

      return false
    }
  } else if (parity === 'odd') {
    const previous = isNumber

    isNumber = (input): input is number => {
      if (previous(input)) {
        return abs(input) % 2 === 1
      }

      return false
    }
  } else if (typeof parity === 'object') {
    const previous = isNumber

    const { multipleOf, offset } = parity

    isNumber =
      offset === undefined
        ? (input): input is number => {
            if (previous(input)) {
              return abs(input) % multipleOf === 0
            }

            return false
          }
        : (input): input is number => {
            if (previous(input)) {
              const inputDecimals = countDecimals(input)
              const offsetDecimals = countDecimals(offset)
              const decimals = Math.max(inputDecimals, offsetDecimals)

              const remainder =
                decimals === 0
                  ? (input - offset) % multipleOf
                  : ((input * 10 ** decimals - offset * 10 ** decimals) /
                      10 ** decimals) %
                    multipleOf

              return remainder === 0
            }

            return false
          }
  }

  return isNumber
}

const createCoerceMethod = (
  settings: NumberGuardSettings
): Guard<number>['coerce'] => {
  const { round, precision } = settings

  if (round === true) {
    const scale = precision ?? 0

    return (input: unknown) =>
      Guard.getType(input) === 'number'
        ? {
            skipCoerce: false,
            value: roundNumber(input as number, scale),
          }
        : {
            skipCoerce: false,
            value: input,
          }
  }

  return (input: unknown) => ({ skipCoerce: true, value: input })
}

const createValidateMethod = (
  settings: NumberGuardSettings
): Guard<number>['validate'] => {
  let validate = (
    _input: number,
    _path: ReadonlyArray<number | string | symbol>,
    _invalidations: Invalidation[]
  ): _input is number => true

  const {
    precision,
    exclusiveMaximum,
    exclusiveMinimum,
    maximum,
    minimum,
    parity,
  } = settings

  if (precision !== undefined) {
    const previous = validate

    validate = (input, path, invalidations): input is number => {
      const isValid = previous(input, path, invalidations)

      if (countDecimals(input) > precision) {
        invalidations.push({
          rule: 'logical',
          guard: 'number',
          path,
          function: 'precision',
          setting: precision,
          actual: countDecimals(input),
        })

        return false
      }

      return isValid
    }
  }

  if (exclusiveMaximum !== undefined) {
    const previous = validate

    validate = (input, path, invalidations): input is number => {
      const isValid = previous(input, path, invalidations)

      if (exclusiveMaximum <= input) {
        invalidations.push({
          rule: 'logical',
          guard: 'number',
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

    validate = (input, path, invalidations): input is number => {
      const isValid = previous(input, path, invalidations)

      if (exclusiveMinimum >= input) {
        invalidations.push({
          rule: 'logical',
          guard: 'number',
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

    validate = (input, path, invalidations): input is number => {
      const isValid = previous(input, path, invalidations)

      if (maximum < input) {
        invalidations.push({
          rule: 'logical',
          guard: 'number',
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

    validate = (input, path, invalidations): input is number => {
      const isValid = previous(input, path, invalidations)

      if (minimum > input) {
        invalidations.push({
          rule: 'logical',
          guard: 'number',
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

    validate = (input, path, invalidations): input is number => {
      const isValid = previous(input, path, invalidations)

      if (abs(input) % 2 !== 0) {
        invalidations.push({
          rule: 'logical',
          guard: 'number',
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

    validate = (input, path, invalidations): input is number => {
      const isValid = previous(input, path, invalidations)

      if (abs(input) % 2 !== 1) {
        invalidations.push({
          rule: 'logical',
          guard: 'number',
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
        ? (input, path, invalidations): input is number => {
            const isValid = previous(input, path, invalidations)

            if (abs(input) % multipleOf !== 0) {
              invalidations.push({
                rule: 'logical',
                guard: 'number',
                path,
                function: 'parity',
                setting: parity,
                actual: input,
              })

              return false
            }

            return isValid
          }
        : (input, path, invalidations): input is number => {
            const isValid = previous(input, path, invalidations)

            const inputDecimals = countDecimals(input)
            const offsetDecimals = countDecimals(offset)
            const decimals = Math.max(inputDecimals, offsetDecimals)

            const remainder =
              decimals === 0
                ? (input - offset) % multipleOf
                : ((input * 10 ** decimals - offset * 10 ** decimals) /
                    10 ** decimals) %
                  multipleOf

            if (remainder !== 0) {
              invalidations.push({
                rule: 'logical',
                guard: 'number',
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

  const typeGuard = type('number')

  return (input, path, invalidations): input is number =>
    typeGuard.validate(input, path, invalidations)
      ? validate(input, path, invalidations)
      : false
}

function roundNumber(input: number, scale: number) {
  if (scale === 0) {
    return Math.round(input)
  }

  const inputAsString = input.toString()

  if (inputAsString.includes('e') === false) {
    // eslint-disable-next-line sonarjs/no-nested-template-literals -- false positive
    return Number(`${Math.round(Number(`${input}e+${scale}`))}e-${scale}`)
  }

  const [base, exponent] = inputAsString.split('e') as [string, string]

  const sign = Number(exponent) + scale > 0 ? '+' : ''

  const lifted = Number(`${base}e${sign}${exponent}${scale}`)

  return Number(`${Math.round(lifted)}e-${scale}`)
}

function countDecimals(input: number) {
  if (Math.floor(input.valueOf()) === input.valueOf()) {
    return 0
  }

  let decimals = 0

  while (Math.round(input * 10 ** decimals) / 10 ** decimals !== input) {
    decimals++

    if (decimals > 100) {
      // Not possible - abort
      decimals = Number.NaN
      break
    }
  }

  return decimals
}
