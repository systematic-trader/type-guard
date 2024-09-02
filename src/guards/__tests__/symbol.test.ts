import { describe, it } from 'std/testing/bdd.ts'
import { expect } from 'std/expect/mod.ts'

import { any } from '../any.ts'
import { Guard } from '../guard.ts'
import { assertType } from '../helpers.ts'
import { symbol } from '../symbol.ts'

import type { Invalidation } from '../errors.ts'
import type { GuardType } from '../guard.ts'
import type { Equals } from '../helpers.ts'

describe('symbol', () => {
  // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
  it('typescript', () => {
    const guard = symbol()

    assertType<Equals<GuardType<typeof guard>, symbol>>(1)
  })

  describe('properties', () => {
    const guard = symbol()

    it('name', () => {
      expect(guard.name).toBe('type')
    })

    it('arguments', () => {
      expect(guard.arguments).toStrictEqual([['symbol']])
    })

    it('type', () => {
      expect(guard.type).toStrictEqual(['symbol'])
    })
  })

  describe('accept', () => {
    const guard = symbol()

    // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
    it('type guarding', () => {
      const value: unknown = Symbol('')

      // eslint-disable-next-line vitest/no-conditional-in-test -- TypeScript checking
      if (guard.accept(value)) {
        assertType<Equals<GuardType<typeof guard>, typeof value>>(1)
      }
    })

    const tests = {
      symbol: { value: Symbol(''), accepts: true },
      boolean: { value: true, accepts: false },
      string: { value: 'abc', accepts: false },
      number: { value: 1, accepts: false },
      bigint: { value: 1n, accepts: false },
      // eslint-disable-next-line unicorn/no-null -- Testing
      null: { value: null, accepts: false },
      undefined: { value: undefined, accepts: false },
    }

    for (const [name, data] of Object.entries(tests)) {
      it(name, () => {
        expect(guard.accept(data.value)).toBe(data.accepts)
      })
    }
  })

  describe('validate', () => {
    const guard = symbol()
    const defaultSymbolInvalidation = { rule: 'type', path: [], setting: ['symbol'] }
    const tests = {
      boolean: { value: true, invalidations: [{ ...defaultSymbolInvalidation, actual: 'boolean' }] },
      string: { value: 'abc', invalidations: [{ ...defaultSymbolInvalidation, actual: 'string' }] },
      number: { value: 1, invalidations: [{ ...defaultSymbolInvalidation, actual: 'number' }] },
      bigint: { value: 1n, invalidations: [{ ...defaultSymbolInvalidation, actual: 'bigint' }] },
      // eslint-disable-next-line unicorn/no-null -- Testing
      null: { value: null, invalidations: [{ ...defaultSymbolInvalidation, actual: 'null' }] },
      undefined: { value: undefined, invalidations: [{ ...defaultSymbolInvalidation, actual: 'undefined' }] },
      symbol: { value: Symbol(''), invalidations: [] },
    }

    for (const [name, data] of Object.entries(tests)) {
      it(name, () => {
        const invalidations: Invalidation[] = []
        guard.validate(data.value, [], invalidations)
        expect(invalidations).toStrictEqual(data.invalidations)
      })
    }
  })

  it('coerce', () => {
    const guard = symbol()

    expect(guard.coerce).toBe(Guard.prototype.coerce)
  })

  it('convert', () => {
    const guard = symbol()

    expect(guard.convert).toBe(Guard.prototype.convert)
  })

  it('exclude', () => {
    const guard = symbol()

    expect(guard.exclude).toBe(Guard.prototype.exclude)
  })

  it('extract', () => {
    const guard = symbol()

    expect(guard.extract).toBe(Guard.prototype.extract)
  })

  it('inspect', () => {
    const guard = symbol()

    expect(guard.inspect).toBe(Guard.prototype.inspect)
  })

  it('scan', () => {
    const guard = symbol()

    expect(guard.scan).toBe(Guard.prototype.scan)
  })

  it('substitute', () => {
    const guard = symbol()

    expect(guard.substitute).toBe(Guard.prototype.substitute)
  })

  describe('equals', () => {
    it('symbol(), symbol()', () => {
      const guard1 = symbol()
      const guard2 = symbol()

      expect(guard1.equals(guard2)).toBe(true)
      expect(guard2.equals(guard1)).toBe(true)
    })

    it('symbol(), any()', () => {
      const guard1 = symbol()
      const guard2 = any()

      expect(guard1.equals(guard2)).toBe(false)
      expect(guard2.equals(guard1)).toBe(false)
    })
  })
})
