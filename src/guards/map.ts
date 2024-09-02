import { Guard } from './guard.ts'
import { instance } from './instance.ts'
import { literal } from './literal.ts'
import { number } from './number.ts'

import type { Invalidation } from './errors.ts'
import type { GuardType } from './guard.ts'
import type { NumberGuardSettings } from './number.ts'

export interface MapGuardSettings {
  /** enforce specific size */
  readonly size?: undefined | number | Guard<number> | NumberGuardSettings
}

export const map = <Key extends Guard<unknown>, Value extends Guard<unknown>>(
  key: Key,
  value: Value,
  settings: MapGuardSettings = {},
): MapGuard<Key, Value> => {
  if (Object.values(settings).every((setting) => setting === undefined)) {
    const existing = KeyCache.get(key)?.get(value)

    if (existing !== undefined) {
      return existing as MapGuard<Key, Value>
    }
  }

  return new MapGuard(key, value, settings)
}

const KeyCache = new WeakMap<Guard<unknown>, WeakMap<Guard<unknown>, MapGuard<Guard<unknown>, Guard<unknown>>>>()

const CheckKeyCache = new WeakMap<MapGuard<Guard<unknown>, Guard<unknown>>, boolean>()

const CheckValueCache = new WeakMap<MapGuard<Guard<unknown>, Guard<unknown>>, boolean>()

const SkipCoerceCache = new WeakMap<MapGuard<Guard<unknown>, Guard<unknown>>, boolean>()

const CircularityTrackers = new WeakMap<
  MapGuard<Guard<unknown>, Guard<unknown>>,
  // eslint-disable-next-line functional/prefer-readonly-type -- GuardType is mutable
  WeakMap<object, undefined | Map<unknown, unknown>>
>()

export class MapGuard<Key extends Guard<unknown>, Value extends Guard<unknown>> extends Guard<
  // eslint-disable-next-line functional/prefer-readonly-type -- GuardType is mutable
  Map<GuardType<Key>, GuardType<Value>>
