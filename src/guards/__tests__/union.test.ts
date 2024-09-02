import { describe, it } from 'std/testing/bdd.ts'
import { expect } from 'std/expect/mod.ts'

import { any } from '../any.ts'
import { boolean } from '../boolean.ts'
import { Guard } from '../guard.ts'
import { assertType } from '../helpers.ts'
import { literal } from '../literal.ts'
import { never } from '../never.ts'
import { number } from '../number.ts'
import { string } from '../string.ts'
import { type } from '../type.ts'
import { union } from '../union.ts'
import { unknown } from '../unknown.ts'

import type { Invalidation } from '../errors.ts'
import type { GuardType } from '../guard.ts'
import type { Equals } from '../helpers.ts'

describe('union', () => {
  // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
  it('typescript', () => {
    const booleanGuard = boolean()
    const literalGuard = literal(1)
    const unionGuard = union([booleanGuard, literalGuard])
    assertType<Equals<GuardType<typeof unionGuard>, boolean | 1>>(1)
  })

  describe('properties of union', () => {
    const booleanGuard = boolean()
    const literalGuard = literal(1)
    const unionGuard = union([booleanGuard, literalGuard])
    it('name', () => {
      expect(unionGuard.name).toBe('union')
    })

    it('arguments', () => {
      expect(unionGuard.arguments).toStrictEqual([[booleanGuard, literalGuard]])
    })

    it('type', () => {
      expect(unionGuard.type).toStrictEqual(['boolean', 'number'])
    })
  })

  describe('union of types', () => {
    it('never', () => {
      expect(union([])).toBe(never())
      expect(union([never()])).toBe(never())
      expect(union([never(), boolean()])).toBe(boolean())
    })

    it('unknown', () => {
      expect(union([unknown()])).toBe(unknown())
      expect(union([unknown(), boolean()])).toBe(unknown())
      expect(union([unknown(), never()])).toBe(unknown())
    })

    it('any', () => {
      expect(union([any()])).toBe(any())
      expect(union([any(), boolean()])).toBe(any())
      expect(union([any(), never()])).toBe(any())
    })

    it('boolean OR number', () => {
      expect(union([boolean(), number()])).toBe(type(['boolean', 'number']))
    })

    it('true OR false', () => {
      const unionType = union([literal(true), literal(false)])
      const booleanType = type('boolean')

      expect(unionType).toBe(booleanType)
    })

    it('collapse simple types', () => {
      expect(
        union([type('boolean'), type('number'), type('string')]).equals(type(['boolean', 'number', 'string'])),
      ).toBe(true)
    })

    it('collapse complex types', () => {
      expect(
        union([boolean(), number({ round: true }), string({ trim: true }), type(['number', 'string'])]).equals(
          type(['boolean', 'number', 'string']),
        ),
      ).toBe(true)
    })
  })

  describe('accept', () => {
    const booleanGuard = boolean()
    const literalGuard = literal(1)
    const unionGuard = union([booleanGuard, literalGuard])

    // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
    it('type guard', () => {
      const value: unknown = 1

      // eslint-disable-next-line vitest/no-conditional-in-test -- TypeScript checking
      if (unionGuard.accept(value)) {
        assertType<Equals<typeof value, boolean | 1>>(1)
      }
    })

    const tests = {
      boolean: { value: true, accepts: true },
      falseBoolean: { value: false, accepts: true },
      number: { value: 1, accepts: true },
      wrongNumber: { value: 0, accepts: false },
      string: { value: 'abc', accepts: false },
      bigint: { value: 1n, accepts: false },
    }

    for (const [name, data] of Object.entries(tests)) {
      it(name, () => {
        expect(unionGuard.accept(data.value)).toBe(data.accepts)
      })
    }
  })

  describe('validate', () => {
    const booleanGuard = boolean()
    const literalGuard = literal(1)
    const unionGuard = union([booleanGuard, literalGuard])

    const defaultUnionInvalidation = {
      rule: 'type',
      path: [],
      setting: ['boolean', 'number'],
    }
    const tests = {
      number: { value: 1, invalidations: [] },
      boolean: { value: true, invalidations: [] },
      wrongNumber: {
        value: 0,
        invalidations: [{ rule: 'logical', path: [], guard: 'literal', function: 'equals', setting: 1, actual: 0 }],
      },
      bigint: { value: 1n, invalidations: [{ ...defaultUnionInvalidation, actual: 'bigint' }] },
      string: { value: 'abc', invalidations: [{ ...defaultUnionInvalidation, actual: 'string' }] },
      // eslint-disable-next-line unicorn/no-null -- Testing
      null: { value: null, invalidations: [{ ...defaultUnionInvalidation, actual: 'null' }] },
      undefined: { value: undefined, invalidations: [{ ...defaultUnionInvalidation, actual: 'undefined' }] },
    }

    for (const [name, data] of Object.entries(tests)) {
      it(`validate ${name}`, () => {
        const invalidations: Invalidation[] = []
        unionGuard.validate(data.value, [], invalidations)
        expect(invalidations).toStrictEqual(data.invalidations)
      })
    }

    it('validate union of literals', () => {
      const guard = union([literal(1), literal(2), literal(3)])
      const invalidations: Invalidation[] = []
      guard.validate(3, [], invalidations)
      expect(invalidations).toStrictEqual([])
    })
  })

  describe('coerce', () => {
    it('should correctly coerce when needed', () => {
      const guardA = boolean()
      const guardB = number({ round: true })
      const unionGuard = union([guardA, guardB])
      expect(unionGuard.coerce(1.01, [])).toStrictEqual({ skipCoerce: false, value: 1 })
    })
  })

  describe('convert', () => {
    const booleanGuard = boolean()
    const literalGuard = literal(1)
    const unionGuard = union([booleanGuard, literalGuard])

    it('should convert when guard accepts', () => {
      const converter = (input: unknown, _: ReadonlyArray<number | string | symbol>, guard: Guard<unknown>) => {
        // eslint-disable-next-line vitest/no-conditional-in-test -- conditional part of test
        if (guard.accept(input)) {
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- template literal is intentional
          return `${input}`
        }
        return input
      }
      expect(unionGuard.convert(1, undefined, [], converter)).toBe('1')
    })

    it('should throw AssertionError when guard does not accept', () => {
      expect(() => unionGuard.convert(0 as unknown as 1, undefined, [], () => undefined)).toThrow(
        '- expected to be "equals" 1, but received 0',
      )
    })
  })

  it('exclude', () => {
    const unionGuard = union([boolean(), literal(1)])
    expect(unionGuard.exclude).toBe(Guard.prototype.exclude)
  })

  it('extract', () => {
    const unionGuard = union([boolean(), literal(1)])
    expect(unionGuard.extract).toBe(Guard.prototype.extract)
  })

  describe('substitute', () => {
    it('should replace entire guard', () => {
      const numberGuard = number()
      const unionGuard = union([boolean(), literal(1)])
      const returnedGuard = unionGuard.substitute([], () => numberGuard)
      expect(returnedGuard).toBe(numberGuard)
    })

    it('should replace inner guard', () => {
      const booleanGuard = boolean()
      const literalGuard = literal(1)
      const numberGuard = number()
      const unionGuard = union([booleanGuard, literalGuard])
      const replacer = (_: ReadonlyArray<number | string | symbol>, guard: Guard<unknown>) => {
        // eslint-disable-next-line vitest/no-conditional-in-test -- conditional part of test
        if (guard === literalGuard) {
          return numberGuard
        }
        return guard
      }
      const returnedGuard = unionGuard.substitute([], replacer)
      expect(returnedGuard).toBe(union([booleanGuard, numberGuard]))
    })
  })

  describe('scan', () => {
    const guardA = boolean()
    const guardB = literal(1)
    const unionGuard = union([guardA, guardB])

    it('should scan when guard accepts', () => {
      const scanner = (
        input: unknown,
        _: ReadonlyArray<number | string | symbol>,
        guard: Guard<unknown>,
        output: unknown[],
      ) => {
        // eslint-disable-next-line vitest/no-conditional-in-test -- conditional part of test
        if (guard.accept(input)) {
          output.push('accept')
        } else {
          output.push('no accept')
        }
      }

      const output: unknown[] = []

      unionGuard.scan(true, output, [], scanner)

      expect(output).toStrictEqual(['accept'])
    })

    it('should throw error with no accepting members', () => {
      const scanner = () => undefined
      expect(() => unionGuard.scan('abc', [], [], scanner)).toThrow(
        '- expected "type" to be "boolean" or "number", but received "string"',
      )
    })
  })

  it('inspect', () => {
    const guardA = boolean()
    const guardB = literal(1)
    const unionGuard = union([guardA, guardB])
    const inspecter = function* (_: ReadonlyArray<number | string | symbol>, guard: Guard<unknown>) {
      // eslint-disable-next-line vitest/no-conditional-in-test -- conditional part of test
      yield guard === guardA ? 'match' : 'nomatch'
    }
    expect([...unionGuard.inspect([], inspecter)]).toStrictEqual(['match', 'nomatch'])
  })

  describe('equals', () => {
    it('union([]), union([])', () => {
      const guard1 = union([])
      const guard2 = union([])

      expect(guard1.equals(guard2)).toBe(true)
      expect(guard2.equals(guard1)).toBe(true)
    })

    it('union([]), never()', () => {
      const guard1 = union([])
      const guard2 = never()

      expect(guard1.equals(guard2)).toBe(true)
      expect(guard2.equals(guard1)).toBe(true)
    })

    it('union([string()]), union([string()])', () => {
      const guard1 = union([string()])
      const guard2 = union([string()])

      expect(guard1.equals(guard2)).toBe(true)
      expect(guard2.equals(guard1)).toBe(true)
    })

    it("union([string({ casing: 'lowerCase' })]), union([string({ casing: 'upperCase' })])", () => {
      const guard1 = union([string({ casing: 'lowerCase' })])
      const guard2 = union([string({ casing: 'upperCase' })])

      expect(guard1.equals(guard2)).toBe(false)
      expect(guard2.equals(guard1)).toBe(false)
    })

    it('complex union', () => {
      const guard1 = union([string({ casing: 'lowerCase' }), string({ casing: 'upperCase' })])
      const guard2 = union([string({ casing: 'upperCase' }), string({ casing: 'lowerCase' })])

      expect(guard1.equals(guard2)).toBe(true)
      expect(guard2.equals(guard1)).toBe(true)
    })
  })

  describe('toString', () => {
    it('[any(), any()]', () => {
      const guard = union([any(), any()])
      expect(guard.toString()).toBe('any')
    })

    it('[string(), number()]', () => {
      const guard = union([string(), number()])
      expect(guard.toString()).toBe('number | string')
    })
  })
})
