import { Guard } from './guard.ts'
import { type } from './type.ts'

/**
 * Constructs a type-guard for the `Record` type
 * @param key - type-guard for a key in the record
 * @param value - type-guard for a value in the record
 */
export function record<Key extends number | string | symbol, Value>(
  key: Guard<Key>,
  value: Guard<Value>,
): Guard<Record<Key, Value>> {
  if (key.type.every((typeName) => ['any', 'number', 'string', 'symbol'].includes(typeName)) === false) {
    throw new TypeError(
      `Type of key must be a number, string or symbol (or "any"), but got [${
        key.type
          .map((typeName) => `"${typeName}"`)
          .join(', ')
      }]`,
    )
  }

  const objectType = type('object')
  const circularityTracker = new WeakMap<object, unknown>()

  const accept = createAcceptMethod(key, value, circularityTracker)
  const validate = createValidateMethod(key, value, circularityTracker)

  let skipCoerce = false

  const recordGuard: Guard<Record<Key, Value>> = new Guard<Record<Key, Value>>({
    name: 'record',

    type: ['object'],

    arguments: [key, value],

    accept,

    coerce(input, path): { readonly skipCoerce: boolean; readonly value: unknown } {
      if (skipCoerce) {
        return {
          skipCoerce,
          value: input,
        }
      }

      if (objectType.accept(input)) {
        const circularReference = circularityTracker.get(input)

        if (circularReference !== undefined) {
          return { skipCoerce, value: circularReference }
        }

        const output: Record<string, unknown> = {}

        try {
          circularityTracker.set(input, output)

          let modified = false

          for (const recordKey in input) {
            const inputValue = input[recordKey]

            if (skipCoerce) {
              output[recordKey] = inputValue
            } else {
              const coercedKey = key.coerce(recordKey, path)
              const coercedValue = value.coerce(inputValue, path)

              if (coercedKey.skipCoerce === true && coercedValue.skipCoerce === true) {
                skipCoerce = true
              }

              const coercedKeyValue = coercedKey.value as string

              output[coercedKeyValue] = coercedValue.value

              if (coercedKey.value !== recordKey || coercedValue.value !== inputValue) {
                modified = true
              }
            }
          }

          return {
            skipCoerce,
            value: modified ? output : input,
          }
        } finally {
          circularityTracker.delete(input)
        }
      } else {
        return {
          skipCoerce,
          value: input,
        }
      }
    },

    convert(
      input: unknown,
      context,
      path,
      converter,
      options?: {
        continue?(path: ReadonlyArray<number | string | symbol>, guard: Guard<unknown>): boolean
      },
    ) {
      if (options?.continue !== undefined && options.continue(path, recordGuard) === false) {
        return converter(input, path, recordGuard, context)
      }

      if (input !== null && typeof input === 'object') {
        if (circularityTracker.has(input)) {
          throw new Error('Circular reference detected - convert does not support circular references')
        }

        const output: Record<string, unknown> = {}

        try {
          circularityTracker.set(input, output)

          let modified = false

          for (const recordKey in input) {
            const convertedKey = key.convert(recordKey as Key, context, path, converter, options)

            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We know the key exists with a value
            const inputPropertyValue = (input as Record<string, Value>)[recordKey]!

            const convertedValue = value.convert(inputPropertyValue, context, [...path, recordKey], converter, options)

            if (convertedKey !== recordKey || convertedValue !== inputPropertyValue) {
              modified = true
            }

            output[convertedKey as string] = convertedValue
          }

          return converter(modified ? output : input, path, recordGuard, context)
        } finally {
          circularityTracker.delete(input)
        }
      }

      throw new TypeError(`Expected an object, but got ${typeof input}`)
    },

    equals(other): other is Guard<Record<Key, Value>> {
      if (recordGuard === other) {
        return true
      }

      return (
        other instanceof Guard &&
        other.name === 'record' &&
        key.equals(other.arguments[0]) &&
        value.equals(other.arguments[1])
      )
    },

    *inspect(path, inspecter) {
      yield* inspecter(path, recordGuard)
      yield* key.inspect(path, inspecter)
      yield* value.inspect(path, inspecter)
    },

    scan(input: unknown, context, path, scanner, options) {
      if (circularityTracker.has(input as object)) {
        return
      }

      if (options?.continue !== undefined && options.continue(path, recordGuard) === false) {
        scanner(input, path, recordGuard, context)

        return
      }

      if (input !== null && typeof input === 'object') {
        try {
          circularityTracker.set(input, undefined)

          if (options?.maxPathLength !== undefined && path.length > options.maxPathLength) {
            return
          }

          scanner(input, path, recordGuard, context)

          for (const recordKey in input) {
            key.scan(recordKey, context, path, scanner, options)

            const inputPropertyValue = (input as Record<string, Value>)[recordKey]

            value.scan(inputPropertyValue, context, [...path, recordKey], scanner, options)
          }
        } finally {
          circularityTracker.delete(input)
        }
      }
    },

    substitute(path, replacer) {
      const keyReplacement: Guard<number | string | symbol> = key.substitute(path, replacer)
      const valueReplacement = value.substitute(path, replacer)

      const replacement = keyReplacement === key && valueReplacement === value
        ? recordGuard
        : record(keyReplacement, valueReplacement)

      return replacer(path, replacement) as Guard<never>
    },

    validate,

    toString() {
      return `Record<${key.toString()}, ${value.toString()}>`
    },

    toTypeScript(
      options?:
        | undefined
        | {
          /** @internal */
          readonly path?: undefined | string
          /** @internal */
          readonly circular?: undefined | Map<object, string>
        },
    ): string {
      if (options?.path === undefined) {
        return `Record<${key.toString()}, ${value.toString()}>`
      }

      const keyPath = `(keyof ${options.path})`
      const valuePath = `${options.path}[${keyPath}]`

      const keyTypeScript = key.toTypeScript({ path: keyPath, circular: options.circular })
      const valueTypeScript = value.toTypeScript({ path: valuePath, circular: options.circular })

      return `Record<${keyTypeScript}, ${valueTypeScript}>`
    },
  })

  return recordGuard
}