> {
  readonly key: Key
  readonly settings: {
    readonly size?: Guard<number>
  }
  readonly value: Value

  constructor(key: Key, value: Value, settings: MapGuardSettings = {}) {
    const emptySettings = Object.values(settings).every((setting) => setting === undefined)

    super({
      name: 'map',

      type: ['object'],

      arguments: [key, value, settings],
    })

    this.key = key
    this.value = value

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

    if (emptySettings === true) {
      let valueCache = KeyCache.get(key)

      if (valueCache === undefined) {
        valueCache = new WeakMap()
        KeyCache.set(key, valueCache)
      }

      valueCache.set(value, this)
    }

    const checkKey = (key.type.includes('any') || value.type.includes('unknown')) === false
    const checkValue = (value.type.includes('any') || value.type.includes('unknown')) === false

    CheckKeyCache.set(this, checkKey)
    CheckValueCache.set(this, checkValue)
    SkipCoerceCache.set(this, false)
    CircularityTrackers.set(this, new WeakMap())
  }

  // eslint-disable-next-line functional/prefer-readonly-type -- GuardType is mutable
  override accept(input: unknown): input is Map<GuardType<Key>, GuardType<Value>> {
    if (instance(Map).accept(input)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We know it is defined
      const circularTracker = CircularityTrackers.get(this)!

      if (circularTracker.has(input)) {
        return true
      }

      if (this.settings.size !== undefined && this.settings.size.accept(input.size) === false) {
        return false
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We know it is defined
      const checkKey = CheckKeyCache.get(this)!

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We know it is defined
      const checkValue = CheckValueCache.get(this)!

      if (checkKey === true && checkValue === true) {
        try {
          circularTracker.set(input, undefined)

          for (const [entryKey, entryValue] of input) {
            if (this.key.accept(entryKey) === false || this.value.accept(entryValue) === false) {
              return false
            }
          }
        } finally {
          circularTracker.delete(input)
        }
      } else if (checkKey === true && checkValue === false) {
        try {
          circularTracker.set(input, undefined)

          for (const entryKey of input.keys()) {
            if (this.key.accept(entryKey) === false) {
              return false
            }
          }
        } finally {
          circularTracker.delete(input)
        }
      } else if (checkKey === false && checkValue === true) {
        try {
          circularTracker.set(input, undefined)

          for (const entryValue of input.values()) {
            if (this.value.accept(entryValue) === false) {
              return false
            }
          }
        } finally {
          circularTracker.delete(input)
        }
      }

      return true
    }

    return false
  }

  override coerce(
    input: unknown,
    path: ReadonlyArray<number | string | symbol>,
  ): { readonly skipCoerce: boolean; readonly value: unknown } {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We know it is defined
    let skipCoerce = SkipCoerceCache.get(this)!

    if (skipCoerce) {
      return {
        skipCoerce,
        value: input,
      }
    }

    if (instance(Map).accept(input)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We know it is defined
      const circularTracker = CircularityTrackers.get(this)!

      const circularReference = circularTracker.get(input)

      if (circularReference !== undefined) {
        return { skipCoerce, value: circularReference }
      }

      const output = new Map()
      try {
        circularTracker.set(input, output)

        let modified = false

        for (const [entryKey, entryValue] of input) {
          if (skipCoerce) {
            output.set(entryKey, entryValue)
          } else {
            const coercedKey = this.key.coerce(entryKey, path)
            const coercedValue = this.value.coerce(entryValue, [...path, entryKey as number | string | symbol])

            if (coercedKey.skipCoerce === true && coercedValue.skipCoerce === true) {
              skipCoerce = true
            }

            if (coercedKey.value !== entryKey || coercedValue.value !== entryValue) {
              modified = true
            }

            output.set(coercedKey.value, coercedValue.value)
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
      return {
        skipCoerce,
        value: input,
      }
    }
  }

  override convert<U = unknown, C = unknown>(
    input: unknown,
    context: C,
    path: ReadonlyArray<number | string | symbol>,
    converter: (input: unknown, path: ReadonlyArray<number | string | symbol>, guard: Guard<unknown>, context: C) => U,
    options?: {
      continue?(path: ReadonlyArray<number | string | symbol>, guard: Guard<unknown>): boolean
    },
  ): U {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We know it is defined
    const circularTracker = CircularityTrackers.get(this)!

    if (options?.continue !== undefined && options.continue(path, this) === false) {
      return converter(input, path, this, context)
    }

    if (input instanceof Map) {
      if (circularTracker.has(input as object)) {
        throw new Error('Circular reference detected - convert does not support circular references')
      }

      const output = new Map()

      try {
        circularTracker.set(input, output)

        let modified = false

        for (const [entryKey, entryValue] of input) {
          const convertedKey = this.key.convert(entryKey, context, path, converter, options)
          const convertedValue = this.value.convert(entryValue, context, [...path, entryKey], converter, options)

          if (convertedKey !== entryKey || convertedValue !== entryValue) {
            modified = true
          }

          output.set(convertedKey, convertedValue)
        }

        return converter(modified ? output : input, path, this, context)
      } finally {
        circularTracker.delete(input)
      }
    }

    throw new Error('"input" is not a Map')
  }

  // eslint-disable-next-line functional/prefer-readonly-type -- Map is mutable
  override equals(other: unknown): other is Guard<Map<GuardType<Key>, GuardType<Value>>> {
    if (this === other) {
      return true
    }

    if (other instanceof MapGuard && this.key.equals(other.key) && this.value.equals(other.value)) {
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
    yield* this.key.inspect(path, inspecter)
    yield* this.value.inspect(path, inspecter)
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

    if (input instanceof Map) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We know it is defined
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

        for (const [entryKey, entryValue] of input) {
          this.key.scan(entryKey, context, path, scanner, options)
          this.value.scan(entryValue, context, [...path, entryKey], scanner, options)
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
    const keyReplacement = this.key.substitute(path, replacer)
    const valueReplacement = this.value.substitute(path, replacer)

    const replacement = (keyReplacement === this.key || this.key.equals(keyReplacement)) &&
        (valueReplacement === this.value || this.value.equals(valueReplacement))
      ? this
      : new MapGuard(keyReplacement, valueReplacement, this.settings)

    return replacer(path, replacement) as Guard<R>
  }

  override toString(): string {
    return `Map<${this.key.toString()}, ${this.value.toString()}>`
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

    const keyPath = `((${options.path}) extends Map<infer K, unknown> ? K : never)`
    const valuePath = `((${options.path}) extends Map<unknown, infer V> ? V : never)`

    const keyTypeScript = this.key.toTypeScript({ path: keyPath, circular: options.circular })
    const valueTypeScript = this.value.toTypeScript({ path: valuePath, circular: options.circular })

    return `Map<${keyTypeScript}, ${valueTypeScript}>`
  }

  override validate(
    input: unknown,
    path: ReadonlyArray<number | string | symbol>,
    // eslint-disable-next-line functional/prefer-readonly-type -- Internal API
    invalidations: Invalidation[],
    // eslint-disable-next-line functional/prefer-readonly-type -- Map is mutable
  ): input is Map<GuardType<Key>, GuardType<Value>> {
    if (instance(Map).validate(input, path, invalidations)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We know it is defined
      const circularTracker = CircularityTrackers.get(this)!

      if (circularTracker.has(input)) {
        return true
      }

      if (
        this.settings.size !== undefined &&
        this.settings.size.validate(input.size, [...path, 'size'], invalidations) === false
      ) {
        return false
      }

      try {
        circularTracker.set(input, undefined)

        if (
          this.settings.size !== undefined &&
          this.settings.size.validate(input.size, [...path, 'size'], invalidations) === false
        ) {
          return false
        }

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We know it is defined
        const checkKey = CheckKeyCache.get(this)!

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We know it is defined
        const checkValue = CheckValueCache.get(this)!

        let isValid = true

        if (checkKey && checkValue) {
          for (const [entryKey, entryValue] of input) {
            if (this.key.validate(entryKey, path, invalidations) === false) {
              isValid = false
            }

            if (
              this.value.validate(entryValue, [...path, entryKey as number | string | symbol], invalidations) === false
            ) {
              isValid = false
            }
          }
        } else if (checkKey && checkValue === false) {
          for (const entryKey of input.keys()) {
            if (this.key.validate(entryKey, path, invalidations) === false) {
              isValid = false
            }
          }
        } else if (checkKey === false && checkValue) {
          for (const [entryKey, entryValue] of input.entries()) {
            if (
              this.value.validate(entryValue, [...path, entryKey as number | string | symbol], invalidations) === false
            ) {
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
}
