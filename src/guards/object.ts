import { Guard } from './guard.ts'
import { type } from './type.ts'

import type { Invalidation } from './errors.ts'

// TODO Introduce a new guard to discrimination on literal properties - also for tuples - this will make invalidation more precise

const ObjectType = type('object')

type StrictProps = Record<number | string | symbol, Guard<unknown>>

export type MergeProps<LeftProps, RightProps> = {
  readonly [P in keyof LeftProps | keyof RightProps]: P extends keyof RightProps ? RightProps[P]
    : P extends keyof LeftProps ? LeftProps[P]
    : never
}

// deno-lint-ignore ban-types
export interface ObjectGuardSettings<Props extends StrictProps = {}> {
  /** Properties of key and guard defining the structure of input */
  readonly props: Props | (() => Props)
  /** Input is allowed additional keys */
  readonly extendable?: undefined | boolean
  /** Filter off additional keys when coercing */
  readonly mask?: undefined | boolean
}

/**
 * Construct a type-guard for an `object`
 * @param properties - Properties defining the structure of input
 */
export function props<Props extends StrictProps>(
  properties: Props | (() => Props),
  settings: Pick<ObjectGuardSettings, 'extendable' | 'mask'> = {},
): ObjectGuard<Props> {
  return object({ props: properties, extendable: settings.extendable, mask: settings.mask })
}

/**
 * Construct a type-guard for an `object`
 */
export function object<Props extends StrictProps>(options: ObjectGuardSettings<Props>): ObjectGuard<Props> {
  return new ObjectGuard<Props>(options)
}

const ObjectGuardSymbolsCache = new WeakMap<ObjectGuard<StrictProps>, undefined | readonly symbol[]>()

const CircularityTrackers = new WeakMap<ObjectGuard<StrictProps>, WeakMap<object, unknown>>()
const CoerceAvailableCache = new WeakMap<
  ObjectGuard<StrictProps>,
  undefined | Record<number | string | symbol, undefined | Guard<unknown>>
>()
const ToString = new WeakMap<ObjectGuard<StrictProps>, string>()

// deno-lint-ignore ban-types
export class ObjectGuard<Props extends StrictProps = {}> extends Guard<
  {
    readonly [P in keyof Props]: Props[P] extends { accept(input: unknown): input is infer U } ? U : never
  }
