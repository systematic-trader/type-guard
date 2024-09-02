import { any } from './any.ts'
import { AssertionError } from './errors.ts'
import { Guard } from './guard.ts'
import { never } from './never.ts'
import { type } from './type.ts'
import { unknown } from './unknown.ts'

import type { Invalidation } from './errors.ts'
import type { TypeName } from './guard.ts'

// eslint-disable-next-line functional/prefer-readonly-type -- Mutable output-argument
const unfoldDistinctMembers = (members: ReadonlyArray<Guard<unknown>>, output: Array<Guard<unknown>>): void => {
  for (const member of members) {
    if (member.name === 'union') {
      unfoldDistinctMembers(member.arguments[0] as Array<Guard<unknown>>, output)
    } else if (output.some((outputMember) => outputMember.equals(member)) === false) {
      let skip = false

      if (output.length > 0 && member.name === 'literal' && typeof member.arguments[0] === 'boolean') {
        const invertedLiteral = !member.arguments[0]

        for (let index = 0; index < output.length; index++) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Guaranteed to be defined
          const outputMember = output[index]!
          if (outputMember.name === 'literal' && outputMember.arguments[0] === invertedLiteral) {
            output[index] = type('boolean')
            skip = true
            break
          }
        }
      }

      if (skip === false) {
        output.push(member)
      }
    }

    const wholeTypes = new Set<TypeName>()
    let lastIndex = -1

    for (let index = output.length - 1; index >= 0; index--) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Guaranteed to be defined
      const outputMember = output[index]!

      if (outputMember.name === 'type') {
        if (wholeTypes.size === 0) {
          lastIndex = index
          for (const typeName of outputMember.type) {
            wholeTypes.add(typeName)
          }
        } else {
          output.splice(lastIndex, 1)

          lastIndex = index
          for (const typeName of outputMember.type) {
            wholeTypes.add(typeName)
          }

          output[index] = type([...wholeTypes])
        }
      }
    }

    for (let index = output.length - 1; index >= 0; index--) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Guaranteed to be defined
      const outputMember = output[index]!

      if (outputMember.name !== 'type' && outputMember.type.every((typeName) => wholeTypes.has(typeName))) {
        output.splice(index, 1)
      }
    }
  }
}

const CircularityTrackers = new WeakMap<Guard<unknown>, WeakSet<object>>()

