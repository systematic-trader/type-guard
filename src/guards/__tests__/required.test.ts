import { describe, it } from 'std/testing/bdd.ts'
import { expect } from 'std/expect/mod.ts'

import { boolean } from '../boolean.ts'
import { assertType } from '../helpers.ts'
import { literal } from '../literal.ts'
import { nullable } from '../nullable.ts'
import { number } from '../number.ts'
import { props } from '../object.ts'
import { optional } from '../optional.ts'
import { required } from '../required.ts'
import { string } from '../string.ts'
import { type } from '../type.ts'
import { union } from '../union.ts'

import type { GuardType } from '../guard.ts'
import type { Equals } from '../helpers.ts'

describe('required', () => {
  // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
  it('typescript', () => {
    const booleanGuard = optional(boolean())
    const guard = required(booleanGuard)
    assertType<Equals<GuardType<typeof guard>, boolean>>(1)
  })

  it('required of union is a union', () => {
    // eslint-disable-next-line unicorn/no-null -- for testing
    const unionGuard = union([literal(undefined), literal(null), number()])
    const guard = required(unionGuard)
    const requiredUnionGuard = union([type(['number'])])
    expect(guard).toStrictEqual(requiredUnionGuard)
  })

  it('filters undefined types', () => {
    const unionGuard = optional(number())
    const guard = required(unionGuard)
    const requiredUnionGuard = union([type(['number'])])
    expect(guard).toStrictEqual(requiredUnionGuard)
  })

  it('filters null types', () => {
    const unionGuard = nullable(number())
    const guard = required(unionGuard)
    const requiredUnionGuard = union([type(['number'])])
    expect(guard).toStrictEqual(requiredUnionGuard)
  })

  it('filters null and undefined types', () => {
    const unionGuard = optional(nullable(number()))
    const guard = required(unionGuard)
    const requiredUnionGuard = union([type(['number'])])
    expect(guard).toStrictEqual(requiredUnionGuard)
  })

  it('caches non-simple guards', () => {
    const numberGuard = number({ round: true })
    const guard = required(numberGuard)
    const requiredGuard = required(numberGuard)
    expect(requiredGuard).toBe(guard)
  })

  describe('equals', () => {
    it('required(string()), required(string())', () => {
      const guard1 = required(string())
      const guard2 = required(string())

      expect(guard1.equals(guard2)).toBe(true)
      expect(guard2.equals(guard1)).toBe(true)
    })

    it('required(string()), string()', () => {
      const guard1 = required(string())
      const guard2 = string()

      expect(guard1.equals(guard2)).toBe(true)
      expect(guard2.equals(guard1)).toBe(true)
    })

    it('required(props({})), props({})', () => {
      const guard1 = required(props({}))
      const guard2 = props({})

      expect(guard1.equals(guard2)).toBe(true)
      expect(guard2.equals(guard1)).toBe(true)
    })

    it('required(string({ blank: false })), required(string({ blank: false }))', () => {
      const guard1 = required(string({ blank: false }))
      const guard2 = required(string({ blank: false }))

      expect(guard1.equals(guard2)).toBe(true)
      expect(guard2.equals(guard1)).toBe(true)
    })

    it('required(string()), required(number())', () => {
      const guard1 = required(string())
      const guard2 = required(number())

      expect(guard1.equals(guard2)).toBe(false)
      expect(guard2.equals(guard1)).toBe(false)
    })
  })
})
