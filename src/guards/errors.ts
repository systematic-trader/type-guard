import { pathLiteral } from '../utils/path-literal.ts'

import type { TypeName } from './guard.ts'

export interface TypeInvalidation {
  readonly rule: 'type'
  readonly path: ReadonlyArray<number | string | symbol>
  readonly setting: readonly TypeName[]
  readonly actual: TypeName
}

export interface LogicInvalidation {
  readonly rule: 'logical'
  readonly guard: string
  readonly path: ReadonlyArray<number | string | symbol>
  readonly function:
    | 'blank'
    | 'casing'
    | 'class'
    | 'custom'
    | 'endsWith'
    | 'equals'
    | 'exclusiveMaximum'
    | 'exclusiveMinimum'
    | 'extendable'
    | 'format'
    | 'instanceof'
    | 'maximum'
    | 'minimum'
    | 'notEquals'
    | 'parity'
    | 'pattern'
    | 'precision'
    | 'startsWith'
    | 'unique'
  readonly setting: unknown
  readonly actual: unknown
}

export type Invalidation = LogicInvalidation | TypeInvalidation

const escapeValue = (value: unknown): string =>
  typeof value === 'string'
    ? `"${value}"`
    : Array.isArray(value)
    ? `[${value.map(escapeValue).join(', ')}]`
    : `${value as string}`

export class AssertionError extends Error {
  readonly invalidations: readonly Invalidation[]

  // deno-lint-ignore constructor-super -- false positive
  constructor(invalidations: readonly Invalidation[]) {
    if (invalidations.length === 0) {
      throw new Error('AssertionError must have at least one invalidation')
    }

    const sortedInvalidations = [...invalidations].sort((left, right) => {
      if (left.path.length > right.path.length) {
        return -1
      }

      if (left.path.length < right.path.length) {
        return 1
      }

      if (left.rule !== 'type' && right.rule === 'type') {
        return -1
      }

      if (left.rule === 'type' && right.rule !== 'type') {
        return 1
      }

      return 0
    })

    const [bestGuessInvalidation] = sortedInvalidations

    if (bestGuessInvalidation === undefined) {
      throw new Error('AssertionError must have at least one invalidation')
    }

    const path = pathLiteral(bestGuessInvalidation.path)

    if (bestGuessInvalidation.rule === 'type') {
      const { setting, actual } = bestGuessInvalidation

      if (setting.length === 1) {
        super(
          `${path} - expected "type" to be ${escapeValue(
            setting[0]
          )}, but received ${escapeValue(actual)}`
        )
      } else {
        const expected = `${setting
          .slice(0, -1)
          .map(escapeValue)
          .join(', ')} or ${escapeValue(setting.at(-1))}`

        super(
          `${path} - expected "type" to be ${expected}, but received ${escapeValue(
            actual
          )}`
        )
      }
    } else {
      const { function: functionType, setting, actual } = bestGuessInvalidation

      if (setting === undefined || setting === true) {
        const message = `${path} - expected to be "${functionType}", but received ${escapeValue(
          actual
        )}`

        super(message)
      } else {
        const message = `${path} - expected to be "${functionType}" ${escapeValue(
          setting
        )}, but received ${escapeValue(actual)}`

        super(message)
      }
    }

    // https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, AssertionError.prototype)

    this.invalidations = sortedInvalidations
  }
}