> {
  // eslint-disable-next-line functional/prefer-readonly-type -- it is cached
  #resolvedProps: undefined | Props = undefined

  readonly #settings: ObjectGuardSettings<Props>

  get extendable(): boolean {
    return this.#settings.extendable === true
  }

  get mask(): boolean {
    return this.#settings.mask === true
  }

  get props(): Props {
    if (this.#resolvedProps !== undefined) {
      return this.#resolvedProps
    }

    const resolvedProps: Props = typeof this.#settings.props === 'function'
      ? this.#settings.props()
      : this.#settings.props

    this.#resolvedProps = resolvedProps

    return this.#resolvedProps
  }

  constructor(settings: ObjectGuardSettings)
  // eslint-disable-next-line @typescript-eslint/unified-signatures -- Required for overload
  constructor(settings: ObjectGuardSettings<Props>)

  constructor(settings: ObjectGuardSettings<Props>) {
    super({
      name: 'object',

      type: ['object'],

      arguments: [settings],
    })

    this.#settings = settings

    CircularityTrackers.set(this, new WeakMap())
  }

  override accept(input: unknown): input is {
    readonly [P in keyof Props]: Props[P] extends { accept(input: unknown): input is infer U } ? U : never
  } {
    if (ObjectType.accept(input)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We know it's defined
      const circularTracker = CircularityTrackers.get(this)!

      if (circularTracker.has(input)) {
        return true
      }

      try {
        circularTracker.set(input, undefined)

        for (const propertyKey in this.props) {
          const propertyValue = input[propertyKey]
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We know it's defined
          const propertyGuard = this.props[propertyKey]!

          if (propertyGuard.accept(propertyValue) === false) {
            return false
          }
        }

        let propsSymbols = ObjectGuardSymbolsCache.get(this)

        if (propsSymbols === undefined && ObjectGuardSymbolsCache.has(this) === false) {
          const symbols = Object.getOwnPropertySymbols(this.props)

          propsSymbols = symbols.length === 0 ? undefined : symbols

          ObjectGuardSymbolsCache.set(this, propsSymbols)
        }

        if (propsSymbols !== undefined) {
          for (const propertySymbol of propsSymbols) {
            const propertyValue = input[propertySymbol]
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We know it's defined
            const propertyGuard = this.props[propertySymbol]!

            if (propertyGuard.accept(propertyValue) === false) {
              return false
            }
          }
        }

        if (this.extendable === true) {
          return true
        }

        for (const key in input) {
          if (key in this.props === false) {
            return false
          }
        }

        return true
      } finally {
        circularTracker.delete(input)
      }
    } else {
      return false
    }
  }

  override coerce(
    input: unknown,
    path: ReadonlyArray<number | string | symbol>,
  ): { readonly skipCoerce: boolean; readonly value: unknown } {
    let coercers = CoerceAvailableCache.get(this)

    if (coercers === undefined && CoerceAvailableCache.has(this)) {
      return {
        skipCoerce: true,
        value: input,
      }
    }

    if (coercers === undefined) {
      coercers = { ...this.props }

      for (const propertySymbol of Object.getOwnPropertySymbols(this.props)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We know it's defined
        coercers[propertySymbol] = this.props[propertySymbol]!
      }

      CoerceAvailableCache.set(this, coercers)
    }

    if (ObjectType.accept(input)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We know it's defined
      const circularTracker = CircularityTrackers.get(this)!

      const circularReference = circularTracker.get(input)

      if (circularReference !== undefined) {
        return {
          skipCoerce: false,
          value: circularReference,
        }
      }

      let skipCoerce = true

      const output: Record<string | symbol, unknown> = {}
      let modified = false

      try {
        circularTracker.set(input, output)

        for (const propertyKey in this.props) {
          const propertyGuard = coercers[propertyKey]

          if (propertyGuard === undefined) {
            output[propertyKey] = input[propertyKey]
          } else {
            const propertyValue = input[propertyKey]
            const coerceResult = propertyGuard.coerce(propertyValue, [...path, propertyKey])

            if (coerceResult.skipCoerce === false) {
              skipCoerce = false
            } else {
              Reflect.deleteProperty(coercers, propertyKey)
            }

            if (modified === false && coerceResult.value !== propertyValue) {
              modified = true
            }

            if (coerceResult.value === undefined && propertyKey in input === false) {
              continue
            } else {
              output[propertyKey] = coerceResult.value
            }
          }
        }

        let propsSymbols = ObjectGuardSymbolsCache.get(this)

        if (propsSymbols === undefined && ObjectGuardSymbolsCache.has(this) === false) {
          const symbols = Object.getOwnPropertySymbols(this.props)

          propsSymbols = symbols.length === 0 ? undefined : symbols

          ObjectGuardSymbolsCache.set(this, propsSymbols)
        }

        if (propsSymbols !== undefined) {
          for (const propertySymbol of propsSymbols) {
            const propertyGuard = coercers[propertySymbol]

            if (propertyGuard === undefined) {
              output[propertySymbol] = input[propertySymbol]
            } else {
              const propertyValue = input[propertySymbol]
              const coerceResult = propertyGuard.coerce(propertyValue, [...path, propertySymbol])

              if (coerceResult.skipCoerce === false) {
                skipCoerce = false
              } else {
                Reflect.deleteProperty(coercers, propertySymbol)
              }

              if (modified === false && coerceResult.value !== propertyValue) {
                modified = true
              }

              if (coerceResult.value === undefined && propertySymbol in input === false) {
                continue
              } else {
                output[propertySymbol] = coerceResult.value
              }
            }
          }
        }

        if (skipCoerce === true && this.mask !== true) {
          CoerceAvailableCache.set(this, undefined)
        }

        if (this.mask === true) {
          skipCoerce = false

          if (modified) {
            return {
              skipCoerce,
              value: output,
            }
          }

          for (const inputKey in input) {
            if (inputKey in this.props === false) {
              modified = true
              break
            }
          }

          return {
            skipCoerce,
            value: modified ? output : input,
          }
        }

        if (modified) {
          for (const inputKey in input) {
            if (inputKey in this.props === false) {
              output[inputKey] = input[inputKey]
            }
          }

          return {
            skipCoerce,
            value: output,
          }
        }

        return {
          skipCoerce,
          value: input,
        }
      } finally {
        circularTracker.delete(input)
      }
    } else {
      return {
        skipCoerce: CoerceAvailableCache.get(this) === undefined ? CoerceAvailableCache.has(this) : false,
        value: input,
      }
    }
  }

  override convert<U = unknown, C = unknown>(
    input: {
      readonly [P in keyof Props]: Props[P] extends { accept(input: unknown): input is infer X } ? X : never
    },
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

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We know it's defined
    const circularTracker = CircularityTrackers.get(this)!

    if (circularTracker.has(input)) {
      throw new Error('Circular reference detected - convert does not support circular references')
    }

    const output: Record<string | symbol, unknown> = {}
    let modified = false

    try {
      circularTracker.set(input, output)

      for (const propertyKey in this.props) {
        const inputValue = input[propertyKey]
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We know it's defined
        const propertyGuard = this.props[propertyKey]!

        const outputPropertyValue = propertyGuard.convert(
          inputValue,
          context,
          [...path, propertyKey],
          converter,
          options,
        )

        if (modified === false && outputPropertyValue !== inputValue) {
          modified = true
        }

        if (outputPropertyValue !== undefined || propertyKey in input) {
          output[propertyKey] = outputPropertyValue
        }
      }

      let propsSymbols = ObjectGuardSymbolsCache.get(this)

      if (propsSymbols === undefined && ObjectGuardSymbolsCache.has(this) === false) {
        const symbols = Object.getOwnPropertySymbols(this.props)

        propsSymbols = symbols.length === 0 ? undefined : symbols

        ObjectGuardSymbolsCache.set(this, propsSymbols)
      }

      if (propsSymbols !== undefined) {
        for (const propertySymbol of propsSymbols) {
          const inputValue = input[propertySymbol]
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We know it's defined
          const propertyGuard = this.props[propertySymbol]!

          const outputPropertyValue = propertyGuard.convert(
            inputValue,
            context,
            [...path, propertySymbol],
            converter,
            options,
          )

          if (modified === false && outputPropertyValue !== inputValue) {
            modified = true
          }

          if (outputPropertyValue !== undefined || propertySymbol in input) {
            output[propertySymbol] = outputPropertyValue
          }
        }
      }

      if (modified && this.mask !== true && this.extendable === true) {
        for (const inputKey in input) {
          if (inputKey in this.props === false) {
            output[inputKey] = input[inputKey]
          }
        }
      }

      return converter(modified ? output : input, path, this, context)
    } finally {
      circularTracker.delete(input)
    }
  }

  override equals(other: unknown): other is Guard<
    {
      readonly [P in keyof Props]: Props[P] extends { accept(input: unknown): input is infer U } ? U : never
    }
  > {
    if (this === other) {
      return true
    }

    if (
      other instanceof ObjectGuard &&
      (this.extendable === true) === (other.extendable === true) &&
      (this.mask === true) === (other.mask === true)
    ) {
      const propsEntries = Object.entries(this.props)

      if (propsEntries.length === Object.keys(other.props as object).length) {
        for (const [propertyKey, propertyGuard] of propsEntries) {
          if (propertyGuard.equals((other.props as Record<string, unknown>)[propertyKey]) === false) {
            return false
          }
        }

        return true
      }
    }

    return false
  }

  override *inspect<I = unknown>(
    path: ReadonlyArray<number | string | symbol>,
    inspecter: (path: ReadonlyArray<number | string | symbol>, guard: Guard<unknown>) => Iterable<I>,
  ): Iterable<I> {
    yield* inspecter(path, this)

    for (const propertyKey in this.props) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We know it's defined
      const propertyGuard = this.props[propertyKey]!
      const propertyPath = [...path, propertyKey]

      yield* propertyGuard.inspect(propertyPath, inspecter)
    }
  }

  merge<RightProps extends StrictProps>(
    guard: ObjectGuard<RightProps>,
    options?: {
      readonly extendable?: undefined | boolean
      readonly mask?: undefined | boolean
    },
  ): ObjectGuard<{ readonly [P in keyof MergeProps<Props, RightProps>]: MergeProps<Props, RightProps>[P] }>
  merge<RightProps extends StrictProps>(
    // eslint-disable-next-line @typescript-eslint/unified-signatures -- it is not the same signature
    properties: { readonly [K in keyof RightProps]: RightProps[K] },
    options?: {
      readonly extendable?: undefined | boolean
      readonly mask?: undefined | boolean
    },
  ): ObjectGuard<{ readonly [P in keyof MergeProps<Props, RightProps>]: MergeProps<Props, RightProps>[P] }>
  merge<RightProps extends StrictProps>(
    propsOrGuard: ObjectGuard<RightProps> | { readonly [K in keyof RightProps]: RightProps[K] },
    {
      extendable,
      mask,
    }: {
      readonly extendable?: undefined | boolean
      readonly mask?: undefined | boolean
    } = {},
  ): ObjectGuard<{ readonly [P in keyof MergeProps<Props, RightProps>]: MergeProps<Props, RightProps>[P] }> {
    const mergedProps = {
      ...this.props,
      ...(propsOrGuard instanceof ObjectGuard ? propsOrGuard.props : propsOrGuard),
    } as { [P in keyof MergeProps<Props, RightProps>]: Guard<MergeProps<Props, RightProps>[P]> }

    return new ObjectGuard({
      props: mergedProps,
      extendable: extendable ?? this.extendable,
      mask: mask ?? this.mask,
    })
  }

  omit<K extends keyof Props>(
    keys: readonly K[],
    { extendable, mask }: { readonly extendable?: undefined | boolean; readonly mask?: undefined | boolean } = {},
  ): ObjectGuard<{ readonly [P in Exclude<keyof Props, K>]: Props[P] }> {
    const pickedProps: Record<string, Guard<unknown>> = {}

    for (const key in this.props) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We know it's defined
      const propertyValue = this.props[key]!

      if (keys.includes(key as unknown as K) === false) {
        pickedProps[key] = propertyValue
      }
    }

    return new ObjectGuard<{ [P in Exclude<keyof Props, K>]: Props[P] }>({
      props: pickedProps,
      extendable: extendable ?? this.extendable,
      mask: mask ?? this.mask,
    })
  }

  pick<K extends keyof Props>(
    keys: readonly K[],
    { extendable, mask }: { readonly extendable?: undefined | boolean; readonly mask?: undefined | boolean } = {},
  ): ObjectGuard<{ readonly [P in K]: Props[P] }> {
    const pickedProps = {} as Record<K, Guard<unknown>>

    const resolvedProps = this.props

    for (const key of keys) {
      pickedProps[key] = resolvedProps[key]
    }

    return new ObjectGuard<{ [P in K]: Props[P] }>({
      props: pickedProps,
      extendable: extendable ?? this.extendable,
      mask: mask ?? this.mask,
    })
  }

  pluck<K extends keyof Props>(key: K): Props[K] {
    return this.props[key]
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

    if (input !== null && typeof input === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We know it's defined
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

        for (const propertyKey in this.props) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We know it's defined
          const propertyGuard = this.props[propertyKey]!
          const propertyValue = (input as Record<string, unknown>)[propertyKey]
          const propertyPath = [...path, propertyKey]

          propertyGuard.scan(propertyValue, context, propertyPath, scanner, options)
        }

        let propsSymbols = ObjectGuardSymbolsCache.get(this)

        if (propsSymbols === undefined && ObjectGuardSymbolsCache.has(this) === false) {
          const symbols = Object.getOwnPropertySymbols(this.props)

          propsSymbols = symbols.length === 0 ? undefined : symbols

          ObjectGuardSymbolsCache.set(this, propsSymbols)
        }

        if (propsSymbols !== undefined) {
          for (const propertySymbol of propsSymbols) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We know it's defined
            const propertyGuard = this.props[propertySymbol]!
            const propertyValue = (input as Record<symbol, unknown>)[propertySymbol]
            const propertyPath = [...path, propertySymbol]

            propertyGuard.scan(propertyValue, context, propertyPath, scanner, options)
          }
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

    const propsReplacement: Record<string, Guard<unknown>> = { ...this.props }

    for (const propertyKey in this.props) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We know it's defined
      const propertyGuard = this.props[propertyKey]!
      const propertyReplacement = replacer([...path, propertyKey], propertyGuard)

      if (propertyReplacement !== propertyGuard) {
        modified = true
      }

      propsReplacement[propertyKey] = propertyReplacement
    }

    const replacement = modified
      ? new ObjectGuard({ props: propsReplacement, extendable: this.extendable, mask: this.mask })
      : this

    return replacer(path, replacement) as Guard<R>
  }

  override toString(): string {
    const existing = ToString.get(this)

    if (existing !== undefined) {
      return existing
    }

    const propertiesAsTypeScript = Object.entries(this.props).map(([key, value]: [string, Guard<unknown>]) => {
      if (value.accept(undefined)) {
        return `readonly "${key.replaceAll('"', '\\"')}"?: ${value.toString()}`
      }

      return `readonly "${key.replaceAll('"', '\\"')}": ${value.toString()}`
    })

    const typescript = `{ ${propertiesAsTypeScript.join('; ')} }`

    ToString.set(this, typescript)

    return typescript
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

    const propertiesAsTypeScript = Object.entries(this.props).map(([key, value]: [string, Guard<unknown>]) => {
      const escapedKey = key.replaceAll('"', '\\"')
      const nextPath = `${path}["${escapedKey}"]`

      if (value.accept(undefined)) {
        return `readonly "${escapedKey}"?: ${value.toTypeScript({ path: nextPath, circular })}`
      }

      return `readonly "${escapedKey}": ${value.toTypeScript({ path: nextPath, circular })}`
    })

    if (interfaceName === undefined) {
      return `{ ${propertiesAsTypeScript.join('; ')} }`
    }

    return `interface ${interfaceName} { ${propertiesAsTypeScript.join('; ')} }`
  }

  override validate(
    input: unknown,
    path: ReadonlyArray<number | string | symbol>,
    // eslint-disable-next-line functional/prefer-readonly-type -- internal API
    invalidations: Invalidation[],
  ): input is {
    readonly [P in keyof Props]: Props[P] extends { accept(input: unknown): input is infer U } ? U : never
  } {
    if (ObjectType.validate(input, path, invalidations)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We know it's defined
      const circularTracker = CircularityTrackers.get(this)!

      if (circularTracker.has(input)) {
        return true
      }

      let isValid = true

      try {
        circularTracker.set(input, undefined)

        for (const propertyKey in this.props) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We know it's defined
          const propertyGuard = this.props[propertyKey]!
          const propertyValue = input[propertyKey]
          const propertyPath = [...path, propertyKey]

          if (propertyGuard.validate(propertyValue, propertyPath, invalidations) === false) {
            isValid = false
          }
        }

        let propsSymbols = ObjectGuardSymbolsCache.get(this)

        if (propsSymbols === undefined) {
          const symbols = Object.getOwnPropertySymbols(this.props)

          propsSymbols = symbols.length === 0 ? undefined : symbols

          ObjectGuardSymbolsCache.set(this, propsSymbols)
        }

        if (propsSymbols !== undefined) {
          for (const propertySymbol of propsSymbols) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We know it's defined
            const propertyGuard = this.props[propertySymbol]!
            const propertyValue = input[propertySymbol]
            const propertyPath = [...path, propertySymbol]

            if (propertyGuard.validate(propertyValue, propertyPath, invalidations) === false) {
              isValid = false
            }
          }
        }

        if (this.extendable === true) {
          return isValid
        }

        const unknownKeys: string[] = []

        for (const inputKey in input) {
          if (inputKey in this.props === false) {
            unknownKeys.push(inputKey)
          }
        }

        if (unknownKeys.length > 0) {
          invalidations.push({
            rule: 'logical',
            guard: 'object',
            path,
            function: 'extendable',
            setting: this.extendable,
            actual: unknownKeys.sort(),
          })

          isValid = false
        }
      } finally {
        circularTracker.delete(input)
      }

      return isValid
    }

    return false
  }
}