const createAcceptMethod = <Key extends number | string | symbol, Value>(
  keyGuard: Guard<Key>,
  valueGuard: Guard<Value>,
  circularTracker: WeakMap<object, unknown>,
): Guard<Record<Key, Value>>['accept'] => {
  const checkKey = keyGuard.type.includes('any') === false
  const checkSymbolKey = keyGuard.type.includes('symbol')
  const checkValue = (valueGuard.type.includes('any') || valueGuard.type.includes('unknown')) === false
  const objectType = type('object')

  if (checkKey && checkValue) {
    return (input): input is Record<Key, Value> => {
      if (objectType.accept(input)) {
        if (circularTracker.has(input)) {
          return true
        }

        try {
          circularTracker.set(input, undefined)

          for (const propertyKey in input) {
            if (keyGuard.accept(propertyKey) === false) {
              return false
            }

            if (valueGuard.accept(input[propertyKey]) === false) {
              return false
            }
          }

          if (checkSymbolKey) {
            for (const propertyKey of Object.getOwnPropertySymbols(input)) {
              if (keyGuard.accept(propertyKey) === false) {
                return false
              }

              if (valueGuard.accept(input[propertyKey]) === false) {
                return false
              }
            }
          }
        } finally {
          circularTracker.delete(input)
        }

        return true
      }

      return false
    }
  } else if (checkKey && checkValue === false) {
    return (input): input is Record<Key, Value> => {
      if (objectType.accept(input)) {
        if (circularTracker.has(input)) {
          return true
        }

        try {
          circularTracker.set(input, undefined)

          for (const propertyKey in input) {
            if (keyGuard.accept(propertyKey) === false) {
              return false
            }
          }

          if (checkSymbolKey) {
            for (const propertyKey of Object.getOwnPropertySymbols(input)) {
              if (keyGuard.accept(propertyKey) === false) {
                return false
              }
            }
          }
        } finally {
          circularTracker.delete(input)
        }

        return true
      }

      return false
    }
  } else if (checkKey === false && checkValue) {
    return (input): input is Record<Key, Value> => {
      if (objectType.accept(input)) {
        if (circularTracker.has(input)) {
          return true
        }

        try {
          circularTracker.set(input, undefined)

          for (const propertyKey in input) {
            if (valueGuard.accept(input[propertyKey]) === false) {
              return false
            }
          }
        } finally {
          circularTracker.delete(input)
        }

        return true
      }

      return false
    }
  }

  return (input): input is Record<Key, Value> => objectType.accept(input)
}