export function union<T extends readonly unknown[]>(
  members: readonly [...{ readonly [I in keyof T]: Guard<T[I]> }],
  {
    skipCompaction = false,
    maxInvalidations = 100,
  }: { readonly skipCompaction?: boolean; readonly maxInvalidations?: number } = {},
): Guard<T[number]> {
  if (members.length === 0) {
    return never() as Guard<T[number]>
  }

  const distinctMembers: Array<Guard<unknown>> = []

  if (skipCompaction === true) {
    for (const member of members) {
      distinctMembers.push(member)
    }
  } else {
    unfoldDistinctMembers(members, distinctMembers)
  }

  if (distinctMembers.length === 1) {
    return distinctMembers[0] as Guard<T[number]>
  }

  const typeNames: TypeName[] = []

  for (const member of distinctMembers) {
    for (const typeName of member.type) {
      if (typeName !== 'never' && typeNames.includes(typeName) === false) {
        typeNames.push(typeName)
      }
    }
  }

  if (typeNames.length === 0) {
    return never() as Guard<T[number]>
  }

  if (typeNames.includes('any')) {
    return any() as Guard<T[number]>
  }

  if (typeNames.includes('unknown')) {
    return unknown() as Guard<T[number]>
  }

  const coerceCache = new WeakMap<object, { readonly skipCoerce: boolean; readonly value: unknown }>()

  let coerceMembers = distinctMembers

  const unionGuard: Guard<T[number]> = new Guard<T[number]>({
    name: 'union',

    type: typeNames,

    arguments: [distinctMembers],

    accept(input): input is T[number] {
      return distinctMembers.some((member) => member.accept(input))
    },

    coerce(input, path) {
      const output = {
        skipCoerce: true,
        value: input,
      }

      if (coerceMembers.length === 0) {
        return output
      }

      const cachedOutput = coerceCache.get(input as object)

      if (cachedOutput !== undefined) {
        return cachedOutput
      }

      const noCoercing: Array<Guard<unknown>> = []

      for (const member of coerceMembers) {
        const { skipCoerce, value } = member.coerce(input, path)

        output.value = value

        if (skipCoerce === false) {
          output.skipCoerce = false
        } else {
          noCoercing.push(member)
        }
      }

      if (noCoercing.length > 0) {
        coerceMembers = coerceMembers.filter((member) => noCoercing.includes(member) === false)
      }

      if (typeof input === 'object' && input !== null) {
        coerceCache.set(input, output)
      }

      return output
    },

    convert(input, context, path, converter, options) {
      for (const member of distinctMembers) {
        if (member.accept(input)) {
          return member.convert(input, context, path, converter, options)
        }
      }

      const invalidations: Invalidation[] = []
      unionGuard.validate(input, path, invalidations)
      throw new AssertionError(invalidations)
    },

    equals(other): other is Guard<T[number]> {
      if (unionGuard === other) {
        return true
      }

      if (other instanceof Guard && other.name === 'union') {
        const otherMembers = other.arguments[0] as Array<Guard<unknown>>

        return (
          distinctMembers.every((member) => otherMembers.some((otherMember) => otherMember.equals(member))) &&
          otherMembers.every((otherMember) => distinctMembers.some((member) => member.equals(otherMember)))
        )
      }

      return false
    },

    *inspect(path, inspecter) {
      for (const member of distinctMembers) {
        yield* member.inspect(path, inspecter)
      }
    },

    scan(input, context, path, scanner, options) {
      for (const member of distinctMembers) {
        if (member.accept(input)) {
          return member.scan(input, context, path, scanner, options)
        }
      }

      const invalidations: Invalidation[] = []
      unionGuard.validate(input, path, invalidations)
      throw new AssertionError(invalidations)
    },

    substitute(path, replacer) {
      const replacement = replacer(path, unionGuard)

      return replacement === unionGuard
        ? (union(distinctMembers.map((member) => member.substitute(path, replacer))) as Guard<never>) // TODO: fix this Guard<never> nonsense
        : replacement.substitute(path, replacer)
    },

    validate(input, path, invalidations): input is T[number] {
      const inputType = Guard.getType(input)

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guaranteed to be defined
      const circularTracker = CircularityTrackers.get(unionGuard)!

      if (inputType === 'object') {
        if (circularTracker.has(input as object)) {
          return true
        }

        circularTracker.add(input as object)
      }

      try {
        // new start
        if (distinctMembers.some((member) => member.accept(input))) {
          return true
        }

        if (typeNames.includes(inputType) === false) {
          invalidations.push({
            rule: 'type',
            path,
            setting: typeNames,
            actual: inputType,
          })
        } else {
          const matchingLogicalGuards = distinctMembers.filter((member) => member.type.includes(inputType))

          const memberInvalidations: Invalidation[] = []

          for (const member of matchingLogicalGuards) {
            const pathClone = [...path]

            member.validate(input, pathClone, memberInvalidations)

            if (memberInvalidations.length > maxInvalidations) {
              break
            }
          }

          for (let index = 0; index < Math.min(maxInvalidations, memberInvalidations.length); index++) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guaranteed to be defined
            invalidations.push(memberInvalidations[index]!)
          }

          // for (const member of matchingLogicalGuards) {
          //   const pathClone = Array.from(path)

          //   if (member.validate(input, pathClone, invalidations) === false) {
          //     return false
          //   }
          // }
        }
        // new end

        // if (typeNames.includes(inputType) === false) {
        //   invalidations.push({
        //     rule: 'type',
        //     path,
        //     setting: typeNames,
        //     actual: inputType
        //   })

        //   return false
        // }

        // const matchingLogicalGuards = distinctMembers.filter((member) => member.type.includes(inputType))

        // if (matchingLogicalGuards.length === 0) {
        //   return true
        // }

        // const memberInvalidations: Invalidation[] = []

        // for (const member of matchingLogicalGuards) {
        //   const pathClone = Array.from(path)

        //   if (member.validate(input, pathClone, memberInvalidations)) {
        //     return true
        //   }
        // }

        // memberInvalidations.forEach((invalidation) => {
        //   invalidations.push(invalidation)
        // })

        return false
      } finally {
        if (inputType === 'object') {
          circularTracker.delete(input as object)
        }
      }
    },

    toString() {
      const wrappedMembers = distinctMembers.map((member) => `(${member.toString()})`)

      return `(${wrappedMembers.join(' | ')})`
    },

    toTypeScript({
      path,
    }: {
      /** @internal */
      readonly path?: undefined | string
      /** @internal */
      readonly circular?: undefined | Map<object, string>
    } = {}): string {
      const wrappedMembers = distinctMembers.map((member) => `(${member.toTypeScript({ path, circular: new Map() })})`)

      return `(${wrappedMembers.join(' | ')})`
    },
  })

  CircularityTrackers.set(unionGuard, new WeakSet())

  return unionGuard
}
