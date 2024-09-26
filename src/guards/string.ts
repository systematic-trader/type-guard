import equal from 'npm:fast-deep-equal@3.1.3'
import { isSemVer } from 'https://deno.land/std@0.224.0/semver/mod.ts'

import { Guard } from './guard.ts'
import { literal } from './literal.ts'
import { number } from './number.ts'
import { type } from './type.ts'

import type { Invalidation } from './errors.ts'
import type { NumberGuardSettings } from './number.ts'

const StringFormats = {
  base64: /^(?:[A-Z\d+/]{4})*(?:[A-Z\d+/]{2}==|[A-Z\d+/]{3}=)?$/i,
  camelcase: /^[a-z]+(?:[A-Z][a-z]+)*$/,
  'date-iso8601':
    /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])(T(0\d|1\d|2[0-3]):[0-5]\d:[0-5]\d(\.\d+)?Z)?$/i,
  // email regex source: https://github.com/epoberezkin/ajv/blob/d5edde43752e8c1bdb26074402452a41fe0742cb/lib/compile/formats.js#L46
  email:
    /^[\w.!#$%&'*+/=?^`{|}~-]+@[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?(?:\.[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?)*$/i,
  'gregorian-date': /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
  'gregorian-year': /^\d{4}$/,
  integer(input: string) {
    const parsed = Number.parseFloat(input)

    return Number.isNaN(parsed) === false && Number.isSafeInteger(parsed)
  },
  json(input: string) {
    try {
      if (typeof input === 'string') {
        JSON.parse(input)

        return true
      }

      return false
    } catch {
      return false
    }
  }, // Details about regex: https://stackoverflow.com/questions/2583472/regex-to-validate-json
  // Rename to 'integer-negative' in next major version
  'negative-integer'(input: string) {
    const parsed = Number.parseFloat(input)

    return (
      Number.isNaN(parsed) === false &&
      parsed < 0 &&
      Number.isSafeInteger(parsed)
    )
  },
  // Rename to 'integer-positive' in next major version
  'positive-integer'(input: string) {
    const parsed = Number.parseFloat(input)

    return (
      Number.isNaN(parsed) === false &&
      parsed > 0 &&
      Number.isSafeInteger(parsed)
    )
  },
  // Rename to 'integer-non-negative' in next major version
  'non-negative-integer'(input: string) {
    const parsed = Number.parseFloat(input)

    return (
      Number.isNaN(parsed) === false &&
      parsed >= 0 &&
      Number.isSafeInteger(parsed)
    )
  },

  // Rename to 'integer-non-positive' in next major version
  'non-positive-integer'(input: string) {
    const parsed = Number.parseFloat(input)

    return (
      Number.isNaN(parsed) === false &&
      parsed <= 0 &&
      Number.isSafeInteger(parsed)
    )
  },
  // Rename to 'number-non-negative' in next major version
  'non-negative-number'(input: string) {
    const parsed = Number.parseFloat(input)

    return Number.isNaN(parsed) === false && parsed >= 0
  },
  // Rename to 'number-non-positive' in next major version
  'non-positive-number'(input: string) {
    const parsed = Number.parseFloat(input)

    return Number.isNaN(parsed) === false && parsed <= 0
  },
  // Rename to 'kebab-case' in next major version
  kebabcase: /^[a-z]([a-z\d-])*[a-z\d]$/,
  // TODO support for custom locale
  number: (input: string) => Number.isNaN(Number.parseFloat(input)) === false,
  // Rename to 'PascalCase' in next major version
  pascalcase: /^[A-Z][a-z]+(?:[A-Z][a-z]+)*$/,
  // TODO semver.coerce
  'semantic-version': (input: string) => isSemVer(input),
  // Rename to 'snake_case' in next major version
  snakecase: /^[a-z][a-z\d_]*$/,
  time12h: /^(0[1-9]|1[0-2]):[0-5]\d(am|pm)$/,
  time24h: /^([01]\d|2[0-3]):[0-5]\d$/,
  'time24h-full': /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/,
  uuid: /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i,
  percent: /^(0%|100%|[1-9]%|[1-9]\d%)$/,
} as const

