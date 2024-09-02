import equal from 'npm:fast-deep-equal@3.1.3'
import { Guard } from './guard.ts'
import { instance } from './instance.ts'
import { literal } from './literal.ts'
import { number } from './number.ts'

import type { Invalidation } from './errors.ts'
import type { GuardType } from './guard.ts'
import type { NumberGuardSettings } from './number.ts'

export interface ArrayGuardSettings {
  /** enforce specific length */
  readonly length?: undefined | number | Guard<number> | NumberGuardSettings
  /** enforce that items are unique (using `fast-deep-equal`) */
  readonly unique?: undefined | boolean
}

const GUARDS = new WeakMap<Guard<unknown>, ArrayGuard<Guard<unknown>>>()

/**
 * Contructs a type-guard for an `array` type
 * @param items - type-guard for items
 * @param settings - settings for the array
 */
export const array = <Items extends Guard<unknown>>(
  items: Items,
  settings?: ArrayGuardSettings
): ArrayGuard<Items> => {
  if (
    settings === undefined ||
    Object.values(settings).every((setting) => setting === undefined)
  ) {
    const existing = GUARDS.get(items)

    if (existing !== undefined) {
      return existing as ArrayGuard<Items>
    }
  }

  return new ArrayGuard(items, settings)
}

const CircularityTrackers = new WeakMap<object, WeakMap<object, unknown>>()

const ACCEPTS = new WeakMap<object, Guard<readonly unknown[]>['accept']>()
const COERCERS = new WeakMap<object, Guard<readonly unknown[]>['coerce']>()
const VALIDATES = new WeakMap<object, Guard<readonly unknown[]>['validate']>()

export class ArrayGuard<Items extends Guard<unknown>> extends Guard<
  ReadonlyArray<GuardType<Items>>
