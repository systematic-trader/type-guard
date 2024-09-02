import { describe, it } from 'std/testing/bdd.ts'
import { expect } from 'std/expect/mod.ts'

import { any } from '../any.ts'
import { Guard } from '../guard.ts'
import { assertType } from '../helpers.ts'
import { never } from '../never.ts'

import type { Invalidation } from '../errors.ts'
import type { GuardType } from '../guard.ts'
import type { Equals } from '../helpers.ts'

describe('never', () => {
  // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
  it('typescript', () => {
    const guard = never()

    assertType<Equals<GuardType<typeof guard>, never>>(1)
  })

  describe('properties', () => {
    const guard = never()

    it('name', () => {
      expect(guard.name).toBe('type')
    })

    it('arguments', () => {
      expect(guard.arguments).toStrictEqual([['never']])
    })

    it('type', () => {
      expect(guard.type).toStrictEqual(['never'])
    })
  })

  it('accept', () => {
    const guard = never()
    const value: unknown = undefined

    expect(guard.accept(value)).toBe(false)

    // eslint-disable-next-line vitest/no-conditional-in-test -- TypeScript checking
    if (guard.accept(value)) {
      assertType<Equals<GuardType<typeof guard>, typeof value>>(1)
    }
  })

  it('validate', () => {
    const guard = never()

    const values = [
      // 1n,
      true,
      false,
      () => undefined,
      // eslint-disable-next-line unicorn/no-null -- Testing
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
      expect(isValid).toBe(false)
      expect(invalidations).toStrictEqual([
        { rule: 'type', path: [], setting: ['never'], actual: Guard.getType(value) },
      ])
    }
  })

  it('coerce', () => {
    const guard = never()

    expect(guard.coerce).toBe(Guard.prototype.coerce)
  })

  it('convert', () => {
    const guard = never()

    expect(guard.convert).toBe(Guard.prototype.convert)
  })

  it('exclude', () => {
    const guard = never()

    expect(guard.exclude).toBe(Guard.prototype.exclude)
  })

  it('extract', () => {
    const guard = never()

    expect(guard.extract).toBe(Guard.prototype.extract)
  })

  it('inspect', () => {
    const guard = never()

    expect(guard.inspect).toBe(Guard.prototype.inspect)
  })

  it('scan', () => {
    const guard = never()

    expect(guard.scan).toBe(Guard.prototype.scan)
  })

  it('substitute', () => {
    const guard = never()

    expect(guard.substitute).toBe(Guard.prototype.substitute)
  })

  describe('equals', () => {
    it('never(), never()', () => {
      const guard1 = never()
      const guard2 = never()

      expect(guard1.equals(guard2)).toBe(true)
      expect(guard2.equals(guard1)).toBe(true)
    })

    it('never(), any()', () => {
      const guard1 = never()
      const guard2 = any()

      expect(guard1.equals(guard2)).toBe(false)
      expect(guard2.equals(guard1)).toBe(false)
    })
  })
})
