import { describe, it } from 'std/testing/bdd.ts'
import { expect } from 'std/expect/mod.ts'

import { bigint } from '../bigint.ts'
import { Guard } from '../guard.ts'
import { assertType } from '../helpers.ts'
import { integer } from '../integer.ts'

import type { Invalidation } from '../errors.ts'
import type { GuardType } from '../guard.ts'
import type { Equals } from '../helpers.ts'

const GuardBigInt = bigint()

describe('bigint', () => {
  describe('properties', () => {
    // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
    it('typescript', () => {
      assertType<Equals<GuardType<typeof GuardBigInt>, bigint>>(1)
    })

    describe('with no settings', () => {
      const guard = bigint()

      it('name', () => {
        expect(guard.name).toBe('type')
      })

      it('arguments', () => {
        expect(guard.arguments).toStrictEqual([['bigint']])
      })

      it('type', () => {
        expect(guard.type).toStrictEqual(['bigint'])
      })
    })

    describe('with some settings', () => {
      const guard = bigint({ parity: 'even' })

      it('name', () => {
        expect(guard.name).toBe('bigint')
      })

      it('arguments', () => {
        expect(guard.arguments).toStrictEqual([{ parity: 'even' }])
      })

      it('type', () => {
        expect(guard.type).toStrictEqual(['bigint'])
      })
    })
  })

  describe('settings errors', () => {
    const tests = {
      exclusiveMaximum: '"exclusiveMaximum" must be undefined or a bigint',
      exclusiveMinimum: '"exclusiveMinimum" must be undefined or a bigint',
      maximum: '"maximum" must be undefined or a bigint',
      minimum: '"minimum" must be undefined or a bigint',
      parity: '"parity" must be undefined, "even" or "odd" or an object with "multipleOf" and an optional "offset"',
    }

    for (const [name, data] of Object.entries(tests)) {
      it(name, () => {
        expect(() => bigint({ [name]: 1 })).toThrow(data)
      })
    }
  })

  describe('accept', () => {
    // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
    it('type guarding', () => {
      const value: unknown = 1
      // eslint-disable-next-line vitest/no-conditional-in-test -- TypeScript checking
      if (GuardBigInt.accept(value)) {
        assertType<Equals<typeof value, bigint>>(1)
      }
    })

    const tests = {
      bigint: { value: 1n, accepts: true },
      number: { value: 1, accepts: false },
      array: { value: [1], accepts: false },
      object: { value: { one: 1 }, accepts: false },
      boolean: { value: true, accepts: false },
      string: { value: 'abc', accepts: false },
      // eslint-disable-next-line unicorn/no-null -- Testing
      null: { value: null, accepts: false },
      undefined: { value: undefined, accepts: false },
      symbol: { value: Symbol(''), accepts: false },
    }

    for (const [name, data] of Object.entries(tests)) {
      it(`accepts ${name}`, () => {
        expect(GuardBigInt.accept(data.value)).toBe(data.accepts)
      })
    }

    it('exclusiveMaximum', () => {
      const exclusiveMaximumGuard = bigint({ exclusiveMaximum: 1n })
      expect(exclusiveMaximumGuard.accept(0n)).toBe(true)
      expect(exclusiveMaximumGuard.accept(1n)).toBe(false)
      expect(exclusiveMaximumGuard.accept(2n)).toBe(false)
    })

    it('exclusiveMinimum', () => {
      const exclusiveMinimumGuard = bigint({ exclusiveMinimum: 1n })
      expect(exclusiveMinimumGuard.accept(0n)).toBe(false)
      expect(exclusiveMinimumGuard.accept(1n)).toBe(false)
      expect(exclusiveMinimumGuard.accept(2n)).toBe(true)
    })

    it('maximum', () => {
      const maximumGuard = bigint({ maximum: 1n })
      expect(maximumGuard.accept(0n)).toBe(true)
      expect(maximumGuard.accept(1n)).toBe(true)
      expect(maximumGuard.accept(2n)).toBe(false)
    })

    it('minimum', () => {
      const minimumGuard = bigint({ minimum: 1n })
      expect(minimumGuard.accept(0n)).toBe(false)
      expect(minimumGuard.accept(1n)).toBe(true)
      expect(minimumGuard.accept(2n)).toBe(true)
    })

    it('parity even', () => {
      const parityGuard = bigint({ parity: 'even' })
      expect(parityGuard.accept(0n)).toBe(true)
      expect(parityGuard.accept(1n)).toBe(false)
      expect(parityGuard.accept(2n)).toBe(true)
    })

    it('parity odd', () => {
      const parityGuard = bigint({ parity: 'odd' })
      expect(parityGuard.accept(0n)).toBe(false)
      expect(parityGuard.accept(1n)).toBe(true)
      expect(parityGuard.accept(2n)).toBe(false)
    })

    it('parity multipleOf', () => {
      const parityGuard = bigint({ parity: { multipleOf: 2n } })
      expect(parityGuard.accept(0n)).toBe(true)
      expect(parityGuard.accept(1n)).toBe(false)
      expect(parityGuard.accept(2n)).toBe(true)
      expect(parityGuard.accept(4n)).toBe(true)
    })

    it('parity offset', () => {
      const parityGuard = bigint({ parity: { multipleOf: 2n, offset: 1n } })
      expect(parityGuard.accept(0n)).toBe(false)
      expect(parityGuard.accept(1n)).toBe(true)
      expect(parityGuard.accept(2n)).toBe(false)
      expect(parityGuard.accept(3n)).toBe(true)
    })

    it('all settings', () => {
      const parityGuard = bigint({
        exclusiveMaximum: 3n,
        exclusiveMinimum: 1n,
        maximum: 2n,
        minimum: 1n,
        parity: 'even',
      })
      expect(parityGuard.accept(1n)).toBe(false)
      expect(parityGuard.accept(2n)).toBe(true)
      expect(parityGuard.accept(3n)).toBe(false)
    })
  })

  describe('validate', () => {
    const defaultBigIntInvalidation = { rule: 'type', path: [], setting: ['bigint'] }
    const tests = {
      bigint: { value: 1n, invalidations: [] },
      bigintArray: { value: [1n], invalidations: [{ ...defaultBigIntInvalidation, actual: 'object' }] },
      object: { value: { one: 1n }, invalidations: [{ ...defaultBigIntInvalidation, actual: 'object' }] },
      boolean: { value: true, invalidations: [{ ...defaultBigIntInvalidation, actual: 'boolean' }] },
      string: { value: 'abc', invalidations: [{ ...defaultBigIntInvalidation, actual: 'string' }] },
      number: { value: 1, invalidations: [{ ...defaultBigIntInvalidation, actual: 'number' }] },
      // eslint-disable-next-line unicorn/no-null -- Testing
      null: { value: null, invalidations: [{ ...defaultBigIntInvalidation, actual: 'null' }] },
      undefined: { value: undefined, invalidations: [{ ...defaultBigIntInvalidation, actual: 'undefined' }] },
      symbol: { value: Symbol(''), invalidations: [{ ...defaultBigIntInvalidation, actual: 'symbol' }] },
    }

    for (const [name, data] of Object.entries(tests)) {
      it(`validate ${name}`, () => {
        const invalidations: Invalidation[] = []
        expect(GuardBigInt.validate(data.value, [], invalidations)).toBe(data.invalidations.length === 0)
        expect(invalidations).toStrictEqual(data.invalidations)
      })
    }

    it('exclusiveMaximum', () => {
      const exclusiveMaximumGuard = bigint({ exclusiveMaximum: 1n })
      const invalidations: Invalidation[] = []
      expect(exclusiveMaximumGuard.validate(0n, [], invalidations)).toBe(true)
      expect(exclusiveMaximumGuard.validate(1n, [], invalidations)).toBe(false)
      expect(invalidations).toStrictEqual([
        { rule: 'logical', guard: 'bigint', path: [], setting: 1n, function: 'exclusiveMaximum', actual: 1n },
      ])
      invalidations.length = 0
      expect(exclusiveMaximumGuard.validate(2n, [], invalidations)).toBe(false)
      expect(invalidations).toStrictEqual([
        { rule: 'logical', guard: 'bigint', path: [], setting: 1n, function: 'exclusiveMaximum', actual: 2n },
      ])
    })

    it('exclusiveMinimum', () => {
      const exclusiveMinimumGuard = bigint({ exclusiveMinimum: 1n })
      const invalidations: Invalidation[] = []
      expect(exclusiveMinimumGuard.validate(0n, [], invalidations)).toBe(false)
      expect(invalidations).toStrictEqual([
        { rule: 'logical', guard: 'bigint', path: [], setting: 1n, function: 'exclusiveMinimum', actual: 0n },
      ])
      invalidations.length = 0
      expect(exclusiveMinimumGuard.validate(1n, [], invalidations)).toBe(false)
      expect(invalidations).toStrictEqual([
        { rule: 'logical', guard: 'bigint', path: [], setting: 1n, function: 'exclusiveMinimum', actual: 1n },
      ])
      expect(exclusiveMinimumGuard.validate(2n, [], [])).toBe(true)
    })

    it('maximum', () => {
      const maximumGuard = bigint({ maximum: 1n })
      const invalidations: Invalidation[] = []
      expect(maximumGuard.validate(0n, [], invalidations)).toBe(true)
      expect(maximumGuard.validate(1n, [], invalidations)).toBe(true)
      expect(maximumGuard.validate(2n, [], invalidations)).toBe(false)
      expect(invalidations).toStrictEqual([
        { rule: 'logical', guard: 'bigint', path: [], setting: 1n, function: 'maximum', actual: 2n },
      ])
    })

    it('minimum', () => {
      const minimumGuard = bigint({ minimum: 1n })
      const invalidations: Invalidation[] = []
      expect(minimumGuard.validate(0n, [], invalidations)).toBe(false)
      expect(invalidations).toStrictEqual([
        { rule: 'logical', guard: 'bigint', path: [], setting: 1n, function: 'minimum', actual: 0n },
      ])
      expect(minimumGuard.validate(1n, [], [])).toBe(true)
      expect(minimumGuard.validate(2n, [], [])).toBe(true)
    })

    it('parity even', () => {
      const parityGuard = bigint({ parity: 'even' })
      const invalidations: Invalidation[] = []
      expect(parityGuard.validate(0n, [], [])).toBe(true)
      expect(parityGuard.validate(1n, [], invalidations)).toBe(false)
      expect(invalidations).toStrictEqual([
        { rule: 'logical', guard: 'bigint', path: [], setting: 'even', function: 'parity', actual: 1n },
      ])
      expect(parityGuard.validate(2n, [], [])).toBe(true)
    })

    it('parity odd', () => {
      const parityGuard = bigint({ parity: 'odd' })
      const invalidations: Invalidation[] = []
      expect(parityGuard.validate(0n, [], invalidations)).toBe(false)
      expect(invalidations).toStrictEqual([
        { rule: 'logical', guard: 'bigint', path: [], setting: 'odd', function: 'parity', actual: 0n },
      ])
      invalidations.length = 0
      expect(parityGuard.validate(1n, [], invalidations)).toBe(true)
      expect(parityGuard.validate(2n, [], invalidations)).toBe(false)
      expect(invalidations).toStrictEqual([
        { rule: 'logical', guard: 'bigint', path: [], setting: 'odd', function: 'parity', actual: 2n },
      ])
    })

    it('parity multipleOf', () => {
      const parityGuard = bigint({ parity: { multipleOf: 2n } })
      const invalidations: Invalidation[] = []
      expect(parityGuard.validate(0n, [], [])).toBe(true)
      expect(parityGuard.validate(1n, [], invalidations)).toBe(false)
      expect(invalidations).toStrictEqual([
        { rule: 'logical', guard: 'bigint', path: [], setting: { multipleOf: 2n }, function: 'parity', actual: 1n },
      ])
      expect(parityGuard.validate(2n, [], [])).toBe(true)
      expect(parityGuard.validate(4n, [], [])).toBe(true)
    })

    it('parity offset', () => {
      const parityGuard = bigint({ parity: { multipleOf: 2n, offset: 1n } })
      const invalidations: Invalidation[] = []
      expect(parityGuard.validate(0n, [], invalidations)).toBe(false)
      expect(invalidations).toStrictEqual([
        {
          rule: 'logical',
          guard: 'bigint',
          path: [],
          setting: { multipleOf: 2n, offset: 1n },
          function: 'parity',
          actual: 0n,
        },
      ])
      invalidations.length = 0
      expect(parityGuard.validate(1n, [], invalidations)).toBe(true)
      expect(parityGuard.validate(2n, [], invalidations)).toBe(false)
      expect(invalidations).toStrictEqual([
        {
          rule: 'logical',
          guard: 'bigint',
          path: [],
          setting: { multipleOf: 2n, offset: 1n },
          function: 'parity',
          actual: 2n,
        },
      ])
      expect(parityGuard.validate(3n, [], [])).toBe(true)
    })

    it('all settings', () => {
      const allGuard = bigint({
        exclusiveMaximum: 3n,
        exclusiveMinimum: 1n,
        maximum: 2n,
        minimum: 1n,
        parity: 'even',
      })
      const invalidations: Invalidation[] = []
      expect(allGuard.validate(1n, [], invalidations)).toBe(false)
      expect(invalidations).toStrictEqual([
        {
          rule: 'logical',
          guard: 'bigint',
          path: [],
          setting: 1n,
          function: 'exclusiveMinimum',
          actual: 1n,
        },
        {
          rule: 'logical',
          guard: 'bigint',
          path: [],
          setting: 'even',
          function: 'parity',
          actual: 1n,
        },
      ])
      invalidations.length = 0
      expect(allGuard.validate(2n, [], invalidations)).toBe(true)
      expect(allGuard.validate(3n, [], invalidations)).toBe(false)
      expect(invalidations).toStrictEqual([
        {
          rule: 'logical',
          guard: 'bigint',
          path: [],
          setting: 3n,
          function: 'exclusiveMaximum',
          actual: 3n,
        },
        {
          rule: 'logical',
          guard: 'bigint',
          path: [],
          setting: 2n,
          function: 'maximum',
          actual: 3n,
        },
        {
          rule: 'logical',
          guard: 'bigint',
          path: [],
          setting: 'even',
          function: 'parity',
          actual: 3n,
        },
      ])
    })
  })

  it('coerce', () => {
    expect(GuardBigInt.convert).toBe(Guard.prototype.convert)
  })

  it('convert', () => {
    expect(GuardBigInt.convert).toBe(Guard.prototype.convert)
  })

  it('exclude', () => {
    expect(GuardBigInt.exclude).toBe(Guard.prototype.exclude)
  })

  it('extract', () => {
    expect(GuardBigInt.extract).toBe(Guard.prototype.extract)
  })

  it('inspect', () => {
    expect(GuardBigInt.inspect).toBe(Guard.prototype.inspect)
  })

  it('scan', () => {
    expect(GuardBigInt.scan).toBe(Guard.prototype.scan)
  })

  it('substitute', () => {
    expect(GuardBigInt.substitute).toBe(Guard.prototype.substitute)
  })

  describe('equals', () => {
    it('bigint(), bigint()', () => {
      const guard1 = bigint()
      const guard2 = bigint()

      expect(guard1.equals(guard2)).toBe(true)
      expect(guard2.equals(guard1)).toBe(true)
    })

    it("bigint({ parity: 'odd' }), bigint({ parity: 'odd' })", () => {
      const guard1 = bigint({ parity: 'odd' })
      const guard2 = bigint({ parity: 'odd' })

      expect(guard1.equals(guard2)).toBe(true)
      expect(guard2.equals(guard1)).toBe(true)
    })

    it("bigint({ parity: 'odd' }), bigint({ parity: 'even' })", () => {
      const guard1 = bigint({ parity: 'odd' })
      const guard2 = bigint({ parity: 'even' })

      expect(guard1.equals(guard2)).toBe(false)
      expect(guard2.equals(guard1)).toBe(false)
    })

    it('bigint(), integer()', () => {
      const guard1 = bigint()
      const guard2 = integer()

      expect(guard1.equals(guard2)).toBe(false)
      expect(guard2.equals(guard1)).toBe(false)
    })
  })
})
