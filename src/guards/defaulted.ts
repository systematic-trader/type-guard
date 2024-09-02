import { Guard } from './guard.ts'

import type { ArgumentType } from './index.ts'

export function defaulted<T>(guard: Guard<T>, defaulter: ArgumentType<T> | (() => ArgumentType<T>)): Guard<T> {
  const createDefault = (typeof defaulter === 'function' ? defaulter : () => defaulter) as () => T

  let skipInnerCoerce = false

  const defaultedGuard: Guard<T> = new Guard<T>({
    name: 'defaulted',

    type: guard.type,

    arguments: [guard, defaulter],

    accept(input): input is T {
      return guard.accept(input)
    },

    coerce(input, path) {
      const value: unknown = defaultedGuard.accept(input) ? input : createDefault()

      if (skipInnerCoerce === true) {
        return {
          skipCoerce: false,
          value,
        }
      }
      const output = guard.coerce(value, path)

      skipInnerCoerce = output.skipCoerce

      return {
        skipCoerce: false,
        value: output.value,
      }
    },

    convert(input, context, path, converter, options) {
      return guard.convert(input, context, path, converter, options)
    },

    equals(other): other is Guard<T> {
      if (defaultedGuard === other) {
        return true
      }

      return (
        other instanceof Guard &&
        other.name === 'defaulted' &&
        guard.equals(other.arguments[0]) &&
        defaulter === other.arguments[1]
      )
    },

    inspect(path, inspecter) {
      return guard.inspect(path, inspecter)
    },

    scan(input, context, path, scanner, options) {
      return guard.scan(input, context, path, scanner, options)
    },

    substitute(path, replacer) {
      return guard.substitute(path, replacer)
    },

    validate(input, path, invalidations): input is T {
      return guard.validate(input, path, invalidations)
    },

    toString() {
      return guard.toString()
    },
  })

  return defaultedGuard
}
