export * from './any.ts'
export * from './array.ts'
export * from './bigint.ts'
export * from './boolean.ts'
export * from './constructor.ts'
export * from './defaulted.ts'
export * from './enums.ts'
export * from './guard.ts'
export * from './instance.ts'
export * from './integer.ts'
export * from './errors.ts'
export * from './iterable.ts'
export * from './literal.ts'
export * from './map.ts'
export * from './model.ts'
export * from './never.ts'
export * from './nullable.ts'
export * from './number.ts'
export * from './object.ts'
export * from './optional.ts'
export * from './record.ts'
export * from './required.ts'
export * from './set.ts'
export * from './string.ts'
export * from './symbol.ts'
export * from './tuple.ts'
export * from './type.ts'
export * from './union.ts'
export * from './unknown.ts'

type UndefinedKeys<T> = {
  readonly [K in keyof T]-?: undefined extends T[K] ? K : never
}[keyof T]

type ArgumentObjectType<T> = T extends object ?
    & {
      readonly [K in Exclude<keyof T, UndefinedKeys<T>>]: T[K]
    }
    & {
      readonly [K in UndefinedKeys<T>]?: T[K]
    }
  : never

type TuplePartialLastArgument<T> = T extends readonly [unknown]
  ? readonly [undefined] extends readonly [T[0]] ? readonly [T[0]?]
  : T
  : T extends readonly [...infer Firsts, infer Last]
    ? readonly [undefined] extends readonly [Last] ? readonly [...TuplePartialLastArgument<Firsts>, Last?]
    : readonly [...Firsts, Last]
  : T

type ArgumentArrayType<T> = T extends readonly [] ? readonly []
  : T extends readonly [unknown, ...infer Rest]
    ? TuplePartialLastArgument<readonly [ArgumentType<T[0]>, ...ArgumentArrayType<Rest>]>
  : T extends readonly unknown[] ? ReadonlyArray<ArgumentType<T[number]>>
  : never

/**
 * Deep map of T to a type that has partial properties when `undefined` assignable to the value of the property.
 */
export type ArgumentType<T> = T extends
  | null
  | undefined
  | bigint
  | boolean
  | number
  | string
  | symbol
  // deno-lint-ignore no-explicit-any
  | ((...args: readonly any[]) => any) ? T
  : T extends readonly unknown[] ? ArgumentArrayType<T>
  : T extends ReadonlyMap<infer K, infer V> ? ReadonlyMap<ArgumentType<K>, ArgumentType<V>>
  : T extends ReadonlySet<infer I> ? ReadonlySet<ArgumentType<I>>
  : T extends object ? { readonly [P in keyof ArgumentObjectType<T>]: ArgumentType<ArgumentObjectType<T>[P]> }
  : T
