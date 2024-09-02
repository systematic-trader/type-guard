import equal from 'npm:fast-deep-equal@3.1.3'
import { Guard } from './guard.ts'

import type { TypeMap, TypeName } from './guard.ts'

const unfoldDistinctTypes = (
  names: readonly TypeName[]
): readonly TypeName[] => {
  if (names.includes('any')) {
    return ['any']
  }

  if (names.includes('unknown')) {
    return ['unknown']
  }

  const distictTypes: TypeName[] = names
    .filter(
      (item, index, self) => self.indexOf(item) === index && item !== 'never'
    )
    .sort()

  if (distictTypes.length === 0) {
    return ['never']
  }

  return distictTypes
}

const TypeGuards = {} as Record<string, Guard<unknown>>

export function type<T extends TypeName>(
  name: T | readonly T[]
): Guard<TypeMap[T]> {
  const distictTypes =
    typeof name === 'string' ? [name] : unfoldDistinctTypes(name)

  const typeKey = distictTypes.join('|')

  const existing = TypeGuards[typeKey]

  if (existing !== undefined) {
    return existing as Guard<TypeMap[T]>
  }

  const isType =
    distictTypes.length === 1
      ? distictTypes[0] === 'any' || distictTypes[0] === 'unknown'
        ? (_input: unknown): _input is TypeMap[T] => true
        : distictTypes[0] === 'never'
        ? (_input: unknown): _input is TypeMap[T] => false
        : (input: unknown): input is TypeMap[T] =>
            Guard.getType(input) === distictTypes[0]
      : (input: unknown): input is TypeMap[T] =>
          distictTypes.includes(Guard.getType(input))

  const typeGuard = new Guard({
    name: 'type',

    arguments: [distictTypes],

    type: distictTypes,

    accept: isType,

    equals(other): other is Guard<TypeMap[T]> {
      if (typeGuard === other) {
        return true
      }

      return (
        other instanceof Guard &&
        other.name === 'type' &&
        equal(other.arguments[0], distictTypes)
      )
    },

    validate(input, path, invalidations): input is TypeMap[T] {
      if (typeGuard.accept(input)) {
        return true
      }

      invalidations.push({
        rule: 'type',
        path,
        setting: distictTypes,
        actual: Guard.getType(input),
      })

      return false
    },
  })

  TypeGuards[typeKey] = typeGuard

  return typeGuard
}
