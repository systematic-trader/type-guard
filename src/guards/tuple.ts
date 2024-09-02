import { ArrayGuard } from './array.ts'
import { instance } from './instance.ts'
import { union } from './union.ts'

import type { Invalidation } from './errors.ts'
import type { Guard, GuardType } from './guard.ts'

const CircularityTrackers = new WeakMap<object, WeakMap<object, unknown>>()
const CoercersCache = new WeakMap<
  TupleGuard<ReadonlyArray<Guard<unknown>>>,
  undefined | ReadonlyArray<undefined | Guard<unknown>>
>()

/**
 * Construct a type-guard for a tuple
 * @param members - array of type-guards for the tuple values
 */
export function tuple<Members extends ReadonlyArray<Guard<unknown>>>(
  members: readonly [...Members],
): TupleGuard<Members> {
  return new TupleGuard<Members>(members)
}

// const t1 = tuple([string(), number()])
// const x: unknown = undefined

// if (t1.accept(x)) {
//   const y = x
// }

const ArrayType = instance(Array)

export class TupleGuard<Members extends ReadonlyArray<Guard<unknown>>> extends ArrayGuard<Members[number]> {
  readonly members: readonly [...Members]

  override get arguments(): readonly unknown[] {
    return [this.members]
  }

  constructor(members: readonly [...Members]) {
    const items = union(members)

    super(items, { length: members.length })

    // deno-lint-ignore no-this-alias
    const self = this

    Reflect.set(self, 'name', 'tuple')

    this.members = members

    CircularityTrackers.set(this, new WeakMap())
  }

