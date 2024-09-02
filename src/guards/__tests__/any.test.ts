import { describe, it } from 'std/testing/bdd.ts'
import { expect } from 'std/expect/mod.ts'

import { any } from '../any.ts'
import { Guard } from '../guard.ts'
import { assertType } from '../helpers.ts'
import { unknown } from '../unknown.ts'

import type { Invalidation } from '../errors.ts'
import type { GuardType } from '../guard.ts'
import type { Equals } from '../helpers.ts'

describe('any', () => {
  describe('properties', () => {
    const guard = any()

    it('name', () => {
      expect(guard.name).toBe('type')
    })

    it('arguments', () => {
      expect(guard.arguments).toStrictEqual([['any']])
    })

    it('type', () => {
      expect(guard.type).toStrictEqual(['any'])
    })
  })

  it('accept', () => {
    const guard = any()
    const value: unknown = undefined

    expect(guard.accept(value)).toBe(true)

    // eslint-disable-next-line vitest/no-conditional-in-test -- Must be solved in a later refactoring
    if (guard.accept(value)) {
      assertType<Equals<GuardType<typeof guard>, typeof value>>(1)
    }
  })

  it('coerce', () => {
    const guard = any()

    expect(guard.coerce).toBe(Guard.prototype.coerce)
  })

  it('convert', () => {
    const guard = any()

    expect(guard.convert).toBe(Guard.prototype.convert)
  })

  it('exclude', () => {
    const guard = any()

    expect(guard.exclude).toBe(Guard.prototype.exclude)
  })

  it('extract', () => {
    const guard = any()

    expect(guard.extract).toBe(Guard.prototype.extract)
  })

  it('inspect', () => {
    const guard = any()

    expect(guard.inspect).toBe(Guard.prototype.inspect)
  })

  it('scan', () => {
    const guard = any()

    expect(guard.scan).toBe(Guard.prototype.scan)
  })

  it('substitute', () => {
    const guard = any()

    expect(guard.substitute).toBe(Guard.prototype.substitute)
  })

  it('validate', () => {
    const guard = any()

    const values = [
      1n,
      true,
      false,
      () => undefined,
      // eslint-disable-next-line unicorn/no-null -- Necessary for testing
      null,
      Number.MAX_VALUE,
      Number.MIN_VALUE,
      {},
      '',
      Symbol(''),
      undefined,
      Number.NaN,
    ]

    for (const value of values) {
      const invalidations: Invalidation[] = []
      const isValid = guard.validate(value, [], invalidations)
      expect(isValid).toBe(true)
      expect(invalidations).toStrictEqual([])
    }
  })

  describe('equals', () => {
    it('any(), any()', () => {
      const guard1 = any()
      const guard2 = any()

      expect(guard1.equals(guard2)).toBe(true)
      expect(guard2.equals(guard1)).toBe(true)
    })

    it('any(), unknown()', () => {
      const guard1 = any()
      const guard2 = unknown()

      expect(guard1.equals(guard2)).toBe(false)
      expect(guard2.equals(guard1)).toBe(false)
    })
  })
})
