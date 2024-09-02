import equal from 'npm:fast-deep-equal@3.1.3'

import { enums } from './enums.ts'
import { AssertionError } from './errors.ts'

import type { Invalidation } from './errors.ts'
import type { LiteralType } from './literal.ts'

export type GuardType<T> = T extends {
  accept(input: unknown): input is infer U
}
  ? U
  : never

export interface TypeMap {
  // deno-lint-ignore no-explicit-any
  readonly any: any
  readonly bigint: bigint
  readonly boolean: boolean
  function(...args: readonly unknown[]): unknown
  readonly never: never
  readonly null: null
  readonly number: number
  readonly object: Record<number | string | symbol, unknown>
  readonly string: string
  readonly symbol: symbol
  readonly undefined: undefined
  readonly unknown: unknown
  readonly NaN: never
}

export type TypeName = keyof TypeMap

export interface GuardSettings<T>
  extends Pick<Guard<T>, 'arguments' | 'name' | 'type'>,
    Partial<
      Pick<
        Guard<T>,
        | 'accept'
        | 'coerce'
        | 'convert'
        | 'equals'
        | 'inspect'
        | 'scan'
        | 'substitute'
        | 'toString'
        | 'toTypeScript'
        | 'validate'
      >
    > {}

const ARGUMENTS = new WeakMap<Guard<unknown>, readonly unknown[]>()

export class Guard<T> {
  static getType(input: unknown): TypeName {
    const type = typeof input

    if (type === 'object') {
      return input === null ? ('null' as const) : type
    } else if (type === 'number') {
      return Number.isFinite(input as number) === false
        ? ('NaN' as const)
        : type
    }

    return type
  }

  readonly name: string
  readonly type: readonly TypeName[]

  get arguments(): readonly unknown[] {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Guaranteed to be set
    return ARGUMENTS.get(this)!
  }

  constructor(settings: GuardSettings<T>) {
    this.name = settings.name

    ARGUMENTS.set(this, settings.arguments)

    this.type = settings.type

    if (settings.accept !== undefined) {
      this.accept = settings.accept
    }

    if (settings.coerce !== undefined) {
      this.coerce = settings.coerce
    }

    if (settings.convert !== undefined) {
      this.convert = settings.convert
    }

    if (settings.equals !== undefined) {
      this.equals = settings.equals
    }

    if (settings.inspect !== undefined) {
      this.inspect = settings.inspect
    }

    if (settings.scan !== undefined) {
      this.scan = settings.scan
    }

    if (settings.substitute !== undefined) {
      this.substitute = settings.substitute
    }

    if (settings.validate !== undefined) {
      this.validate = settings.validate
    }

    if (
      settings.toString !== Object.prototype.toString &&
      settings.toString !== undefined
    ) {
      this.toString = settings.toString
    }

    if (settings.toTypeScript !== undefined) {
      this.toTypeScript = settings.toTypeScript
    }
  }

  // deno-lint-ignore no-unused-vars
  accept(input: unknown): input is T {
    return true
  }

  coerce(
    input: unknown,
    _path: ReadonlyArray<number | string | symbol>
  ): { readonly skipCoerce: boolean; readonly value: unknown } {
    return {
      skipCoerce: true,
      value: input,
    }
  }

  convert<U = unknown, C = unknown>(
    input: T,
    context: C,
    path: ReadonlyArray<number | string | symbol>,
    converter: (
      input: unknown,
      path: ReadonlyArray<number | string | symbol>,
      guard: Guard<unknown>,
      context: C
    ) => U,
    _options?:
      | undefined
      | {
          readonly continue?:
            | undefined
            | ((
                path: ReadonlyArray<number | string | symbol>,
                guard: Guard<unknown>
              ) => boolean)
        }
  ): U {
    return converter(input, path, this, context)
  }

  equals(other: unknown): other is Guard<T> {
    return this === other
  }