  override accept(input: unknown): input is readonly [...{ readonly [I in keyof Members]: GuardType<Members[I]> }] {
    if (ArrayType.accept(input)) {
      if (input.length !== this.members.length) {
        return false
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Guaranteed to be defined
      const circularTracker = CircularityTrackers.get(this)!

      if (circularTracker.has(input)) {
        return true
      }

      try {
        circularTracker.set(input, undefined)

        for (const [index, element] of input.entries()) {
          const member = this.members[index]

          if (member.accept(element) === false) {
            return false
          }
        }

        return true
      } finally {
        circularTracker.delete(input)
      }
    }

    return false
  }

  append<AppendItems extends ReadonlyArray<Guard<unknown>>>(
    items: readonly [...AppendItems],
  ): TupleGuard<readonly [...Members, ...AppendItems]> {
    const appendedItems = [...this.members, ...items] as const

    return new TupleGuard(appendedItems)
  }

  override coerce(
    input: unknown,
    path: ReadonlyArray<number | string | symbol>,
  ): { readonly skipCoerce: boolean; readonly value: unknown } {
    let coercers = CoercersCache.get(this) as undefined | Array<undefined | Guard<unknown>>

    if (coercers === undefined && CoercersCache.has(this)) {
      return {
        skipCoerce: true,
        value: input,
      }
    } else if (coercers === undefined) {
      if (this.members.length === 0) {
        CoercersCache.set(this, undefined)

        return {
          skipCoerce: true,
          value: input,
        }
      }

      coercers = [...this.members]
      CoercersCache.set(this, coercers)
    }

    if (ArrayType.accept(input)) {
      if (input.length > this.members.length) {
        return {
          skipCoerce: false,
          value: input,
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Guaranteed to be defined
      const circularTracker = CircularityTrackers.get(this)!

      const circularReference = circularTracker.get(input)

      if (circularReference !== undefined) {
        return {
          skipCoerce: false,
          value: circularReference,
        }
      }

      const output: unknown[] = []
      let modified = false

      try {
        circularTracker.set(input, output)

        let skipCoerce = true

        for (let index = 0; index < this.members.length; index++) {
          const member = coercers[index]
          const inputItem = input[index]

          if (member === undefined) {
            output[index] = inputItem
          } else {
            const coercedItem = member.coerce(inputItem, [...path, index])

            if (inputItem !== coercedItem.value) {
              modified = true
            }

            if (index < input.length || coercedItem.value !== undefined) {
              output[index] = coercedItem.value
            }

            if (coercedItem.skipCoerce === false) {
              skipCoerce = false
            } else {
              coercers[index] = undefined
            }
          }
        }

        if (skipCoerce) {
          CoercersCache.set(this, undefined)

          return {
            skipCoerce,
            value: input,
          }
        }

        return {
          skipCoerce,
          value: modified ? output : input,
        }
      } finally {
        circularTracker.delete(input)
      }
    } else {
      return { skipCoerce: false, value: input }
    }
  }

  override convert<U = unknown, C = unknown>(
    input: readonly [...{ readonly [I in keyof Members]: GuardType<Members[I]> }],
    context: C,
    path: ReadonlyArray<number | string | symbol>,
    converter: (input: unknown, path: ReadonlyArray<number | string | symbol>, guard: Guard<unknown>, context: C) => U,
    options?: {
      continue?(path: ReadonlyArray<number | string | symbol>, guard: Guard<unknown>): boolean
    },
  ): U {
    if (options?.continue !== undefined && options.continue(path, this) === false) {
      return converter(input, path, this, context)
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Guaranteed to be defined
    const circularTracker = CircularityTrackers.get(this)!

    if (circularTracker.has(input)) {
      throw new Error('Circular reference detected - convert does not support circular references')
    }

    const output: unknown[] = []

    try {
      circularTracker.set(input, output)

      let modified = false

      for (const [index, member] of this.members.entries()) {
        const inputItem = input[index]

        const convertedItem = converter(inputItem, [...path, index], member, context)

        output.push(convertedItem)

        if (convertedItem !== inputItem) {
          modified = true
        }
      }

      if (modified === false) {
        return converter(input, path, this, context)
      }

      return converter(output, path, this, context)
    } finally {
      circularTracker.delete(input)
    }
  }

  override equals(other: unknown): other is TupleGuard<Members> {
    if (this === other) {
      return true
    }

    return (
      other instanceof TupleGuard &&
      this.members.length === other.members.length &&
      this.members.every((member, index) => member.equals(other.members[index]))
    )
  }

  override *inspect<I = unknown>(
    path: ReadonlyArray<number | string | symbol>,
    inspecter: (path: ReadonlyArray<number | string | symbol>, guard: Guard<unknown>) => Iterable<I>,
  ): Iterable<I> {
    yield* inspecter(path, this)

    let index = 0

    for (const member of this.members) {
      yield* member.inspect([...path, index], inspecter)

      index++
    }
  }

  pick<P extends ReadonlyArray<TupleIndices<Members>>>(
    indices: readonly [...P],
  ): TupleGuard<
    Extract<
      { readonly [I in keyof P]: P[I] extends keyof Members ? Members[P[I]] : never },
      ReadonlyArray<Guard<unknown>>
    >
  >
  pick(indices: readonly number[]): TupleGuard<ReadonlyArray<Members[number]>>
  pick<P extends ReadonlyArray<TupleIndices<Members>>>(
    indices: readonly [...P],
  ):
    | TupleGuard<
      Extract<
        { readonly [I in keyof P]: P[I] extends keyof Members ? Members[P[I]] : never },
        ReadonlyArray<Guard<unknown>>
      >
    >
    | TupleGuard<ReadonlyArray<Members[number]>> {
    const pickedGuards = indices.map((index) => this.pluck(index))

    // deno-lint-ignore no-explicit-any
    return new TupleGuard(pickedGuards as any)
  }

  prepend<PrependItems extends ReadonlyArray<Guard<unknown>>>(
    items: readonly [...PrependItems],
  ): TupleGuard<readonly [...PrependItems, ...Members]> {
    const prependedItems = [...items, ...this.members]

    // deno-lint-ignore no-explicit-any
    return new TupleGuard(prependedItems as any)
  }

  pluck<Index extends TupleIndices<Members>>(index: Index): Members[Index]
  pluck(index: number): Members[number]
  pluck<Index extends TupleIndices<Members>>(index: Index): Members[Index] {
    // deno-lint-ignore no-explicit-any
    const pluckedGuard: any = this.members[index as any]

    if (pluckedGuard === undefined) {
      throw new Error(`[${String(index)}] is out of bounds. Pluck between 0-${this.members.length - 1}`)
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- Must be solved later if even possible
    return pluckedGuard
  }

  override scan<C = unknown>(
    input: unknown,
    context: C,
    path: ReadonlyArray<number | string | symbol>,
    scanner: (input: unknown, path: ReadonlyArray<number | string | symbol>, guard: Guard<unknown>, context: C) => void,
    options?: {
      continue?(path: ReadonlyArray<number | string | symbol>, guard: Guard<unknown>): boolean
      readonly maxPathLength?: number
    },
  ): void {
    if (options?.continue !== undefined && options.continue(path, this) === false) {
      scanner(input, path, this, context)

      return
    }

    if (Array.isArray(input)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Guaranteed to be defined
      const circularTracker = CircularityTrackers.get(this)!

      if (circularTracker.has(input)) {
        return
      }

      try {
        circularTracker.set(input, undefined)

        if (options?.maxPathLength !== undefined && path.length > options.maxPathLength) {
          return
        }

        scanner(input, path, this, context)

        let index = 0

        for (const member of this.members) {
          const itemGuard = member as unknown as Guard<unknown>

          itemGuard.scan(input[index], context, [...path, index], scanner, options)

          index++
        }
      } finally {
        circularTracker.delete(input)
      }
    }
  }

  override substitute<R = unknown>(
    path: ReadonlyArray<number | string | symbol>,
    replacer: (path: ReadonlyArray<number | string | symbol>, guard: Guard<unknown>) => Guard<unknown>,
  ): Guard<R> {
    let modified = false

    const membersReplacement: Array<Guard<unknown>> = []

    for (const [index, member] of this.members.entries()) {
      const replacement = replacer([...path, index], member)

      if (replacement !== member) {
        modified = true
      }

      membersReplacement.push(replacement)
    }

    const replacement = modified ? new TupleGuard(membersReplacement) : this

    return replacer(path, replacement) as Guard<R>
  }

  override toString(): string {
    return `[${this.members.map((member) => member.toString()).join(', ')}]`
  }

  override toTypeScript({
    path,
    circular = new Map(),
  }: {
    readonly interfaceName?: undefined | string
    /** @internal */
    readonly path?: undefined | string
    /** @internal */
    // eslint-disable-next-line functional/prefer-readonly-type -- internal API
    readonly circular?: undefined | Map<object, string>
  }): string {
    const existingPath = circular.get(this)

    if (existingPath !== undefined) {
      return existingPath
    }

    if (path === undefined) {
      return this.toString()
    }

    circular.set(this, path)

    const membersTypeScript = this.members.map((member, index) => {
      const ts = member.toTypeScript({ path: `${path}[${index}]`, circular })

      return `(${ts})`
    })

    return `readonly [${membersTypeScript.join(', ')}]`
  }

  unionize(): Guard<Members[number]> {
    return union(this.members) as Guard<Members[number]>
  }

  override validate(
    input: unknown,
    path: ReadonlyArray<number | string | symbol>,
    // eslint-disable-next-line functional/prefer-readonly-type -- internal API
    previous: Invalidation[],
  ): input is readonly [...{ readonly [I in keyof Members]: GuardType<Members[I]> }] {
    if (ArrayType.validate(input, path, previous)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Guaranteed to be defined
      const circularTracker = CircularityTrackers.get(this)!

      circularTracker.set(input, undefined)

      try {
        if (input.length === this.members.length) {
          let isValid = true

          for (const [index, member] of this.members.entries()) {
            if (member.validate(input[index], [...path, index], previous) === false) {
              isValid = false
            }
          }

          return isValid
        }

        previous.push({
          rule: 'logical',
          guard: 'literal',
          path: [...path, 'length'],
          function: 'equals',
          setting: this.members.length,
          actual: input.length,
        })

        return false
      } finally {
        circularTracker.delete(input)
      }
    } else {
      return false
    }
  }
}

type IsTuple<T> = T extends readonly unknown[] ? (number extends T['length'] ? 0 : 1) : 0

// eslint-disable-next-line functional/prefer-readonly-type -- We need the mutable type
type TupleIndices<T> = IsTuple<T> extends 1 ? Exclude<keyof T, keyof []> : keyof T
