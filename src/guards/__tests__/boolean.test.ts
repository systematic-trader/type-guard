import { describe, it } from 'std/testing/bdd.ts'
import { expect } from 'std/expect/mod.ts'

import { boolean } from '../boolean.ts'
import { Guard } from '../guard.ts'
import { assertType } from '../helpers.ts'
import { literal } from '../literal.ts'
import { union } from '../union.ts'

import type { Invalidation } from '../errors.ts'
import type { GuardType } from '../guard.ts'
import type { Equals } from '../helpers.ts'

describe('boolean', () => {
  // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
  it('typescript', () => {
    const guard = boolean()

    assertType<Equals<GuardType<typeof guard>, boolean>>(1)
  })

  describe('properties', () => {
    const guard = boolean()

    it('name', () => {
      expect(guard.name).toBe('type')
    })

    it('arguments', () => {
      expect(guard.arguments).toStrictEqual([['boolean']])
    })

    it('type', () => {
      expect(guard.type).toStrictEqual(['boolean'])
    })
  })

  describe('accept', () => {
    const guard = boolean()

    // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
    it('type guarding', () => {
      const value: unknown = true

      // eslint-disable-next-line vitest/no-conditional-in-test -- TypeScript checking
      if (guard.accept(value)) {
        assertType<Equals<GuardType<typeof guard>, typeof value>>(1)
      }
    })

    const tests = {
      boolean: { value: true, accepts: true },
      string: { value: 'abc', accepts: false },
      number: { value: 1, accepts: false },
      bigint: { value: 1n, accepts: false },
      // eslint-disable-next-line unicorn/no-null -- Testing
      null: { value: null, accepts: false },
      undefined: { value: undefined, accepts: false },
      symbol: { value: Symbol(''), accepts: false },
    }

    for (const [name, data] of Object.entries(tests)) {
      it(`accept ${name}`, () => {
        expect(guard.accept(data.value)).toBe(data.accepts)
      })
    }
  })

  describe('validate', () => {
    const guard = boolean()
    const defaultInvalidation = { rule: 'type', path: [], setting: ['boolean'] }
    const tests = {
      boolean: { value: true, invalidations: [] },
      string: { value: 'abc', invalidations: [{ ...defaultInvalidation, actual: 'string' }] },
      number: { value: 1, invalidations: [{ ...defaultInvalidation, actual: 'number' }] },
      bigint: { value: 1n, invalidations: [{ ...defaultInvalidation, actual: 'bigint' }] },
      // eslint-disable-next-line unicorn/no-null -- Testing
      null: { value: null, invalidations: [{ ...defaultInvalidation, actual: 'null' }] },
      undefined: { value: undefined, invalidations: [{ ...defaultInvalidation, actual: 'undefined' }] },
      symbol: { value: Symbol(''), invalidations: [{ ...defaultInvalidation, actual: 'symbol' }] },
    }

    for (const [name, data] of Object.entries(tests)) {
      it(`validate ${name}`, () => {
        const invalidations: Invalidation[] = []
        guard.validate(data.value, [], invalidations)
        expect(invalidations).toStrictEqual(data.invalidations)
      })
    }
  })

  it('coerce', () => {
    const guard = boolean()

    expect(guard.coerce).toBe(Guard.prototype.coerce)
  })

  it('convert', () => {
    const guard = boolean()

    expect(guard.convert).toBe(Guard.prototype.convert)
  })

  it('exclude', () => {
    const guard = boolean()

    expect(guard.exclude).toBe(Guard.prototype.exclude)
  })

  it('extract', () => {
    const guard = boolean()

    expect(guard.extract).toBe(Guard.prototype.extract)
  })

  it('inspect', () => {
    const guard = boolean()

    expect(guard.inspect).toBe(Guard.prototype.inspect)
  })

  it('scan', () => {
    const guard = boolean()

    expect(guard.scan).toBe(Guard.prototype.scan)
  })

  it('substitute', () => {
    const guard = boolean()

    expect(guard.substitute).toBe(Guard.prototype.substitute)
  })

  describe('equals', () => {
    it('boolean(), boolean()', () => {
      const guard1 = boolean()
      const guard2 = boolean()

      expect(guard1.equals(guard2)).toBe(true)
      expect(guard2.equals(guard1)).toBe(true)
    })

    it('boolean(), union([literal(true), literal(false)])', () => {
      const guard1 = boolean()
      const guard2 = union([literal(true), literal(false)])

      expect(guard1.equals(guard2)).toBe(true)
      expect(guard2.equals(guard1)).toBe(true)
    })
  })
})
