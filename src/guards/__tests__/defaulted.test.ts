import { describe, it } from 'std/testing/bdd.ts'
import { expect } from 'std/expect/mod.ts'

import { boolean } from '../boolean.ts'
import { defaulted } from '../defaulted.ts'
import { Guard } from '../guard.ts'
import { assertType } from '../helpers.ts'
import { number } from '../number.ts'
import { string } from '../string.ts'

import type { GuardType } from '../guard.ts'
import type { Equals } from '../helpers.ts'

const defaulter = () => -1

describe('defaulted', () => {
  const numberGuard = number()
  const defaultedNumberGuard = defaulted(numberGuard, defaulter)

  // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
  it('typescript', () => {
    assertType<Equals<GuardType<typeof defaultedNumberGuard>, number>>(1)
  })

  describe('properties', () => {
    it('name', () => {
      expect(defaultedNumberGuard.name).toBe('defaulted')
    })

    it('arguments', () => {
      expect(defaultedNumberGuard.arguments).toStrictEqual([numberGuard, defaulter])
    })

    it('type', () => {
      expect(defaultedNumberGuard.type).toStrictEqual(['number'])
    })
  })

  describe('accept', () => {
    // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
    it('type guarding', () => {
      const value: unknown = 1
      // eslint-disable-next-line vitest/no-conditional-in-test -- TypeScript checking
      if (defaultedNumberGuard.accept(value)) {
        assertType<Equals<typeof value, number>>(1)
      }
    })

    it('should accept guards type', () => {
      expect(defaultedNumberGuard.accept(1)).toBe(true)
    })
  })

  describe('validate', () => {
    it("should validate guard's type", () => {
      expect(defaultedNumberGuard.validate(1, [], [])).toBe(true)
    })
  })

  describe('coerce', () => {
    it('should use default value when not accepting', () => {
      const numberGuard2 = number({ round: true })
      const defaulter2 = () => -1.1
      const guard = defaulted(numberGuard2, defaulter2)
      expect(guard.coerce(true, [])).toStrictEqual({ skipCoerce: false, value: -1 })
    })
  })

  describe('convert', () => {
    it("should call guard's accept before conversion", () => {
      const converter = () => 1
      const guard = defaulted(numberGuard, defaulter)
      expect(guard.convert(1, undefined, [], converter)).toBe(1)
    })

    it("should call guard's convert", () => {
      const converter = () => 1
      const guard = defaulted(numberGuard, defaulter)
      expect(guard.convert(1, undefined, [], converter)).toBe(1)
    })
  })

  describe('inspect', () => {
    it('should inspect self and inner guard', () => {
      const inspecter = function* () {
        yield 1
      }
      const guard = defaulted(numberGuard, defaulter)
      expect([...guard.inspect([], inspecter)]).toStrictEqual([1])
    })
  })

  describe('scan', () => {
    it('should scan inner guard', () => {
      const guard = defaulted(numberGuard, defaulter)
      const output: unknown[] = []

      guard.scan(1, output, [], (input, _path, _guard, scanningOutput) => {
        scanningOutput.push(input)
      })

      expect(output).toStrictEqual([1])
    })
  })

  describe('substitute', () => {
    it('should run substitute on inner guard', () => {
      const booleanGuard = boolean()
      const replacer = (_: ReadonlyArray<number | string | symbol>, guard: Guard<unknown>) => {
        // eslint-disable-next-line vitest/no-conditional-in-test -- Must be fixed in a later refactor
        if (guard === numberGuard) {
          return booleanGuard
        }
        return guard
      }
      const defaultedGuard = defaulted(numberGuard, defaulter)
      expect(defaultedGuard.substitute([], replacer)).toStrictEqual(booleanGuard)
    })
  })

  it('exclude', () => {
    const guard = defaulted(numberGuard, defaulter)
    expect(guard.exclude).toBe(Guard.prototype.exclude)
  })

  it('extract', () => {
    const guard = defaulted(numberGuard, defaulter)
    expect(guard.extract).toBe(Guard.prototype.extract)
  })

  it('toString', () => {
    const guard = defaulted(numberGuard, defaulter)
    expect(guard.toString()).toBe(numberGuard.toString())
  })

  describe('equals', () => {
    it("defaulted(string(), ''), defaulted(string(), '')", () => {
      const guard1 = defaulted(string(), '')
      const guard2 = defaulted(string(), '')

      expect(guard1.equals(guard2)).toBe(true)
      expect(guard2.equals(guard1)).toBe(true)
    })

    it("defaulted(string({ casing: 'lowerCase' }), ''), defaulted(string({ casing: 'upperCase' }), '')", () => {
      const guard1 = defaulted(string({ casing: 'lowerCase' }), '')
      const guard2 = defaulted(string({ casing: 'upperCase' }), '')

      expect(guard1.equals(guard2)).toBe(false)
      expect(guard2.equals(guard1)).toBe(false)
    })

    it("defaulted(string(), ''), defaulted(string(), 'NO')", () => {
      const guard1 = defaulted(string(), '')
      const guard2 = defaulted(string(), 'NO')

      expect(guard1.equals(guard2)).toBe(false)
      expect(guard2.equals(guard1)).toBe(false)
    })

    it("defaulted(string({ blank: false }), ''), defaulted(string(), '')", () => {
      const guard1 = defaulted(string({ blank: false }), '')
      const guard2 = defaulted(string(), '')

      expect(guard1.equals(guard2)).toBe(false)
      expect(guard2.equals(guard1)).toBe(false)
    })
  })
})
