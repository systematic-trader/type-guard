import equal from 'npm:fast-deep-equal@3.1.3'
import { Guard } from './guard.ts'
import { type as typeGuard } from './type.ts'

export type LiteralType =
  | null
  | undefined
  | bigint
  | boolean
  | number
  | object
  | string
  | symbol
  | ((...args: readonly unknown[]) => unknown)

// TODO literal(1, 2, 3) should be a Guard<1 | 2 | 3> and replace enums
export function literal<T extends readonly LiteralType[]>(
  value: readonly [...T]
): Guard<T>
export function literal<T extends LiteralType>(value: T): Guard<T>
export function literal<T extends LiteralType>(value: T): Guard<T> {
  if (value === undefined) {
    return typeGuard(['undefined']) as Guard<T>
  }

  if (value === null) {
    return typeGuard(['null']) as Guard<T>
  }

  const type = Guard.getType(value)

  const isLiteral =
    type === 'object'
      ? (input: unknown): input is T => equal(input, value)
      : (input: unknown): input is T => input === value

  const typescript = toTypeScript(value)

  const literalGuard = new Guard<T>({
    name: 'literal',

    type: [type],

    arguments: [value],

    accept: isLiteral,

    equals(other): other is Guard<T> {
      if (literalGuard === other) {
        return true
      }

      return (
        other instanceof Guard &&
        other.name === 'literal' &&
        isLiteral(other.arguments[0])
      )
    },

    validate(input, path, previous): input is T {
      if (isLiteral(input)) {
        return true
      }

      previous.push({
        rule: 'logical',
        guard: 'literal',
        path,
        function: 'equals',
        setting: value,
        actual: input,
      })

      return false
    },

    toString() {
      return typescript
    },
  })

  return literalGuard
}

const toTypeScript = (value: unknown): string => {
  switch (typeof value) {
    case 'bigint': {
      return `${value}n`
    }

    case 'boolean': {
      return value.toString()
    }

    case 'function': {
      return `Function`
    }

    case 'number': {
      return Number.isFinite(value) ? value.toString() : 'number'
    }

    case 'object': {
      if (value === null) {
        return `null`
      } else if (Array.isArray(value)) {
        return `readonly [${value.map(toTypeScript).join(', ')}]`
      } else if (value.constructor === Object) {
        const props = Object.entries(value).map(
          ([key, entryValue]) =>
            `readonly '${key}': ${toTypeScript(entryValue)}`
        )

        return `{ ${props.join('; ')} }`
      }

      return value.constructor.name
    }

    case 'string': {
      return `'${value}'`
    }

    case 'symbol': {
      return value.description ?? 'Symbol'
    }

    case 'undefined': {
      return `undefined`
    }

    default: {
      return `unknown`
    }
  }
}
