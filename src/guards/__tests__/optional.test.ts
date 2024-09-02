import { describe, it } from 'std/testing/bdd.ts'
import { expect } from 'std/expect/mod.ts'

import { boolean } from '../boolean.ts'
import { assertType } from '../helpers.ts'
import { nullable } from '../nullable.ts'
import { number } from '../number.ts'
import { optional } from '../optional.ts'
import { string } from '../string.ts'
import { type } from '../type.ts'
import { union } from '../union.ts'

import type { GuardType } from '../guard.ts'
import type { Equals } from '../helpers.ts'

describe('optional', () => {
  // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
  it('typescript', () => {
    const booleanGuard = boolean()
    const guard = optional(booleanGuard)
    assertType<Equals<GuardType<typeof guard>, undefined | boolean>>(1)
  })

  it('optional is a union', () => {
    const booleanGuard = boolean()
    const guard = optional(booleanGuard)
    const undefinedUnionGuard = union([type(['undefined']), booleanGuard])
    expect(guard).toStrictEqual(undefinedUnionGuard)
  })

  it('feeding non simple optional guard to another returns first', () => {
    const numberGuard = number({ round: true })
    const guard = optional(numberGuard)
    const optionalGuard = optional(guard)
    expect(optionalGuard).toBe(guard)
  })

  it('optional caches non simple guards', () => {
    const numberGuard = number({ round: true })
    const guard = optional(numberGuard)
    const booleanOptionalGuard = optional(numberGuard)
    expect(booleanOptionalGuard).toBe(guard)
  })

  describe('equals', () => {
    it('optional(string()), optional(string())', () => {
      const guard1 = optional(string())
      const guard2 = optional(string())

      expect(guard1.equals(guard2)).toBe(true)
      expect(guard2.equals(guard1)).toBe(true)
    })

    it('optional(string({ blank: false })), optional(string({ blank: false }))', () => {
      const guard1 = optional(string({ blank: false }))
      const guard2 = optional(string({ blank: false }))

      expect(guard1.equals(guard2)).toBe(true)
      expect(guard2.equals(guard1)).toBe(true)
    })

    it('optional(string()), optional(number())', () => {
      const guard1 = optional(string())
      const guard2 = optional(number())

      expect(guard1.equals(guard2)).toBe(false)
      expect(guard2.equals(guard1)).toBe(false)
    })

    it('optional(string()), nullable(string())', () => {
      const guard1 = optional(string())
      const guard2 = nullable(string())

      expect(guard1.equals(guard2)).toBe(false)
      expect(guard2.equals(guard1)).toBe(false)
    })
  })
})
