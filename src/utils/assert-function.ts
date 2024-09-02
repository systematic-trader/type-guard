import { assert } from './assert.ts'
import { coerce } from './coerce.ts'
import { AssertionError, TupleGuard } from '../guards/index.ts'

import type { ArgumentType, Guard } from '../guards/index.ts'

export class FunctionAssertionError extends AssertionError {
  readonly functionName: string

  constructor(
    functionName: string,
    argsLength: number,
    invalidations: FunctionAssertionError['invalidations']
  ) {
    super(invalidations)

    // https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, FunctionAssertionError.prototype)

    const args = [...Array(argsLength).keys()]
      .map((index) => `arg${index}`)
      .join(', ')

    const index = this.message.slice(1, this.message.indexOf(']'))

    const prefix =
      functionName.length === 0
        ? `function (${args}) - arg${index}`
        : `function ${functionName}(${args}) - arg${index}`

    this.message = `${prefix}${this.message.slice(
      this.message.indexOf(']') + 1
    )}`

    this.functionName = functionName
  }
}

export type AssertFunction = <
  Args extends readonly unknown[],
  SomeFunction extends (...args: ArgumentType<Args>) => unknown,
  Name extends string = string
>(
  argumentsGuards: readonly [...{ readonly [K in keyof Args]: Guard<Args[K]> }],
  someFunction: SomeFunction,
  options?:
    | undefined
    | {
        readonly name?: undefined | Name
        readonly coercer?:
          | undefined
          | ((
              guard: Guard<unknown>,
              // deno-lint-ignore no-explicit-any
              path: readonly any[],
              value: unknown
            ) => unknown)
        readonly error?: undefined | Parameters<typeof assert>[2]
      }
) => SomeFunction & (string extends Name ? unknown : { readonly name: Name })

/**
 * Assert a functions arguments using type-guards
 * @param argumentsGuards guards for arguments
 * @param func the function that arguments are passed to
 * @param name override function name
 */
// deno-lint-ignore explicit-module-boundary-types
export const assertFunction: AssertFunction = (
  // deno-lint-ignore explicit-module-boundary-types
  argumentsGuards,
  // deno-lint-ignore explicit-module-boundary-types
  someFunction,
  // deno-lint-ignore explicit-module-boundary-types
  options
) => {
  const functionArgsGuard = new TupleGuard(argumentsGuards)

  const functionName = options?.name ?? someFunction.name

  let invalidationHandler = options?.error

  if (invalidationHandler === undefined) {
    invalidationHandler = (invalidation) =>
      new FunctionAssertionError(
        functionName,
        argumentsGuards.length,
        invalidation
      )
  }

  const coerceArgs = coerce(functionArgsGuard)

  const assertedFunction = {
    // deno-lint-ignore no-explicit-any
    [functionName](...args: any[]): any {
      const coercedArguments = coerceArgs(args)

      assert(functionArgsGuard, coercedArguments, invalidationHandler)

      // deno-lint-ignore no-explicit-any
      return someFunction(...(coercedArguments as any))
    },
  }[functionName]!

  // deno-lint-ignore no-explicit-any
  return assertedFunction as any
}

/**
 * Fake assert a functions arguments using type-guards to get correct types
 * @param argumentsGuards guards for arguments
 * @param someFunction the function that arguments are passed to
 * @param name override function name
 */
// deno-lint-ignore explicit-module-boundary-types
export const fakeAssertFunction: AssertFunction = (
  // deno-lint-ignore explicit-module-boundary-types
  _argumentsGuards,
  // deno-lint-ignore explicit-module-boundary-types
  someFunction,
  // deno-lint-ignore explicit-module-boundary-types
  options
) => {
  const functionName = options?.name ?? someFunction.name

  const assertedFunction = {
    // deno-lint-ignore no-explicit-any
    [functionName](...args: any): any {
      return someFunction(...args)
    },
  }[functionName]!

  // deno-lint-ignore no-explicit-any
  return assertedFunction as any
}
