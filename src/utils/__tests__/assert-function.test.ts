import { describe, it } from 'std/testing/bdd.ts'
import { expect } from 'std/expect/mod.ts'

import {
  array,
  enums,
  optional,
  props,
  string,
  tuple,
  union,
} from '../../guards/index.ts'
import { assertFunction, FunctionAssertionError } from '../assert-function.ts'
import { validate } from '../validate.ts'

const GRADIENT = props({
  function: enums([
    'linear-gradient',
    'radial-gradient',
    'conic-gradient',
    'repeating-linear-gradient',
    'repeating-radial-gradient',
  ]),
  args: string(),
})

export const Gradient = union([
  GRADIENT,
  array(GRADIENT, { length: { minimum: 1 } }),
])

export const Background = union([
  props({
    color: string(),
  }),
  Gradient,
])

const TUPLE_ARGS = [optional(Background)] as const

const FUNCTION_NAME = 'background'

const aFunction = assertFunction(TUPLE_ARGS, (background) => background, {
  name: FUNCTION_NAME,
})

describe('assertFunction', () => {
  it('function.name', () => {
    expect(aFunction.name).toStrictEqual(FUNCTION_NAME)

    const testArgument = { color: 'cyan' }

    const result = aFunction(testArgument)

    expect(result).toStrictEqual({ color: 'cyan' })
  })

  it('successful invocation', () => {
    const testArgument = { color: 'cyan' }

    const result = aFunction(testArgument)

    expect(result).toStrictEqual({ color: 'cyan' })
  })

  it('unsuccessful invocation', () => {
    const testArgument = { color: 1 } as never

    const invalidations = validate(tuple(TUPLE_ARGS))([testArgument])

    expect(() => aFunction(testArgument)).toThrow(
      new FunctionAssertionError(aFunction.name, 1, invalidations)
    )
    expect(() => aFunction(testArgument)).toThrow(
      'function background(arg0) - arg0["color"] - expected "type" to be "string", but received "number"'
    )
  })
})
