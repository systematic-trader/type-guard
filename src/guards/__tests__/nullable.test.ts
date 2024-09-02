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

describe('nullable', () => {
  const booleanGuard = boolean()
  const guard = nullable(booleanGuard)
  const nullUnionGuard = union([type(['null']), booleanGuard])

  // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
  it('typescript', () => {
    assertType<Equals<GuardType<typeof guard>, null | boolean>>(1)
  })

  it('nullable is a union', () => {
    expect(guard).toStrictEqual(nullUnionGuard)
  })

  it('should return guard when fed utself and inner guard is not a simple type', () => {
    const numberGuard = number({ round: true })
    const firstNullable = nullable(numberGuard)
    const secondNullable = nullable(firstNullable)
    expect(secondNullable).toBe(firstNullable)
  })

  it('nullable caches non-simple type guards', () => {
    const numberGuard = number({ round: true })
    const firstNullable = nullable(numberGuard)
    const secondNullable = nullable(numberGuard)
    expect(secondNullable).toBe(firstNullable)
  })

  describe('equals', () => {
    it('nullable(string()), nullable(string())', () => {
      const guard1 = nullable(string())
      const guard2 = nullable(string())

      expect(guard1.equals(guard2)).toBe(true)
      expect(guard2.equals(guard1)).toBe(true)
    })

    it('nullable(string({ blank: false })), nullable(string({ blank: false }))', () => {
      const guard1 = nullable(string({ blank: false }))
      const guard2 = nullable(string({ blank: false }))

      expect(guard1.equals(guard2)).toBe(true)
      expect(guard2.equals(guard1)).toBe(true)
    })

    it('nullable(string()), nullable(number())', () => {
      const guard1 = nullable(string())
      const guard2 = nullable(number())

      expect(guard1.equals(guard2)).toBe(false)
      expect(guard2.equals(guard1)).toBe(false)
    })

    it('nullable(string()), optional(string())', () => {
      const guard1 = nullable(string())
      const guard2 = optional(string())

      expect(guard1.equals(guard2)).toBe(false)
      expect(guard2.equals(guard1)).toBe(false)
    })
  })
})