const STRING_FORMAT_KEYS = Object.keys(StringFormats).sort() as ReadonlyArray<
  keyof typeof StringFormats
>

export interface StringGuardSettings {
  /** Input must be below exclusive maximal value */
  readonly exclusiveMaximum?: undefined | string
  /** Input must be below exclusive minimal value */
  readonly exclusiveMinimum?: undefined | string
  /** Input must be below or equal inclusive maximal value */
  readonly maximum?: undefined | string
  /** Input must be above or equal inclusive minimal value */
  readonly minimum?: undefined | string
  /** Input must match regular expression */
  readonly pattern?: undefined | string | RegExp
  /** enforce specific length */
  readonly length?: undefined | number | Guard<number> | NumberGuardSettings
  /** Input cannot be a empty or with whitespace-only, if true */
  readonly blank?: undefined | boolean
  readonly format?: undefined | (typeof STRING_FORMAT_KEYS)[number]
  /** Input must start with speficied value */
  readonly startsWith?: undefined | string
  /** Input must end with speficied value */
  readonly endsWith?: undefined | string
  /** Output of coerce will be trimmed for heading and tailing whitespaces */
  readonly trim?: undefined | boolean
  // TODO support for custom locale
  /** Input must be the specified casing. Output of coerce will be the specified casing */
  readonly casing?:
    | undefined
    | 'localeLowerCase'
    | 'localeUpperCase'
    | 'lowerCase'
    | 'upperCase'
  // digits?: boolean
  // special?: boolean
}

let GuardString: undefined | Guard<string> = undefined

/**
 * Constructs a type-guard for a `string`
 */
export const string = <S extends string = string>(
  settings: StringGuardSettings = {}
): Guard<S> => {
  if (Object.values(settings).every((setting) => setting === undefined)) {
    if (GuardString === undefined) {
      GuardString = type('string')
    }

    return GuardString as Guard<S>
  }

  const accept = createAcceptMethod<S>(settings)
  const coerce = createCoerceMethod<S>(settings)
  const validate = createValidateMethod<S>(settings)

  const stringGuard = new Guard<S>({
    name: 'string',

    type: ['string'],

    arguments: [settings],

    accept,

    coerce,

    equals(other): other is Guard<S> {
      if (stringGuard === other) {
        return true
      }

      return (
        other instanceof Guard &&
        other.name === 'string' &&
        equal(settings, other.arguments[0])
      )
    },

    validate,
  })

  return stringGuard
}

/**
 * Constructs a type-guard for a `string` of specified format
 * @param name - force string to match predefined format (ie. email or uuid)
 */
export function format(
  name: (typeof STRING_FORMAT_KEYS)[number]
): Guard<string> {
  if (name in FormatGuards) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Guard is defined
    return FormatGuards[name]!
  }

  throw new Error(`Unknown "format": "${name}"`)
}

/**
 * Constructs a type-guard for a `string` of specified pattern
 * @param pattern - check that value matches regular expression
 */
// eslint-disable-next-line @typescript-eslint/no-shadow -- Shadowing is intended
export function pattern<S extends string = string>(
  pattern: NonNullable<StringGuardSettings['pattern']>
): Guard<S> {
  return string<S>({ pattern })
}

/**
 * Constructs a type-guard for a `string` with specified prefix
 * @param prefix - value must start with a prefix
 */
export function startsWith<Prefix extends string>(
  prefix: Prefix
): Guard<`${Prefix}${string}`> {
  return string<`${Prefix}${string}`>({ startsWith: prefix })
}

/**
 * Constructs a type-guard for a `string` with specified suffix
 * @param endsWith - value must end with a suffix
 */
export function endsWith<Suffix extends string>(
  suffix: Suffix
): Guard<`${string}${Suffix}`> {
  return string<`${string}${Suffix}`>({ endsWith: suffix })
}

