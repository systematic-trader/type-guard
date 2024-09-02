import { describe, it } from 'std/testing/bdd.ts'
import { expect } from 'std/expect/mod.ts'

import { any } from '../any.ts'
import { Guard } from '../guard.ts'
import { assertType } from '../helpers.ts'
import { unknown } from '../unknown.ts'

import type { Invalidation } from '../errors.ts'
import type { GuardType } from '../guard.ts'
import type { Equals } from '../helpers.ts'

describe('unknown', () => {
  // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
  it('typescript', () => {
    const guard = unknown()
    assertType<Equals<GuardType<typeof guard>, unknown>>(1)
  })

  describe('properties', () => {
    const guard = unknown()

    it('name', () => {
      expect(guard.name).toBe('type')
    })

    it('arguments', () => {
      expect(guard.arguments).toStrictEqual([['unknown']])
    })

    it('type', () => {
      expect(guard.type).toStrictEqual(['unknown'])
    })
  })

  it('accept', () => {
    const guard = unknown()
    const value: unknown = undefined

    expect(guard.accept(value)).toBe(true)

    // eslint-disable-next-line vitest/no-conditional-in-test -- TypeScript checking
    if (guard.accept(value)) {
      assertType<Equals<GuardType<typeof guard>, typeof value>>(1)
    }
  })

  it('coerce', () => {
    const guard = unknown()

    expect(guard.coerce).toBe(Guard.prototype.coerce)
  })

  it('convert', () => {
    const guard = unknown()

    expect(guard.convert).toBe(Guard.prototype.convert)
  })

  it('exclude', () => {
    const guard = unknown()

    expect(guard.exclude).toBe(Guard.prototype.exclude)
  })

  it('extract', () => {
    const guard = unknown()

    expect(guard.extract).toBe(Guard.prototype.extract)
  })

  it('inspect', () => {
    const guard = unknown()

    expect(guard.inspect).toBe(Guard.prototype.inspect)
  })

  it('scan', () => {
    const guard = unknown()

    expect(guard.scan).toBe(Guard.prototype.scan)
  })

  it('substitute', () => {
    const guard = unknown()

    expect(guard.substitute).toBe(Guard.prototype.substitute)
  })

  it('validate', () => {
    const guard = unknown()

    const values = [
      1n,
      true,
      false,
      () => undefined,
      undefined,
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
    it('unknown(), unknown()', () => {
      const guard1 = unknown()
      const guard2 = unknown()

      expect(guard1.equals(guard2)).toBe(true)
      expect(guard2.equals(guard1)).toBe(true)
    })

    it('unknown(), any()', () => {
      const guard1 = unknown()
      const guard2 = any()

      expect(guard1.equals(guard2)).toBe(false)
      expect(guard2.equals(guard1)).toBe(false)
    })
  })
})
