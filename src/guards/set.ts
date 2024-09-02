import { Guard } from './guard.ts'
import { instance } from './instance.ts'
import { literal } from './literal.ts'
import { number } from './number.ts'

import type { Invalidation } from './errors.ts'
import type { GuardType } from './index.ts'
import type { NumberGuardSettings } from './number.ts'

export interface SetGuardSettings {
  /** enforce specific size */
  readonly size?: undefined | number | Guard<number> | NumberGuardSettings
}

const GUARDS = new WeakMap<Guard<unknown>, SetGuard<Guard<unknown>>>()

export const set = <Items extends Guard<unknown>>(items: Items, settings: SetGuardSettings = {}): SetGuard<Items> => {
  if (Object.values(settings).every((setting) => setting === undefined)) {
    const existing = GUARDS.get(items)

    if (existing !== undefined) {
      return existing as SetGuard<Items>
    }
  }

  return new SetGuard(items, settings)
}

const SetType = instance(Set)

const CircularityTrackers = new WeakMap<SetGuard<Guard<unknown>>, WeakMap<object, unknown>>()

const SkipCoerceCache = new WeakMap<SetGuard<Guard<unknown>>, boolean>()

// eslint-disable-next-line functional/prefer-readonly-type -- We want mutable Set
export class SetGuard<Items extends Guard<unknown>> extends Guard<Set<GuardType<Items>>> {
  readonly items: Items
  readonly settings: {
    readonly size?: Guard<number>
  }

  constructor(items: Items, settings: SetGuardSettings = {}) {
    const emptySettings = Object.values(settings).every((setting) => setting === undefined)

    super({
      name: 'set',

      type: ['object'],

      arguments: [items, settings],
    })

    this.items = items

    const sanitizedSettings: {
      size?: Guard<number>
    } = {}

    const size = settings.size === undefined
      ? undefined
      : typeof settings.size === 'number'
      ? literal(settings.size)
      : settings.size instanceof Guard
      ? settings.size
      : number(settings.size)

    if (size !== undefined) {
      sanitizedSettings.size = size
    }

    this.settings = sanitizedSettings

    CircularityTrackers.set(this, new WeakMap())
    SkipCoerceCache.set(this, false)

    if (emptySettings === true) {
      GUARDS.set(items, this)
    }
  }

