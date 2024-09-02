import { describe, it } from 'std/testing/bdd.ts'
import { expect } from 'std/expect/mod.ts'

import { Guard } from '../guard.ts'
import { assertType } from '../helpers.ts'
import { integer } from '../integer.ts'
import { number } from '../number.ts'
import { type } from '../type.ts'

import type { Invalidation } from '../errors.ts'
import type { GuardType } from '../guard.ts'
import type { Equals } from '../helpers.ts'

describe('number', () => {
  // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
  it('typescript', () => {
    const guard = number()
    assertType<Equals<GuardType<typeof guard>, number>>(1)
  })

  describe('properties', () => {
    const guard = number()
    it('name', () => {
      expect(guard.name).toBe('type')
    })

    it('arguments', () => {
      expect(guard.arguments).toStrictEqual([['number']])
    })

    it('type', () => {
      expect(guard.type).toStrictEqual(['number'])
    })
  })

  describe('accept', () => {
    const guard = number()

    // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
    it('type guarding', () => {
      const value: unknown = 1
      // eslint-disable-next-line vitest/no-conditional-in-test -- TypeScript checking
      if (guard.accept(value)) {
        assertType<Equals<typeof value, number>>(1)
      }
    })
    const tests = {
      number: { value: 1, accepts: true },
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
      it(`accept ${name}`, () => {
        expect(guard.accept(data.value)).toBe(data.accepts)
      })
    }

    it('precision', () => {
      const precisionGuard = number({ precision: 1 })
      expect(precisionGuard.accept(0)).toBe(true)
      expect(precisionGuard.accept(0.1)).toBe(true)
      expect(precisionGuard.accept(0.01)).toBe(false)
    })

    it('exclusiveMaximum', () => {
      const exclusiveMaximumGuard = number({ exclusiveMaximum: 1 })
      expect(exclusiveMaximumGuard.accept(0)).toBe(true)
      expect(exclusiveMaximumGuard.accept(1)).toBe(false)
      expect(exclusiveMaximumGuard.accept(2)).toBe(false)
    })

    it('exclusiveMinimum', () => {
      const exclusiveMinimumGuard = number({ exclusiveMinimum: 1 })
      expect(exclusiveMinimumGuard.accept(0)).toBe(false)
      expect(exclusiveMinimumGuard.accept(1)).toBe(false)
      expect(exclusiveMinimumGuard.accept(2)).toBe(true)
    })

    it('maximum', () => {
      const maximumGuard = number({ maximum: 1 })
      expect(maximumGuard.accept(0)).toBe(true)
      expect(maximumGuard.accept(1)).toBe(true)
      expect(maximumGuard.accept(2)).toBe(false)
    })

    it('minimum', () => {
      const minimumGuard = number({ minimum: 1 })
      expect(minimumGuard.accept(0)).toBe(false)
      expect(minimumGuard.accept(1)).toBe(true)
      expect(minimumGuard.accept(2)).toBe(true)
    })

    it('parity even', () => {
      const parityGuard = number({ parity: 'even' })
      expect(parityGuard.accept(0)).toBe(true)
      expect(parityGuard.accept(1)).toBe(false)
      expect(parityGuard.accept(2)).toBe(true)
    })

    it('parity odd', () => {
      const parityGuard = number({ parity: 'odd' })
      expect(parityGuard.accept(0)).toBe(false)
      expect(parityGuard.accept(1)).toBe(true)
      expect(parityGuard.accept(2)).toBe(false)
    })

    it('parity multipleOf', () => {
      const parityGuard = number({ parity: { multipleOf: 2 } })
      expect(parityGuard.accept(0)).toBe(true)
      expect(parityGuard.accept(1)).toBe(false)
      expect(parityGuard.accept(2)).toBe(true)
      expect(parityGuard.accept(4)).toBe(true)
    })

    it('parity offset', () => {
      const parityGuard = number({ parity: { multipleOf: 2, offset: 1 } })
      expect(parityGuard.accept(0)).toBe(false)
      expect(parityGuard.accept(1)).toBe(true)
      expect(parityGuard.accept(2)).toBe(false)
      expect(parityGuard.accept(3)).toBe(true)
    })

    it('all settings', () => {
      const parityGuard = number({
        precision: 1,
        exclusiveMaximum: 3,
        exclusiveMinimum: 1,
        maximum: 2,
        minimum: 1,
        parity: 'even',
      })
      expect(parityGuard.accept(1)).toBe(false)
      expect(parityGuard.accept(2)).toBe(true)
      expect(parityGuard.accept(2.1)).toBe(false)
    })
  })

  describe('validate', () => {
    const guard = number()
    const defaultNumberInvalidation = { rule: 'type', path: [], setting: ['number'] }
    const tests = {
      boolean: { value: true, invalidations: [{ ...defaultNumberInvalidation, actual: 'boolean' }] },
      string: { value: 'abc', invalidations: [{ ...defaultNumberInvalidation, actual: 'string' }] },
      number: { value: 1, invalidations: [] },
      bigint: { value: 1n, invalidations: [{ ...defaultNumberInvalidation, actual: 'bigint' }] },
      // eslint-disable-next-line unicorn/no-null -- Testing
      null: { value: null, invalidations: [{ ...defaultNumberInvalidation, actual: 'null' }] },
      undefined: { value: undefined, invalidations: [{ ...defaultNumberInvalidation, actual: 'undefined' }] },
      symbol: { value: Symbol(''), invalidations: [{ ...defaultNumberInvalidation, actual: 'symbol' }] },
    }

    for (const [name, data] of Object.entries(tests)) {
      it(`accept ${name}`, () => {
        const invalidations: Invalidation[] = []
        guard.validate(data.value, [], invalidations)
        expect(invalidations).toStrictEqual(data.invalidations)
      })
    }

    it('precision', () => {
      const precisionGuard = number({ precision: 1 })

      const invalidations: Invalidation[] = []
      precisionGuard.validate(0, [], invalidations)
      expect(invalidations).toStrictEqual([])

      invalidations.length = 0
      precisionGuard.validate(0.1, [], invalidations)
      expect(invalidations).toStrictEqual([])

      invalidations.length = 0
      precisionGuard.validate(0.01, [], invalidations)
      expect(invalidations).toStrictEqual([
        { rule: 'logical', guard: 'number', path: [], setting: 1, function: 'precision', actual: 2 },
      ])
    })

    it('exclusiveMaximum', () => {
      const exclusiveMaximumGuard = number({ exclusiveMaximum: 1 })

      const invalidations: Invalidation[] = []
      exclusiveMaximumGuard.validate(0, [], invalidations)
      expect(invalidations).toStrictEqual([])

      invalidations.length = 0
      exclusiveMaximumGuard.validate(1, [], invalidations)
      expect(invalidations).toStrictEqual([
        { rule: 'logical', guard: 'number', path: [], setting: 1, function: 'exclusiveMaximum', actual: 1 },
      ])

      invalidations.length = 0
      exclusiveMaximumGuard.validate(2, [], invalidations)
      expect(invalidations).toStrictEqual([
        { rule: 'logical', guard: 'number', path: [], setting: 1, function: 'exclusiveMaximum', actual: 2 },
      ])
    })

    it('exclusiveMinimum', () => {
      const exclusiveMinimumGuard = number({ exclusiveMinimum: 1 })

      const invalidations: Invalidation[] = []
      exclusiveMinimumGuard.validate(0, [], invalidations)
      expect(invalidations).toStrictEqual([
        { rule: 'logical', guard: 'number', path: [], setting: 1, function: 'exclusiveMinimum', actual: 0 },
      ])

      invalidations.length = 0
      exclusiveMinimumGuard.validate(1, [], invalidations)
      expect(invalidations).toStrictEqual([
        { rule: 'logical', guard: 'number', path: [], setting: 1, function: 'exclusiveMinimum', actual: 1 },
      ])

      invalidations.length = 0
      exclusiveMinimumGuard.validate(2, [], invalidations)
      expect(invalidations).toStrictEqual([])
    })

    it('maximum', () => {
      const maximumGuard = number({ maximum: 1 })

      const invalidations: Invalidation[] = []
      maximumGuard.validate(0, [], invalidations)
      expect(invalidations).toStrictEqual([])

      invalidations.length = 0
      maximumGuard.validate(1, [], invalidations)
      expect(invalidations).toStrictEqual([])

      invalidations.length = 0
      maximumGuard.validate(2, [], invalidations)
      expect(invalidations).toStrictEqual([
        { rule: 'logical', guard: 'number', path: [], setting: 1, function: 'maximum', actual: 2 },
      ])
    })

    it('minimum', () => {
      const minimumGuard = number({ minimum: 1 })

      const invalidations: Invalidation[] = []
      minimumGuard.validate(0, [], invalidations)
      expect(invalidations).toStrictEqual([
        { rule: 'logical', guard: 'number', path: [], setting: 1, function: 'minimum', actual: 0 },
      ])

      invalidations.length = 0
      minimumGuard.validate(1, [], invalidations)
      expect(invalidations).toStrictEqual([])

      invalidations.length = 0
      minimumGuard.validate(2, [], invalidations)
      expect(invalidations).toStrictEqual([])
    })

    it('parity even', () => {
      const parityGuard = number({ parity: 'even' })

      const invalidations: Invalidation[] = []
      parityGuard.validate(0, [], invalidations)
      expect(invalidations).toStrictEqual([])

      invalidations.length = 0
      parityGuard.validate(1, [], invalidations)
      expect(invalidations).toStrictEqual([
        { rule: 'logical', guard: 'number', path: [], setting: 'even', function: 'parity', actual: 1 },
      ])

      invalidations.length = 0
      parityGuard.validate(2, [], invalidations)
      expect(invalidations).toStrictEqual([])
    })

    it('parity odd', () => {
      const parityGuard = number({ parity: 'odd' })

      const invalidations: Invalidation[] = []
      parityGuard.validate(0, [], invalidations)
      expect(invalidations).toStrictEqual([
        { rule: 'logical', guard: 'number', path: [], setting: 'odd', function: 'parity', actual: 0 },
      ])

      invalidations.length = 0
      parityGuard.validate(1, [], invalidations)
      expect(invalidations).toStrictEqual([])

      invalidations.length = 0
      parityGuard.validate(2, [], invalidations)
      expect(invalidations).toStrictEqual([
        { rule: 'logical', guard: 'number', path: [], setting: 'odd', function: 'parity', actual: 2 },
      ])
    })

    it('parity multipleOf', () => {
      const parityGuard = number({ parity: { multipleOf: 2 } })

      const invalidations: Invalidation[] = []
      parityGuard.validate(0, [], invalidations)
      expect(invalidations).toStrictEqual([])

      invalidations.length = 0
      parityGuard.validate(1, [], invalidations)
      expect(invalidations).toStrictEqual([
        { rule: 'logical', guard: 'number', path: [], setting: { multipleOf: 2 }, function: 'parity', actual: 1 },
      ])

      invalidations.length = 0
      parityGuard.validate(2, [], invalidations)
      expect(invalidations).toStrictEqual([])

      invalidations.length = 0
      parityGuard.validate(4, [], invalidations)
      expect(invalidations).toStrictEqual([])
    })

    it('parity offset', () => {
      const parityGuard = number({ parity: { multipleOf: 2, offset: 1 } })

      const invalidations: Invalidation[] = []
      parityGuard.validate(0, [], invalidations)
      expect(invalidations).toStrictEqual([
        {
          rule: 'logical',
          guard: 'number',
          path: [],
          setting: { multipleOf: 2, offset: 1 },
          function: 'parity',
          actual: 0,
        },
      ])

      invalidations.length = 0
      parityGuard.validate(1, [], invalidations)
      expect(invalidations).toStrictEqual([])

      invalidations.length = 0
      parityGuard.validate(2, [], invalidations)
      expect(invalidations).toStrictEqual([
        {
          rule: 'logical',
          guard: 'number',
          path: [],
          setting: { multipleOf: 2, offset: 1 },
          function: 'parity',
          actual: 2,
        },
      ])

      invalidations.length = 0
      parityGuard.validate(3, [], invalidations)
      expect(invalidations).toStrictEqual([])
    })

    it('all settings', () => {
      const allGuard = number({
        precision: 1,
        exclusiveMaximum: 3,
        exclusiveMinimum: 1,
        maximum: 2,
        minimum: 1,
        parity: 'even',
      })

      const invalidations: Invalidation[] = []
      allGuard.validate(1, [], invalidations)
      expect(invalidations).toStrictEqual([
        {
          rule: 'logical',
          guard: 'number',
          path: [],
          setting: 1,
          function: 'exclusiveMinimum',
          actual: 1,
        },
        {
          rule: 'logical',
          guard: 'number',
          path: [],
          setting: 'even',
          function: 'parity',
          actual: 1,
        },
      ])

      invalidations.length = 0
      allGuard.validate(2, [], invalidations)
      expect(invalidations).toStrictEqual([])

      invalidations.length = 0
      allGuard.validate(2.1, [], invalidations)
      expect(invalidations).toStrictEqual([
        {
          rule: 'logical',
          guard: 'number',
          path: [],
          setting: 2,
          function: 'maximum',
          actual: 2.1,
        },
        {
          rule: 'logical',
          guard: 'number',
          path: [],
          setting: 'even',
          function: 'parity',
          actual: 2.1,
        },
      ])
    })
  })

  describe('coerce', () => {
    const guard = number()
    it('no settings', () => {
      expect(guard.coerce(1.01, [])).toStrictEqual({ skipCoerce: true, value: 1.01 })
    })
    it('round', () => {
      const precisionGuard = number({ round: true })
      expect(precisionGuard.coerce(1, [])).toStrictEqual({ skipCoerce: false, value: 1 })
      expect(precisionGuard.coerce(1.01, [])).toStrictEqual({ skipCoerce: false, value: 1 })
    })
    it('precision', () => {
      const precisionGuard = number({ round: true, precision: 2 })
      expect(precisionGuard.coerce(1, [])).toStrictEqual({ skipCoerce: false, value: 1 })
      expect(precisionGuard.coerce(1.011, [])).toStrictEqual({ skipCoerce: false, value: 1.01 })
      expect(precisionGuard.coerce(1.449, [])).toStrictEqual({ skipCoerce: false, value: 1.45 })
      expect(precisionGuard.coerce(1.005, [])).toStrictEqual({ skipCoerce: false, value: 1.01 })
    })
  })

  it('convert', () => {
    const guard = number()
    expect(guard.convert).toBe(Guard.prototype.convert)
  })

  it('exclude', () => {
    const guard = number()
    expect(guard.exclude).toBe(Guard.prototype.exclude)
  })

  it('extract', () => {
    const guard = number()
    expect(guard.extract).toBe(Guard.prototype.extract)
  })

  it('inspect', () => {
    const guard = number()
    expect(guard.inspect).toBe(Guard.prototype.inspect)
  })

  it('scan', () => {
    const guard = number()
    expect(guard.scan).toBe(Guard.prototype.scan)
  })

  it('substitute', () => {
    const guard = number()
    expect(guard.substitute).toBe(Guard.prototype.substitute)
  })

  describe('equals', () => {
    it('number(), number()', () => {
      const guard1 = number()
      const guard2 = number()

      expect(guard1.equals(guard2)).toBe(true)
      expect(guard2.equals(guard1)).toBe(true)
    })

    it('number(), integer()', () => {
      const guard1 = number()
      const guard2 = integer()

      expect(guard1.equals(guard2)).toBe(false)
      expect(guard2.equals(guard1)).toBe(false)
    })
  })

  describe('toString', () => {
    it('number', () => {
      const guard = number()
      expect(guard.toString()).toBe('number')
    })

    it('not a number', () => {
      const guard = type(['NaN'])
      expect(guard.toString()).toBe('number')
    })
  })
})
