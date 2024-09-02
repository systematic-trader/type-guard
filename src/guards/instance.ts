import { Guard } from './guard.ts'
import { type } from './type.ts'

type AbstractConstructor<T> = abstract new (...args: readonly never[]) => T

const InstanceGuards = new WeakMap<object, Guard<unknown>>()

export const instance = <Constructor extends AbstractConstructor<unknown>>(
  constructor: Constructor,
): Guard<InstanceType<Constructor>> => {
  const existing = InstanceGuards.get(constructor)

  if (existing !== undefined) {
    return existing as Guard<InstanceType<Constructor>>
  }

  const objectGuard = type('object')

  const unknownConstructor = constructor as unknown

  const isInstance: (input: unknown) => input is InstanceType<Constructor> = unknownConstructor === Array
    ? (input): input is InstanceType<Constructor> => Array.isArray(input)
    : (input): input is InstanceType<Constructor> => input instanceof constructor

  const instanceGuard = new Guard({
    name: 'instance',

    arguments: [constructor],

    type: ['object'],

    accept: isInstance,

    equals(other): other is Guard<InstanceType<Constructor>> {
      if (instanceGuard === other) {
        return true
      }

      return other instanceof Guard && other.name === 'instance' && constructor === other.arguments[0]
    },

    validate(input, path, invalidations): input is InstanceType<Constructor> {
      if (instanceGuard.accept(input)) {
        return true
      }

      if (objectGuard.validate(input, path, invalidations) === false) {
        return false
      }

      invalidations.push({
        rule: 'logical',
        guard: 'instance',
        path,
        function: 'instanceof',
        setting: constructor.name,
        actual: actualTypeOf(input),
      })

      return false
    },

    toString() {
      return constructor.name
    },
  })

  InstanceGuards.set(constructor, instanceGuard)

  return instanceGuard
}

const actualTypeOf = (input: unknown) => {
  const guardType = Guard.getType(input)

  if (guardType !== 'object') {
    return guardType
  }

  const inputObject = input as object

  if (inputObject.constructor === Object && Object.prototype.toString.call(inputObject) === '[object Object]') {
    return guardType
  }

  const constructorName = inputObject.constructor.name

  if (constructorName.length === 0 || constructorName === 'Object') {
    return guardType
  }

  return constructorName
}