  exclude<U extends ReadonlyArray<T & LiteralType>>(
    values: readonly [...U]
  ): Guard<Exclude<T, U[number]>> {
    if (values.length === 0) {
      return this as Guard<Exclude<T, U[number]>>
    }

    for (const value of values) {
      if (this.accept(value) === false) {
        throw new TypeError(
          `Value ${String(value)} is not valid and cannot be excluded`
        )
      }
    }

    const isExcluded =
      values.length === 1
        ? Guard.getType(values[0]) === 'object'
          ? (input: unknown) => equal(values[0], input)
          : (input: unknown) => values[0] === input
        : (input: unknown) => values.some((value) => equal(value, input))

    // deno-lint-ignore no-this-alias
    const self = this

    const excludeGuard: Guard<Exclude<T, U[number]>> = new Guard<
      Exclude<T, U[number]>
    >({
      name: 'exclude',

      type: this.type,

      arguments: [self, values],

      accept(input): input is Exclude<T, U[number]> {
        return self.accept(input) && isExcluded(input) === false
      },

      coerce(input, path) {
        return self.coerce(input, path)
      },

      convert(input, context, path, converter) {
        if (isExcluded(input) === true) {
          throw new AssertionError([
            {
              rule: 'logical',
              guard: self.name,
              path,
              function: 'notEquals',
              setting: input,
              actual: input,
            },
          ])
        }
        return self.convert(input, context, path, converter)
      },

      equals(other): other is Guard<Exclude<T, U[number]>> {
        if (other instanceof Guard && Array.isArray(other.arguments[1])) {
          const compareValues = (
            left: ReadonlyArray<[...U][number]>,
            right: ReadonlyArray<[...U][number]>
          ) =>
            left.every((leftItem) =>
              right.some((rightItem) => equal(leftItem, rightItem))
            ) &&
            right.every((rightItem) =>
              left.some((leftItem) => equal(rightItem, leftItem))
            )

          return (
            self === other.arguments[0] &&
            compareValues(values, other.arguments[1])
          )
        }

        return false
      },

      inspect(path, inspecter) {
        return self.inspect(path, inspecter)
      },

      scan(input, context, path, scanner, options) {
        if (isExcluded(input) === true) {
          throw new AssertionError([
            {
              rule: 'logical',
              guard: self.name,
              path,
              function: 'notEquals',
              setting: input,
              actual: input,
            },
          ])
        }

        self.scan(input, context, path, scanner, options)
      },

      substitute(path, replacer) {
        return self.substitute(path, replacer)
      },

      validate(input, path, invalidations): input is Exclude<T, U[number]> {
        if (self.validate(input, path, invalidations)) {
          if (isExcluded(input)) {
            invalidations.push({
              rule: 'logical',
              guard: self.name,
              path,
              function: 'notEquals',
              setting: input,
              actual: input,
            })

            return false
          }

          return true
        }

        return false
      },
    })

    return excludeGuard
  }

  extract<U extends ReadonlyArray<T & LiteralType>>(
    values: readonly [...U]
  ): Guard<U[number]> {
    for (const value of values) {
      if (this.accept(value) === false) {
        throw new TypeError(
          `Value ${String(value)} is not valid and cannot be extracted`
        )
      }
    }

    return enums(values)
  }

  inspect<I = unknown>(
    path: ReadonlyArray<number | string | symbol>,
    inspecter: (
      path: ReadonlyArray<number | string | symbol>,
      guard: Guard<unknown>
    ) => Iterable<I>
  ): Iterable<I> {
    return inspecter(path, this)
  }

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
    options?:
      | undefined
      | {
          readonly continue?:
            | undefined
            | ((
                path: ReadonlyArray<number | string | symbol>,
                guard: Guard<unknown>
              ) => boolean)
          readonly maxPathLength?: undefined | number
        }
  ): void {
    if (
      options?.maxPathLength !== undefined &&
      path.length > options.maxPathLength
    ) {
      return
    }

    scanner(input, path, this, context)
  }

  substitute<R = unknown>(
    path: ReadonlyArray<number | string | symbol>,
    replacer: (
      path: ReadonlyArray<number | string | symbol>,
      guard: Guard<unknown>
    ) => Guard<unknown>
  ): Guard<R> {
    return replacer(path, this) as Guard<R>
  }

  toString(): string {
    return this.type
      .map((typeName) => {
        switch (typeName) {
          case 'function': {
            return '((...args: readonly unknown[]) => unknown))'
          }

          case 'NaN': {
            return 'number'
          }

          case 'object': {
            return 'Record<number | string | symbol, unknown>'
          }

          default: {
            return typeName
          }
        }
      })
      .join(' | ')
  }

  toTypeScript(
    _options?:
      | undefined
      | {
          /** @internal */
          readonly path?: undefined | string
          /** @internal */
          // eslint-disable-next-line functional/prefer-readonly-type -- internal API
          readonly circular?: undefined | Map<object, string>
        }
  ): string {
    return this.toString()
  }

  validate(
    // deno-lint-ignore no-unused-vars
    input: unknown,
    _path: ReadonlyArray<number | string | symbol>,
    _invalidations: Invalidation[]
  ): input is T {
    return true
  }
}