  // eslint-disable-next-line functional/prefer-readonly-type -- We want mutable Set
  override accept(input: unknown): input is Set<GuardType<Items>> {
    if (input instanceof Set) {
      if (this.settings.size !== undefined && this.settings.size.accept(input.size) === false) {
        return false
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Guaranteed to be defined
      const circularTracker = CircularityTrackers.get(this)!

      if (circularTracker.has(input)) {
        return true
      }

      try {
        circularTracker.set(input, true)

        for (const item of input) {
          if (this.items.accept(item) === false) {
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

  override coerce(
    input: unknown,
    path: ReadonlyArray<number | string | symbol>,
  ): { readonly skipCoerce: boolean; readonly value: unknown } {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Guaranteed to be defined
    let skipCoerce = SkipCoerceCache.get(this)!

    if (skipCoerce) {
      return { skipCoerce, value: input }
    }

    if (input instanceof Set) {
      const output = new Set<unknown>()

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Guaranteed to be defined
      const circularTracker = CircularityTrackers.get(this)!

      const circularReference = circularTracker.get(input)

      if (circularReference !== undefined) {
        return {
          skipCoerce: false,
          value: circularReference,
        }
      }

      let modified = false

      try {
        circularTracker.set(input, output)

        for (const item of input) {
          if (skipCoerce) {
            output.add(item)
          } else {
            const coercedItem = this.items.coerce(item, path)

            if (coercedItem.skipCoerce) {
              skipCoerce = true
            }

            if (modified === false && coercedItem.value !== item) {
              modified = true
            }

            output.add(coercedItem.value)
          }
        }

        return { skipCoerce, value: modified ? output : input }
      } finally {
        circularTracker.delete(input)
      }
    } else {
      return { skipCoerce, value: input }
    }
  }

  override convert<U = unknown, C = unknown>(
    input: ReadonlySet<GuardType<Items>>,
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

    const output = new Set()
    let modified = false

    try {
      circularTracker.set(input, output)

      let index = 0

      for (const item of input) {
        const convertedItem = this.items.convert(item, context, [...path, index], converter, options)

        if (convertedItem !== item) {
          modified = true
        }

        output.add(convertedItem)

        index++
      }

      return converter(modified ? output : input, path, this, context)
    } finally {
      circularTracker.delete(input)
    }
  }

  // eslint-disable-next-line functional/prefer-readonly-type -- We want mutable Set
  override equals(other: unknown): other is Guard<Set<GuardType<Items>>> {
    if (this === other) {
      return true
    }

    if (other instanceof SetGuard && this.items.equals(other.items)) {
      return this.settings.size === undefined
        ? other.settings.size === undefined
        : this.settings.size.equals(other.settings.size)
    }

    return false
  }

  override *inspect<I = unknown>(
    path: ReadonlyArray<number | string | symbol>,
    inspecter: (path: ReadonlyArray<number | string | symbol>, guard: Guard<unknown>) => Iterable<I>,
  ): Iterable<I> {
    yield* inspecter(path, this)
    yield* this.items.inspect(path, inspecter)
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
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Guaranteed to be defined
    const circularTracker = CircularityTrackers.get(this)!

    if (input instanceof Set) {
      if (circularTracker.get(input) !== undefined) {
        return
      }

      if (options?.continue !== undefined && options.continue(path, this) === false) {
        scanner(input, path, this, context)

        return
      }

      try {
        circularTracker.set(input, undefined)

        scanner(input, path, this, context)

        let index = 0

        for (const item of input) {
          this.items.scan(item, context, [...path, index], scanner, options)

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
    const itemsReplacement = this.items.substitute(path, replacer)

    const replacement = this.items === itemsReplacement || this.items.equals(itemsReplacement)
      ? this
      : new SetGuard(itemsReplacement, this.settings)

    return replacer(path, replacement) as Guard<R>
  }

  override toString(): string {
    return `Set<${this.items.toString()}>`
  }

  override toTypeScript(
    options?:
      | undefined
      | {
        /** @internal */
        readonly path?: undefined | string
        /** @internal */
        // eslint-disable-next-line functional/prefer-readonly-type -- internal API
        readonly circular?: undefined | Map<object, string>
      },
  ): string {
    if (options?.path === undefined) {
      return this.toString()
    }

    const itemsPath = `((${options.path}) extends Set<infer I> ? I : never)`

    const itemsTypeScript = this.items.toTypeScript({ path: itemsPath, circular: options.circular })

    return `Set<${itemsTypeScript}>`
  }

  override validate(
    input: unknown,
    path: ReadonlyArray<number | string | symbol>,
    // eslint-disable-next-line functional/prefer-readonly-type -- Internal API
    invalidations: Invalidation[],
    // eslint-disable-next-line functional/prefer-readonly-type -- We want mutable Set
  ): input is Set<GuardType<Items>> {
    if (SetType.validate(input, path, invalidations)) {
      if (
        this.settings.size !== undefined &&
        this.settings.size.validate(input.size, [...path, 'size'], invalidations) === false
      ) {
        return false
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Guaranteed to be defined
      const circularTracker = CircularityTrackers.get(this)!

      if (circularTracker.has(input)) {
        return true
      }

      let isValid = true

      try {
        circularTracker.set(input, undefined)

        let index = 0

        for (const item of input) {
          if (this.items.validate(item, [...path, index], invalidations) === false) {
            isValid = false
          }

          index++
        }
      } finally {
        circularTracker.delete(input)
      }

      return isValid
    }

    return false
  }
}
