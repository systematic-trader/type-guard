import { describe, it } from 'std/testing/bdd.ts'
import { expect } from 'std/expect/mod.ts'

import { boolean } from '../boolean.ts'
import { Guard } from '../guard.ts'
import { assertType } from '../helpers.ts'
import { literal } from '../literal.ts'
import { type } from '../type.ts'

import type { Invalidation } from '../errors.ts'
import type { GuardType } from '../guard.ts'
import type { Equals } from '../helpers.ts'

describe('literal', () => {
  // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
  it('typescript', () => {
    const guard = literal(1)
    assertType<Equals<GuardType<typeof guard>, 1>>(1)
  })

  describe('properties', () => {
    const guard = literal(1)
    it('name', () => {
      expect(guard.name).toBe('literal')
    })

    it('arguments', () => {
      expect(guard.arguments).toStrictEqual([1])
    })

    it('type', () => {
      expect(guard.type).toStrictEqual(['number'])
    })
  })

  it('null', () => {
    // eslint-disable-next-line unicorn/no-null -- Testing
    const guard = literal(null)
    expect(guard.arguments).toBe(type('null').arguments)
  })

  it('undefined', () => {
    const guard = literal(undefined)
    expect(guard.arguments).toBe(type('undefined').arguments)
  })

  describe('accept', () => {
    const guard = literal(1)
    // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
    it('type guarding', () => {
      const value: unknown = 1
      // eslint-disable-next-line vitest/no-conditional-in-test -- TypeScript checking
      if (guard.accept(value)) {
        assertType<Equals<typeof value, 1>>(1)
      }
    })

    const tests = {
      number: { value: 1, accepts: true },
      wrongNumber: { value: 0, accepts: false },
      array: { value: [1], accepts: false },
      object: { value: { one: 1 }, accepts: false },
      boolean: { value: true, accepts: false },
      string: { value: 'abc', accepts: false },
      bigint: { value: 1n, accepts: false },
      // eslint-disable-next-line unicorn/no-null -- Testing
      null: { value: null, accepts: false },
      undefined: { value: undefined, accepts: false },
      symbol: { value: Symbol(''), accepts: false },
    }

    for (const [name, data] of Object.entries(tests)) {
      it(`accepts ${name}`, () => {
        expect(guard.accept(data.value)).toBe(data.accepts)
      })
    }

    it('should deeply accept array', () => {
      const arrayGuard = literal([1, 2, 3, 4])
      expect(arrayGuard.accept([1, 2, 3, 4])).toBe(true)
      expect(arrayGuard.accept([1, 2, 2, 4])).toBe(false)
    })

    it('should deeply accept object', () => {
      const arrayGuard = literal({ one: 1, two: 2, three: { four: 4 } })
      expect(arrayGuard.accept({ one: 1, two: 2, three: { four: 4 } })).toBe(true)
      expect(arrayGuard.accept({ one: 1, two: 2, three: { four: 5 } })).toBe(false)
    })

    it('should deeply accept array of objects', () => {
      const arrayGuard = literal([1, 2, { one: 1, two: [2], three: { four: 4 } }])
      expect(arrayGuard.accept([1, 2, { one: 1, two: [2], three: { four: 4 } }])).toBe(true)
      expect(arrayGuard.accept([1, { one: 1, two: [2], three: { four: 4 } }])).toBe(false)
    })
  })

  describe('validate', () => {
    const guard = literal(1)
    const defaultLiteralInvalidation = {
      rule: 'logical',
      path: [],
      guard: 'literal',
      function: 'equals',
      setting: 1,
    }
    const symbol = Symbol('')
    const tests = {
      number: { value: 1, invalidations: [] },
      wrongNumber: { value: 0, invalidations: [{ ...defaultLiteralInvalidation, actual: 0 }] },
      boolean: { value: true, invalidations: [{ ...defaultLiteralInvalidation, actual: true }] },
      array: { value: [1], invalidations: [{ ...defaultLiteralInvalidation, actual: [1] }] },
      object: { value: { one: 1 }, invalidations: [{ ...defaultLiteralInvalidation, actual: { one: 1 } }] },
      string: { value: 'abc', invalidations: [{ ...defaultLiteralInvalidation, actual: 'abc' }] },
      bigint: { value: 1n, invalidations: [{ ...defaultLiteralInvalidation, actual: 1n }] },
      // eslint-disable-next-line unicorn/no-null -- Testing
      null: { value: null, invalidations: [{ ...defaultLiteralInvalidation, actual: null }] },
      undefined: { value: undefined, invalidations: [{ ...defaultLiteralInvalidation, actual: undefined }] },
      symbol: { value: symbol, invalidations: [{ ...defaultLiteralInvalidation, actual: symbol }] },
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
    const guard = literal(1)
    expect(guard.coerce).toBe(Guard.prototype.coerce)
  })

  it('convert', () => {
    const guard = literal(1)
    expect(guard.convert).toBe(Guard.prototype.convert)
  })

  it('exclude', () => {
    const guard = literal(1)
    expect(guard.exclude).toBe(Guard.prototype.exclude)
  })

  it('extract', () => {
    const guard = literal(1)
    expect(guard.extract).toBe(Guard.prototype.extract)
  })

  it('inspect', () => {
    const guard = literal(1)
    expect(guard.inspect).toBe(Guard.prototype.inspect)
  })

  it('scan', () => {
    const guard = literal(1)
    expect(guard.scan).toBe(Guard.prototype.scan)
  })

  it('substitute', () => {
    const guard = literal(1)
    expect(guard.substitute).toBe(Guard.prototype.substitute)
  })

  describe('toString', () => {
    const literalTests = {
      bigint: { value: 1n, result: '1n' },
      boolean: { value: true, result: 'true' },
      function: { value: () => 1, result: 'Function' },
      infinity: { value: Number.POSITIVE_INFINITY, result: 'number' },
      number: { value: 1, result: '1' },
      array: { value: [1, 2, 3], result: 'readonly [1, 2, 3]' },
      object: {
        value: { one: 1, two: 2, three: 3 },
        result: "{ readonly 'one': 1; readonly 'two': 2; readonly 'three': 3 }",
      },
      // eslint-disable-next-line unicorn/no-null -- Testing
      null: { value: null, result: 'null' },
      undefined: { value: undefined, result: 'undefined' },
      class: { value: boolean(), result: 'Guard' },
      string: { value: 'abc', result: "'abc'" },
      symbol: { value: Symbol('a'), result: 'a' },
      'symbol-iterator': { value: Symbol.iterator, result: 'Symbol.iterator' },
    }

    for (const [name, data] of Object.entries(literalTests)) {
      it(`toString ${name}`, () => {
        expect(literal(data.value).toString()).toBe(data.result)
      })
    }
  })

  describe('equals', () => {
    it("literal('1'), literal('1')", () => {
      const guard1 = literal('1')
      const guard2 = literal('1')

      expect(guard1.equals(guard2)).toBe(true)
      expect(guard2.equals(guard1)).toBe(true)
    })

    it("literal('1'), literal('2')", () => {
      const guard1 = literal('1')
      const guard2 = literal('2')

      expect(guard1.equals(guard2)).toBe(false)
      expect(guard2.equals(guard1)).toBe(false)
    })

    it("literal('1'), literal(1)", () => {
      const guard1 = literal('1')
      const guard2 = literal(1)

      expect(guard1.equals(guard2)).toBe(false)
      expect(guard2.equals(guard1)).toBe(false)
    })
  })
})