const createCoerceMethod = <S extends string>(
  settings: StringGuardSettings
): Guard<S>['coerce'] => {
  const { trim, casing } = settings

  let coerceString: undefined | ((input: string) => string) = undefined

  if (trim === true) {
    coerceString = (input) => input.trim()
  }

  if (casing === 'lowerCase') {
    if (coerceString === undefined) {
      coerceString = (input) => input.toLowerCase()
    } else {
      const previous = coerceString
      coerceString = (input) => previous(input).toLowerCase()
    }
  }

  if (casing === 'upperCase') {
    if (coerceString === undefined) {
      coerceString = (input) => input.toUpperCase()
    } else {
      const previous = coerceString
      coerceString = (input) => previous(input).toUpperCase()
    }
  }

  if (casing === 'localeLowerCase') {
    if (coerceString === undefined) {
      coerceString = (input) => input.toLocaleLowerCase()
    } else {
      const previous = coerceString
      coerceString = (input) => previous(input).toLocaleLowerCase()
    }
  }

  if (casing === 'localeUpperCase') {
    if (coerceString === undefined) {
      coerceString = (input) => input.toLocaleUpperCase()
    } else {
      const previous = coerceString
      coerceString = (input) => previous(input).toLocaleUpperCase()
    }
  }

  if (coerceString === undefined) {
    return (input, _path) => ({
      skipCoerce: true,
      value: input,
    })
  }

  return (input, _path) =>
    typeof input === 'string'
      ? {
          skipCoerce: false,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- "coerceString" is always defined at this point - TypeScript is wrong
          value: coerceString!(input),
        }
      : {
          skipCoerce: false,
          value: input,
        }
}

const createAcceptMethod = <S extends string>(
  settings: StringGuardSettings
): Guard<S>['accept'] => {
  // eslint-disable-next-line @typescript-eslint/no-shadow -- Shadowing is intended for readability
  const {
    format,
    blank,
    startsWith,
    endsWith,
    maximum,
    minimum,
    exclusiveMaximum,
    exclusiveMinimum,
    pattern,
    casing,
  } = settings

  const length =
    settings.length === undefined
      ? undefined
      : typeof settings.length === 'number'
      ? literal(settings.length)
      : settings.length instanceof Guard
      ? settings.length
      : number(settings.length)

  let isValidString = (_input: string) => true

  if (format !== undefined) {
    const previous = isValidString

    isValidString = (input) => {
      if (previous(input) === false) {
        return false
      }

      const formatPattern = StringFormats[format]

      if (typeof formatPattern === 'function') {
        return formatPattern(input) === true
      }

      formatPattern.lastIndex = 0

      return formatPattern.test(input)
    }
  }

  if (blank === false) {
    const previous = isValidString

    isValidString = (input) => {
      if (previous(input) === false) {
        return false
      }

      return input.trim().length > 0
    }
  }

  if (startsWith !== undefined) {
    const previous = isValidString

    isValidString = (input) => {
      if (previous(input) === false) {
        return false
      }

      return input.startsWith(startsWith)
    }
  }

  if (endsWith !== undefined) {
    const previous = isValidString

    isValidString = (input) => {
      if (previous(input) === false) {
        return false
      }

      return input.endsWith(endsWith)
    }
  }

  if (maximum !== undefined) {
    const previous = isValidString

    isValidString = (input) => {
      if (previous(input) === false) {
        return false
      }

      return maximum >= input
    }
  }

  if (minimum !== undefined) {
    const previous = isValidString

    isValidString = (input) => {
      if (previous(input) === false) {
        return false
      }

      return minimum <= input
    }
  }

  if (exclusiveMaximum !== undefined) {
    const previous = isValidString

    isValidString = (input) => {
      if (previous(input) === false) {
        return false
      }

      return exclusiveMaximum > input
    }
  }

  if (exclusiveMinimum !== undefined) {
    const previous = isValidString

    isValidString = (input) => {
      if (previous(input) === false) {
        return false
      }

      return exclusiveMinimum < input
    }
  }

  if (length !== undefined) {
    const previous = isValidString

    isValidString = (input) => {
      if (previous(input) === false) {
        return false
      }

      return length.accept(input.length)
    }
  }

  if (pattern !== undefined) {
    if (pattern instanceof RegExp) {
      const previous = isValidString

      isValidString = (input) => {
        if (previous(input) === false) {
          return false
        }

        pattern.lastIndex = 0
        return pattern.test(input) !== false
      }
    } else {
      // eslint-disable-next-line security/detect-non-literal-regexp -- pattern is a string by purpose
      const patternRegExp = new RegExp(pattern)

      const previous = isValidString

      isValidString = (input) => {
        if (previous(input) === false) {
          return false
        }

        patternRegExp.lastIndex = 0
        return patternRegExp.test(input) !== false
      }
    }
  }

  if (casing === 'lowerCase') {
    const previous = isValidString

    isValidString = (input) => {
      if (previous(input) === false) {
        return false
      }

      return input.toLowerCase() === input
    }
  }

  if (casing === 'upperCase') {
    const previous = isValidString

    isValidString = (input) => {
      if (previous(input) === false) {
        return false
      }

      return input.toUpperCase() === input
    }
  }

  if (casing === 'localeLowerCase') {
    const previous = isValidString

    isValidString = (input) => {
      if (previous(input) === false) {
        return false
      }

      return input.toLocaleLowerCase() === input
    }
  }

  if (casing === 'localeUpperCase') {
    const previous = isValidString

    isValidString = (input) => {
      if (previous(input) === false) {
        return false
      }

      return input.toLocaleUpperCase() === input
    }
  }

  return (input): input is S =>
    typeof input === 'string' ? isValidString(input) : false
}

