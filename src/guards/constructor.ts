import { Guard } from './guard.ts'
import { type } from './type.ts'

type AbstractConstructor = abstract new (...args: readonly unknown[]) => unknown

const GUARDS = new WeakMap<AbstractConstructor, Guard<unknown>>()

export const constructor = <T extends AbstractConstructor>(ctor: T): Guard<T> => {
  const existing = GUARDS.get(ctor)

  if (existing !== undefined) {
    return existing as Guard<T>
  }

  const hasConstructor = (input: unknown): input is T =>
    input === ctor || (typeof input === 'function' && input.prototype instanceof ctor)

  const typescript = `typeof ${ctor.name}`

  const functionType = type('function')

  const constructorGuard = new Guard({
    name: 'constructor',

    type: ['function'],

    arguments: [ctor],

    accept(input): input is T {
      return functionType.accept(input) && hasConstructor(input)
    },

    validate(input, path, invalidations): input is T {
      if (functionType.validate(input, path, invalidations)) {
        if (hasConstructor(input)) {
          return true
        }

        invalidations.push({
          rule: 'logical',
          guard: 'constructor',
          path,
          function: 'class',
          setting: ctor.name,
          actual: input,
        })

        return false
      }

      return false
    },

    equals(other): other is Guard<T> {
      if (constructorGuard === other) {
        return true
      }

      return other instanceof Guard && other.name === 'constructor' && ctor === other.arguments[0]
    },

    toString() {
      return typescript
    },
  })

  GUARDS.set(ctor, constructorGuard)

  return constructorGuard
}
