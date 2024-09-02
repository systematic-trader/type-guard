import equal from 'npm:fast-deep-equal@3.1.3'
import { Guard } from './guard.ts'
import { props } from './object.ts'
import { string } from './string.ts'
import { type } from './type.ts'
import { union } from './union.ts'

const IterableGuards = new WeakMap<Guard<unknown>, Guard<Iterable<unknown>>>()

function isIterable(input: unknown): input is Iterable<unknown> {
  return (
    input !== null &&
    typeof input === 'object' &&
    typeof (input as Iterable<unknown>)[Symbol.iterator] === 'function'
  )
}

export function iterable<T>(items: Guard<T>): Guard<Iterable<T>> {
  const existing = IterableGuards.get(items)

  if (existing !== undefined) {
    return existing as Guard<Iterable<T>>
  }

  const iterableType = union([
    props(
      {
        [Symbol.iterator]: type('function') as Guard<() => Iterator<unknown>>,
      },
      { extendable: true }
    ),
    string(),
  ])

  const circularityTracker = new WeakMap<object, unknown>()

  let skipCoerce = false

  const iterableGuard = new Guard({
    name: 'iterable',

    type: ['object'],

    arguments: [items],

    accept(input): input is Iterable<T> {
      if (Array.isArray(input)) {
        return input.every((item) => items.accept(item))
      } else if (iterableType.accept(input)) {
        if (typeof input === 'string') {
          for (const char of input) {
            if (items.accept(char) === false) {
              return false
            }
          }

          return true
        }

        if (circularityTracker.has(input)) {
          return true
        }

        circularityTracker.set(input, undefined)

        try {
          for (const item of input) {
            if (items.accept(item) === false) {
              return false
            }
          }
        } finally {
          circularityTracker.delete(input)
        }

        return true
      }

      return false
    },

    coerce(input, path) {
      if (skipCoerce === true) {
        return {
          skipCoerce,
          value: input,
        }
      }

      if (input instanceof Set) {
        const ciruclarReference = circularityTracker.get(input)

        if (ciruclarReference !== undefined) {
          return {
            skipCoerce: false,
            value: ciruclarReference,
          }
        }

        const output = new Set()

        let modified = false
        let index = 0

        circularityTracker.set(input, output)

        try {
          for (const item of input) {
            if (skipCoerce === true) {
              output.add(item)
            } else {
              const coercedItem = items.coerce(item, [...path, index])

              if (coercedItem.skipCoerce === true) {
                skipCoerce = true
              }

              if (modified === false && coercedItem.value !== item) {
                modified = true
              }

              output.add(coercedItem.value)
            }

            index++
          }
        } finally {
          circularityTracker.delete(input)
        }

        return {
          skipCoerce,
          value: modified ? output : input,
        }
      } else if (input instanceof Map) {
        const ciruclarReference = circularityTracker.get(input)

        if (ciruclarReference !== undefined) {
          return {
            skipCoerce: false,
            value: ciruclarReference,
          }
        }

        const output = new Map()

        let modified = false
        let index = 0

        circularityTracker.set(input, output)

        try {
          for (const entry of input) {
            if (skipCoerce === true) {
              output.set(entry[0], entry[1])
            } else {
              const coercedItem = items.coerce(entry, [...path, index])

              if (coercedItem.skipCoerce === true) {
                skipCoerce = true
              }

              const coercedEntry = coercedItem.value as [unknown, unknown]

              if (modified === false && equal(coercedEntry, entry) === false) {
                modified = true
              }

              output.set(coercedEntry[0], coercedEntry[1])
            }

            index++
          }
        } finally {
          circularityTracker.delete(input)
        }

        return {
          skipCoerce,
          value: modified ? output : input,
        }
      } else if (iterableType.accept(input)) {
        if (typeof input === 'string') {
          let output = ''

          let modified = false
          let index = 0

          for (const char of input) {
            if (skipCoerce === true) {
              output += char
            } else {
              const coercedItem = items.coerce(char, [...path, index])

              if (coercedItem.skipCoerce === true) {
                skipCoerce = true
              }

              if (modified === false && coercedItem.value !== char) {
                modified = true
              }

              output += coercedItem.value as string
            }

            index++
          }

          return {
            skipCoerce,
            value: modified ? output : input,
          }
        }
        const ciruclarReference = circularityTracker.get(input)

        if (ciruclarReference !== undefined) {
          return {
            skipCoerce: false,
            value: ciruclarReference,
          }
        }

        const output: unknown[] = []

        let modified = false
        let index = 0

        circularityTracker.set(input, output)

        try {
          for (const item of input) {
            if (skipCoerce === true) {
              output.push(item)
            } else {
              const coercedItem = items.coerce(item, [...path, index])

              if (coercedItem.skipCoerce === true) {
                skipCoerce = true
              }

              if (modified === false && coercedItem.value !== item) {
                modified = true
              }

              output.push(coercedItem.value)
            }

            index++
          }
        } finally {
          circularityTracker.delete(input)
        }

        return {
          skipCoerce,
          value: modified ? output : input,
        }
      }

      return {
        skipCoerce,
        value: input,
      }
    },

    convert<U = unknown, C = unknown>(
      input: readonly T[],
      context: C,
      path: ReadonlyArray<number | string | symbol>,
      converter: (
        input: unknown,
        path: ReadonlyArray<number | string | symbol>,
        guard: Guard<unknown>,
        context: C
      ) => U,
      options?: {
        continue?(
          path: ReadonlyArray<number | string | symbol>,
          guard: Guard<unknown>
        ): boolean
      }
    ): U {
      if (
        options?.continue !== undefined &&
        options.continue(path, iterableGuard) === false
      ) {
        return converter(input, path, iterableGuard, context)
      }

      if (typeof input === 'string') {
        let output = ''
        let modified = false

        let index = 0

        for (const char of input as string) {
          const outputChar = converter(char, [...path, index], items, context)

          if (modified === false && outputChar !== char) {
            modified = true
          }

          output += outputChar

          index++
        }

        return converter(
          modified ? output : input,
          path,
          iterableGuard,
          context
        )
      }

      if (circularityTracker.has(input)) {
        throw new Error(
          'Circular reference detected - convert does not support circular references'
        )
      }

      const output: unknown[] = []
      let modified = false

      try {
        circularityTracker.set(input, output)

        let index = 0

        for (const item of input) {
          const convertedItem: unknown = items.convert(
            item,
            context,
            [...path, index],
            converter,
            options
          )

          if (convertedItem !== item) {
            modified = true
          }

          output.push(convertedItem)

          index++
        }

        if (modified === true) {
          if (input instanceof Set) {
            return converter(new Set(output), path, iterableGuard, context)
          }

          if (input instanceof Map) {
            return converter(
              new Map(output as unknown as Map<unknown, unknown>),
              path,
              iterableGuard,
              context
            )
          }

          return converter(output, path, iterableGuard, context)
        }

        return converter(input, path, iterableGuard, context)
      } finally {
        circularityTracker.delete(input)
      }
    },

    equals(other): other is Guard<Iterable<T>> {
      if (iterableGuard === other) {
        return true
      }

      return (
        other instanceof Guard &&
        other.name === 'iterable' &&
        items.equals(other.arguments[0])
      )
    },

    *inspect<I = unknown>(
      path: ReadonlyArray<number | string | symbol>,
      inspecter: (
        path: ReadonlyArray<number | string | symbol>,
        guard: Guard<unknown>
      ) => Iterable<I>
    ): Iterable<I> {
      yield* inspecter(path, iterableGuard)
      yield* items.inspect(path, inspecter)
    },

    scan<C = unknown>(
      input: unknown,
      context: C,
      path: ReadonlyArray<number | string | symbol>,
      scanner: (
        input: unknown,
        path: ReadonlyArray<number | string | symbol>,
        guard: Guard<unknown>,
        context: C
      ) => void,
      options?: {
        continue?(
          path: ReadonlyArray<number | string | symbol>,
          guard: Guard<unknown>
        ): boolean
        readonly maxPathLength?: number
      }
    ): void {
      if (
        options?.continue !== undefined &&
        options.continue(path, iterableGuard) === false
      ) {
        scanner(input, path, iterableGuard, context)

        return
      }

      if (typeof input === 'string') {
        scanner(input, path, iterableGuard, context)

        let index = 0

        for (const item of input) {
          items.scan(item, context, [...path, index], scanner, options)

          index++
        }
      }

      if (isIterable(input)) {
        if (circularityTracker.get(input) !== undefined) {
          return
        }

        try {
          circularityTracker.set(input, undefined)

          scanner(input, path, iterableGuard, context)

          let index = 0

          for (const item of input) {
            items.scan(item, context, [...path, index], scanner, options)

            index++
          }
        } finally {
          circularityTracker.delete(input)
        }
      }
    },

    substitute<R = unknown>(
      path: ReadonlyArray<number | string | symbol>,
      replacer: (
        path: ReadonlyArray<number | string | symbol>,
        guard: Guard<unknown>
      ) => Guard<unknown>
    ): Guard<R> {
      const itemsReplacement = items.substitute(path, replacer)

      const replacement =
        items === itemsReplacement ? iterableGuard : iterable(itemsReplacement)

      return replacer(path, replacement) as Guard<R>
    },

    validate(input, path, invalidations): input is Iterable<T> {
      if (iterableType.validate(input, path, invalidations)) {
        if (typeof input === 'string') {
          let isValid = true
          let index = 0

          for (const item of input) {
            if (
              items.validate(item, [...path, index], invalidations) === false
            ) {
              isValid = false
            }

            index++
          }

          return isValid
        }

        if (circularityTracker.has(input)) {
          return true
        }

        circularityTracker.set(input, undefined)

        let isValid = true
        let index = 0

        try {
          for (const item of input) {
            if (
              items.validate(item, [...path, index], invalidations) === false
            ) {
              isValid = false
            }

            index++
          }
        } finally {
          circularityTracker.delete(input)
        }

        return isValid
      }

      return false
    },

    toString() {
      return `Iterable<${items.toString()}>`
    },

    toTypeScript(
      options?:
        | undefined
        | {
            /** @internal */
            readonly path?: undefined | string
            /** @internal */
            readonly circular?: undefined | Map<object, string>
          }
    ): string {
      if (options?.path === undefined) {
        return `Iterable<${items.toString()}>`
      }

      const itemsPath = `(${options.path} extends Iterable<infer I> ? I : never)`

      const itemsAsTypeScript = items.toTypeScript({
        path: itemsPath,
        circular: options.circular,
      })

      return `Iterable<${itemsAsTypeScript}>`
    },
  })

  IterableGuards.set(items, iterableGuard)

  return iterableGuard
}