const createValidateMethod = <Key extends number | string | symbol, Value>(
  keyGuard: Guard<Key>,
  valueGuard: Guard<Value>,
  circularTracker: WeakMap<object, unknown>,
): Guard<Record<Key, Value>>['validate'] => {
  const checkKey = keyGuard.type.includes('any') === false
  const checkSymbolKey = keyGuard.type.includes('symbol')
  const checkValue = (valueGuard.type.includes('any') || valueGuard.type.includes('unknown')) === false
  const objectType = type('object')

  if (checkKey && checkValue) {
    return (input, path, invalidations): input is Record<Key, Value> => {
      if (objectType.validate(input, path, invalidations)) {
        if (circularTracker.has(input)) {
          return true
        }

        try {
          circularTracker.set(input, undefined)

          let isValid = true

          for (const propertyKey in input) {
            if (keyGuard.validate(propertyKey, path, invalidations) === false) {
              isValid = false
            }

            if (valueGuard.validate(input[propertyKey], [...path, propertyKey], invalidations) === false) {
              isValid = false
            }
          }

          if (checkSymbolKey) {
            for (const propertyKey of Object.getOwnPropertySymbols(input)) {
              if (keyGuard.validate(propertyKey, path, invalidations) === false) {
                isValid = false
              }

              if (valueGuard.validate(input[propertyKey], [...path, propertyKey], invalidations) === false) {
                isValid = false
              }
            }
          }

          return isValid
        } finally {
          circularTracker.delete(input)
        }
      } else {
        return false
      }
    }
  } else if (checkKey && checkValue === false) {
    return (input, path, invalidations): input is Record<Key, Value> => {
      if (objectType.validate(input, path, invalidations)) {
        if (circularTracker.has(input)) {
          return true
        }

        try {
          circularTracker.set(input, undefined)

          let isValid = true

          for (const propertyKey in input) {
            if (keyGuard.validate(propertyKey, path, invalidations) === false) {
              isValid = false
            }
          }

          if (checkSymbolKey) {
            for (const propertyKey of Object.getOwnPropertySymbols(input)) {
              if (keyGuard.validate(propertyKey, path, invalidations) === false) {
                isValid = false
              }
            }
          }

          return isValid
        } finally {
          circularTracker.delete(input)
        }
      } else {
        return false
      }
    }
  } else if (checkKey === false && checkValue) {
    return (input, path, invalidations): input is Record<Key, Value> => {
      if (objectType.validate(input, path, invalidations)) {
        if (circularTracker.has(input)) {
          return true
        }

        try {
          circularTracker.set(input, undefined)

          let isValid = true

          for (const propertyKey in input) {
            if (valueGuard.validate(input[propertyKey], [...path, propertyKey], invalidations) === false) {
              isValid = false
            }
          }

          return isValid
        } finally {
          circularTracker.delete(input)
        }
      } else {
        return false
      }
    }
  }

  return (input, path, invalidations): input is Record<Key, Value> => objectType.validate(input, path, invalidations)
}