> {
  readonly items: Items

  readonly settings: {
    readonly length?: Guard<number>
    readonly unique?: boolean
  }

  constructor(items: Items, settings: ArrayGuardSettings = {}) {
    const emptySettings = Object.values(settings).every(
      (setting) => setting === undefined
    )

    super({
      name: 'array',

      type: ['object'],

      arguments: [items, settings],
    })

    this.items = items

    const sanitizedSettings: {
      length?: Guard<number>
      unique?: boolean
    } = {}

    if (settings.length !== undefined) {
      const length =
        typeof settings.length === 'number'
          ? literal(settings.length)
          : settings.length instanceof Guard
          ? settings.length
          : number(settings.length)

      sanitizedSettings.length = length
    }

    if (settings.unique !== undefined) {
      sanitizedSettings.unique = settings.unique
    }

    this.settings = sanitizedSettings

    const circularTracker = new WeakMap()

    CircularityTrackers.set(this, circularTracker)

    ACCEPTS.set(
      this,
      createAcceptMethod(items, sanitizedSettings, circularTracker)
    )
    COERCERS.set(
      this,
      createCoerceMethod(items, sanitizedSettings, circularTracker)
    )
    VALIDATES.set(
      this,
      createValidateMethod(items, sanitizedSettings, circularTracker)
    )

    if (this.constructor === ArrayGuard && emptySettings === true) {
      GUARDS.set(items, this)
    }
  }

  override accept(input: unknown): input is ReadonlyArray<GuardType<Items>> {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Allowed because we know that the value is set
    const isAccepted = ACCEPTS.get(this)!

    return isAccepted(input)
  }

  override coerce(
    input: unknown,
    path: ReadonlyArray<number | string | symbol>
  ): { readonly skipCoerce: boolean; readonly value: unknown } {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Allowed because we know that the value is set
    const coercer = COERCERS.get(this)!

    return coercer(input, path)
  }

  override convert<U = unknown, C = unknown>(
    input: ReadonlyArray<GuardType<Items>>,
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
      options.continue(path, this) === false
    ) {
      return converter(input, path, this, context)
    }

    const output: unknown[] = []
    let modified = false

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Allowed because we know that the value is set
    const circularTracker = CircularityTrackers.get(this)!

    if (circularTracker.has(input)) {
      throw new Error(
        'Circular reference detected - convert does not support circular references'
      )
    }

    try {
      circularTracker.set(input, output)

      for (const [index, item] of input.entries()) {
        const convertedItem = this.items.convert(
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
      }

      return converter(modified ? output : input, path, this, context)
    } finally {
      circularTracker.delete(input)
    }
  }

  override equals(
    other: unknown
  ): other is Guard<ReadonlyArray<GuardType<Items>>> {
    if (this === other) {
      return true
    }

    if (other instanceof ArrayGuard && other.constructor === ArrayGuard) {
      const unique = (this.arguments[1] as ArrayGuardSettings).unique === true
      const otherUnique =
        (other.arguments[1] as ArrayGuardSettings).unique === true
      const length = (this.arguments[1] as ArrayGuardSettings).length as
        | undefined
        | Guard<number>
      const otherLength = (other.arguments[1] as ArrayGuardSettings).length as
        | undefined
        | Guard<number>

      if (
        unique === otherUnique &&
        ((length === undefined && otherLength === undefined) ||
          (length !== undefined &&
            otherLength !== undefined &&
            length.equals(otherLength)))
      ) {
        return this.items.equals(other.items)
      }
    }

    return false
  }

  override *inspect<I = unknown>(
    path: ReadonlyArray<number | string | symbol>,
    inspecter: (
      path: ReadonlyArray<number | string | symbol>,
      guard: Guard<unknown>
    ) => Iterable<I>
  ): Iterable<I> {
    yield* inspecter(path, this)
    yield* this.items.inspect(path, inspecter)
  }

  override scan<C = unknown>(
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
    if (typeof input === 'object' && input !== null && Array.isArray(input)) {
      if (
        options?.continue !== undefined &&
        options.continue(path, this) === false
      ) {
        scanner(input, path, this, context)
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Allowed because we know that the value is set
      const circularTracker = CircularityTrackers.get(this)!

      if (circularTracker.get(input) !== undefined) {
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
    replacer: (
      path: ReadonlyArray<number | string | symbol>,
      guard: Guard<unknown>
    ) => Guard<unknown>
  ): Guard<R> {
    const itemsReplacement = this.items.substitute(path, replacer)

    const replacement =
      this.items === itemsReplacement
        ? this
        : new ArrayGuard(
            itemsReplacement,
            this.arguments[1] as ArrayGuardSettings
          )

    return replacer(path, replacement) as Guard<R>
  }

  override toString(): string {
    return `ReadonlyArray<${this.items.toString()}>`
  }

  override toTypeScript({
    interfaceName,
    path = interfaceName,
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

    const itemsAsTypeScript = this.items.toTypeScript({
      path: `${path}[number]`,
      circular,
    })

    if (interfaceName === undefined) {
      return `ReadonlyArray<${itemsAsTypeScript}>`
    }

    return `interface ${interfaceName} extends ReadonlyArray<${itemsAsTypeScript}> {}`
  }

  override validate(
    input: unknown,
    path: ReadonlyArray<number | string | symbol>,
    // eslint-disable-next-line functional/prefer-readonly-type -- internal API
    invalidations: Invalidation[]
  ): input is ReadonlyArray<GuardType<Items>> {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Allowed because we know that the value is set
    const validator = VALIDATES.get(this)!

    return validator(input, path, invalidations)
  }
}

const createAcceptMethod = <T>(
  items: Guard<T>,
  settings: ArrayGuardSettings,
  circularTracker: WeakMap<object, unknown>
): Guard<readonly T[]>['accept'] => {
  const { unique } = settings

  const length =
    settings.length === undefined
      ? undefined
      : typeof settings.length === 'number'
      ? literal(settings.length)
      : settings.length instanceof Guard
      ? settings.length
      : number(settings.length)

  let isArray = (input: unknown): input is readonly unknown[] =>
    Array.isArray(input)

  if (length !== undefined) {
    const previous = isArray

    isArray = (input: unknown): input is readonly unknown[] => {
      if (previous(input)) {
        return length.accept(input.length)
      }

      return false
    }
  }

  const previousIsArray = isArray

  isArray = (input: unknown): input is readonly T[] => {
    if (previousIsArray(input)) {
      try {
        if (circularTracker.has(input)) {
          return true
        }

        circularTracker.set(input, undefined)

        return input.some((item) => items.accept(item) === false) === false
      } finally {
        circularTracker.delete(input)
      }
    }

    return false
  }

  if (unique === true) {
    const previous = isArray

    isArray = (input: unknown): input is readonly T[] => {
      if (previous(input)) {
        for (let index = 0; index < input.length; index++) {
          for (
            let otherIndex = index + 1;
            otherIndex < input.length;
            otherIndex++
          ) {
            if (equal(input[index], input[otherIndex])) {
              return false
            }
          }
        }

        return true
      }

      return false
    }
  }

  return isArray as Guard<readonly T[]>['accept']
}

const createCoerceMethod = <T>(
  items: Guard<T>,
  settings: ArrayGuardSettings,
  circularTracker: WeakMap<object, unknown>
): Guard<readonly T[]>['coerce'] => {
  const { unique } = settings

  let skipCoerce = false

  let coerce: Guard<readonly T[]>['coerce'] = (input, path) => {
    if (skipCoerce === true) {
      return {
        skipCoerce,
        value: input,
      }
    }

    if (Array.isArray(input)) {
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

        for (const [index, item] of input.entries()) {
          if (skipCoerce === true) {
            output.push(item)
          } else {
            const coercedItem = items.coerce(item, [...path, index])

            if (coercedItem.skipCoerce === true) {
              skipCoerce = true
            }

            if (modified === false && item !== coercedItem.value) {
              modified = true
            }

            output.push(coercedItem.value)
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

  if (unique === true) {
    const previous = coerce

    coerce = (input, path) => {
      const result = previous(input, path)
      const output = result.value

      if (Array.isArray(output)) {
        const clone = [...(output as unknown[])]

        output.length = 0

        for (const [index, item] of clone.entries()) {
          const firstIndex = clone.findIndex((otherItem) =>
            equal(otherItem, item)
          )

          if (firstIndex === index) {
            output.push(item)
          }
        }
      }

      return {
        skipCoerce: false,
        value: output,
      }
    }
  }

  return coerce
}

const createValidateMethod = <T>(
  items: Guard<T>,
  settings: ArrayGuardSettings,
  circularTracker: WeakMap<object, unknown>
): Guard<readonly T[]>['validate'] => {
  const { unique } = settings

  const length =
    settings.length === undefined
      ? undefined
      : typeof settings.length === 'number'
      ? literal(settings.length)
      : settings.length instanceof Guard
      ? settings.length
      : number(settings.length)

  const validate = (
    input: readonly unknown[],
    path: ReadonlyArray<number | string | symbol>,
    invalidations: Invalidation[]
  ): input is readonly T[] => {
    if (
      length !== undefined &&
      length.validate(input.length, [...path, 'length'], invalidations) ===
        false
    ) {
      return false
    }

    if (unique === true) {
      const nonUniqueIndexes: number[] = []

      for (const [index, currentItem] of input.entries()) {
        const firstIndex = input.findIndex((item) => equal(item, currentItem))

        if (firstIndex !== index) {
          nonUniqueIndexes.push(index)
        }
      }

      if (nonUniqueIndexes.length > 0) {
        invalidations.push({
          guard: 'array',
          rule: 'logical',
          path,
          function: 'unique',
          setting: undefined,
          actual: nonUniqueIndexes,
        })

        return false
      }
    }

    let isItemsValid = true

    if (circularTracker.has(input)) {
      return true
    }

    try {
      circularTracker.set(input, undefined)

      for (const [index, item] of input.entries()) {
        isItemsValid = items.validate(item, [...path, index], invalidations)
      }
    } finally {
      circularTracker.delete(input)
    }

    return isItemsValid
  }

  const arrayGuard = instance(Array)

  return (input, path, invalidations): input is readonly T[] =>
    arrayGuard.validate(input, path, invalidations)
      ? validate(input as readonly unknown[], path, invalidations)
      : false
}