const createValidateMethod = <S extends string>(
  settings: StringGuardSettings
): Guard<S>['validate'] => {
  // eslint-disable-next-line @typescript-eslint/no-shadow -- shadowing is intended for readability
  const {
    format,
    blank,
    startsWith,
    endsWith,
    maximum,
    minimum,
    exclusiveMaximum,
    exclusiveMinimum,
    pattern,
    casing,
  } = settings

  const length =
    settings.length === undefined
      ? undefined
      : typeof settings.length === 'number'
      ? literal(settings.length)
      : settings.length instanceof Guard
      ? settings.length
      : number(settings.length)

  let validateString = (
    _input: string,
    _path: ReadonlyArray<number | string | symbol>,
    _invalidations: Invalidation[]
  ): _input is S => true

  if (format !== undefined) {
    const previous = validateString

    validateString = (input, path, invalidations): input is S => {
      const isValid = previous(input, path, invalidations)

      const formatPattern = StringFormats[format]

      let patternFullfilled = false

      if (typeof formatPattern === 'function') {
        patternFullfilled = formatPattern(input) === true
      } else {
        formatPattern.lastIndex = 0
        patternFullfilled = formatPattern.test(input)
      }

      if (patternFullfilled === false) {
        invalidations.push({
          rule: 'logical',
          guard: 'string',
          path,
          function: 'format',
          setting: format,
          actual: input,
        })

        return false
      }

      return isValid
    }
  }

  if (blank === false) {
    const previous = validateString

    validateString = (input, path, invalidations): input is S => {
      const isValid = previous(input, path, invalidations)

      if (input.trim().length === 0) {
        invalidations.push({
          rule: 'logical',
          guard: 'string',
          path,
          function: 'blank',
          setting: blank,
          actual: input,
        })

        return false
      }

      return isValid
    }
  }

  if (startsWith !== undefined) {
    const previous = validateString

    validateString = (input, path, invalidations): input is S => {
      const isValid = previous(input, path, invalidations)

      if (input.startsWith(startsWith) === false) {
        invalidations.push({
          rule: 'logical',
          guard: 'string',
          path,
          function: 'startsWith',
          setting: startsWith,
          actual: input,
        })

        return false
      }

      return isValid
    }
  }

  if (endsWith !== undefined) {
    const previous = validateString

    validateString = (input, path, invalidations): input is S => {
      const isValid = previous(input, path, invalidations)

      if (input.endsWith(endsWith) === false) {
        invalidations.push({
          rule: 'logical',
          guard: 'string',
          path,
          function: 'endsWith',
          setting: endsWith,
          actual: input,
        })

        return false
      }

      return isValid
    }
  }

  if (maximum !== undefined) {
    const previous = validateString

    validateString = (input, path, invalidations): input is S => {
      const isValid = previous(input, path, invalidations)

      if (input > maximum) {
        invalidations.push({
          rule: 'logical',
          guard: 'string',
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
    const previous = validateString

    validateString = (input, path, invalidations): input is S => {
      const isValid = previous(input, path, invalidations)

      if (input < minimum) {
        invalidations.push({
          rule: 'logical',
          guard: 'string',
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

  if (exclusiveMaximum !== undefined) {
    const previous = validateString

    validateString = (input, path, invalidations): input is S => {
      const isValid = previous(input, path, invalidations)

      if (input >= exclusiveMaximum) {
        invalidations.push({
          rule: 'logical',
          guard: 'string',
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
    const previous = validateString

    validateString = (input, path, invalidations): input is S => {
      const isValid = previous(input, path, invalidations)

      if (input <= exclusiveMinimum) {
        invalidations.push({
          rule: 'logical',
          guard: 'string',
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

  if (length !== undefined) {
    const previous = validateString

    validateString = (input, path, invalidations): input is S => {
      const isValid = previous(input, path, invalidations)

      if (
        length.validate(input.length, [...path, 'length'], invalidations) ===
        false
      ) {
        return false
      }

      return isValid
    }
  }

  if (pattern !== undefined) {
    const previous = validateString

    if (pattern instanceof RegExp) {
      validateString = (input, path, invalidations): input is S => {
        const isValid = previous(input, path, invalidations)

        pattern.lastIndex = 0
        if (pattern.test(input) === false) {
          invalidations.push({
            rule: 'logical',
            guard: 'string',
            path,
            function: 'pattern',
            setting: pattern.toString(),
            actual: input,
          })

          return false
        }

        return isValid
      }
    } else {
      // eslint-disable-next-line security/detect-non-literal-regexp -- pattern is a string by purpose
      const patternRegex = new RegExp(pattern)

      validateString = (input, path, invalidations): input is S => {
        const isValid = previous(input, path, invalidations)

        patternRegex.lastIndex = 0
        if (patternRegex.test(input) === false) {
          invalidations.push({
            rule: 'logical',
            guard: 'string',
            path,
            function: 'pattern',
            setting: pattern,
            actual: input,
          })

          return false
        }

        return isValid
      }
    }
  }

  if (casing === 'lowerCase') {
    const previous = validateString

    validateString = (input, path, invalidations): input is S => {
      const isValid = previous(input, path, invalidations)

      if (input !== input.toLowerCase()) {
        invalidations.push({
          rule: 'logical',
          guard: 'string',
          path,
          function: 'casing',
          setting: 'lowerCase',
          actual: input,
        })

        return false
      }

      return isValid
    }
  }

  if (casing === 'upperCase') {
    const previous = validateString

    validateString = (input, path, invalidations): input is S => {
      const isValid = previous(input, path, invalidations)

      if (input !== input.toUpperCase()) {
        invalidations.push({
          rule: 'logical',
          guard: 'string',
          path,
          function: 'casing',
          setting: 'upperCase',
          actual: input,
        })

        return false
      }

      return isValid
    }
  }

  if (casing === 'localeLowerCase') {
    const previous = validateString

    validateString = (input, path, invalidations): input is S => {
      const isValid = previous(input, path, invalidations)

      if (input !== input.toLocaleLowerCase()) {
        invalidations.push({
          rule: 'logical',
          guard: 'string',
          path,
          function: 'casing',
          setting: 'localeLowerCase',
          actual: input,
        })

        return false
      }

      return isValid
    }
  }

  if (casing === 'localeUpperCase') {
    const previous = validateString

    validateString = (input, path, invalidations): input is S => {
      const isValid = previous(input, path, invalidations)

      if (input !== input.toLocaleUpperCase()) {
        invalidations.push({
          rule: 'logical',
          guard: 'string',
          path,
          function: 'casing',
          setting: 'localeUpperCase',
          actual: input,
        })

        return false
      }

      return isValid
    }
  }

  const stringType = type('string')

  return (input, path, invalidations): input is S =>
    stringType.validate(input, path, invalidations)
      ? validateString(input, path, invalidations)
      : false
}

const FormatGuards = Object.fromEntries(
  STRING_FORMAT_KEYS.map((name) => [name, string({ format: name })])
)
