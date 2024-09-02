import { describe, it } from 'std/testing/bdd.ts'
import { expect } from 'std/expect/mod.ts'

import { any } from '../any.ts'
import { array, ArrayGuard } from '../array.ts'
import { boolean } from '../boolean.ts'
import { Guard } from '../guard.ts'
import { assertType } from '../helpers.ts'
import { number } from '../number.ts'
import { props } from '../object.ts'
import { set } from '../set.ts'
import { string } from '../string.ts'
import { unknown } from '../unknown.ts'

import type { Invalidation } from '../errors.ts'
import type { GuardType } from '../guard.ts'
import type { Equals } from '../helpers.ts'
import type { ObjectGuard } from '../object.ts'

describe('array', () => {
  it.skip('typescript', () => {
    const booleanGuard = boolean()
    const guard = array(booleanGuard)
    assertType<Equals<GuardType<typeof guard>, readonly boolean[]>>(1)
  })

  describe('properties of array', () => {
    const booleanGuard = boolean()
    const guard = array(booleanGuard)
    it('name', () => {
      expect(guard.name).toBe('array')
    })

    it('arguments', () => {
      expect(guard.arguments).toStrictEqual([booleanGuard, {}])
    })

    it('type', () => {
      expect(guard.type).toStrictEqual(['object'])
    })

    it('circular guard', () => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- Circular type
      type Circular = { self: ObjectGuard<Circular> }
      const itemsGuard: ObjectGuard<Circular> = props(() => ({ self: itemsGuard }))

      const circularGuard = array(itemsGuard)

      const circular: Record<string, unknown> = {}
      circular['self'] = circular
      const input: unknown = [circular]

      expect(circularGuard.accept(input)).toBe(true)
      expect(circularGuard.accept([{}])).toBe(false)

      expect(circularGuard.toTypeScript({ interfaceName: 'CircularInterface' })).toBe(
        'interface CircularInterface extends ReadonlyArray<{ readonly "self": CircularInterface[number] }> {}',
      )
    })
  })

  describe('accept', () => {
    const booleanGuard = boolean()
    const guard = array(booleanGuard)

    it.skip('type guard', () => {
      const value: unknown = [true]

      // eslint-disable-next-line vitest/no-conditional-in-test -- TypeScript checking
      if (guard.accept(value)) {
        assertType<Equals<typeof value, readonly boolean[]>>(1)
      }
    })

    const tests = {
      booleanArray: { value: [true], accepts: true },
      emptyArray: { value: [], accepts: true },
      numberArray: { value: [1], accepts: false },
      boolean: { value: true, accepts: false },
      number: { value: 1, accepts: false },
      string: { value: 'abc', accepts: false },
      bigint: { value: 1n, accepts: false },
      object: { value: { one: 1 }, accepts: false },
      // eslint-disable-next-line unicorn/no-null -- Testing
      null: { value: null, accepts: false },
      undefined: { value: undefined, accepts: false },
      symbol: { value: Symbol(''), accepts: false },
    }

    for (const [name, { value, accepts }] of Object.entries(tests)) {
      it(`accept ${name}`, () => {
        expect(guard.accept(value)).toBe(accepts)
      })
    }

    it('unique items', () => {
      const innerGuard = boolean()
      const arrayGuard = array(innerGuard, { unique: true })
      expect(arrayGuard.accept([true, false])).toBe(true)
      expect(arrayGuard.accept([true, true])).toBe(false)
      expect(arrayGuard.accept([true, false, false])).toBe(false)
    })

    it('length', () => {
      const innerGuard = boolean()
      const numberGuard = number({ minimum: 1, maximum: 2 })
      const arrayGuard = array(innerGuard, { length: numberGuard })
      expect(arrayGuard.accept([])).toBe(false)
      expect(arrayGuard.accept([true])).toBe(true)
      expect(arrayGuard.accept([true, true])).toBe(true)
      expect(arrayGuard.accept([true, true, true])).toBe(false)
    })

    it('length without guard', () => {
      const innerGuard = boolean()
      const arrayGuard = array(innerGuard, { length: { parity: 'odd' } })
      expect(arrayGuard.accept([])).toBe(false)
      expect(arrayGuard.accept([true])).toBe(true)
      expect(arrayGuard.accept([true, true])).toBe(false)
      expect(arrayGuard.accept([true, true, true])).toBe(true)
    })

    it('circular', () => {
      const input = [{ arr: [] as unknown[] }]
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Testing
      input[0]!.arr.push(input)

      const guard1 = array(props({ arr: array(any()) }))

      expect(guard1.accept(input)).toBe(true)

      const guard2 = array(props({ arr: array(number()) }))

      expect(guard2.accept(input)).toBe(false)
    })
  })

  describe('validate', () => {
    const booleanGuard = boolean()
    const guard = array(booleanGuard)

    const defaultArrayInvalidation = {
      path: [],
      rule: 'type',
      setting: ['object'],
    }
    const tests = {
      booleanArray: { value: [true], invalidations: [] },
      emptyArray: { value: [], invalidations: [] },
      numberArray: {
        value: [1],
        invalidations: [{ ...defaultArrayInvalidation, actual: 'number', setting: ['boolean'], path: [0] }],
      },
      objectArray: {
        value: [{ one: 1 }, { two: 2 }],
        invalidations: [
          { ...defaultArrayInvalidation, actual: 'object', setting: ['boolean'], path: [0] },
          { ...defaultArrayInvalidation, actual: 'object', setting: ['boolean'], path: [1] },
        ],
      },
      boolean: { value: true, invalidations: [{ ...defaultArrayInvalidation, actual: 'boolean' }] },
      number: { value: 1, invalidations: [{ ...defaultArrayInvalidation, actual: 'number' }] },
      object: {
        value: { one: 1 },
        invalidations: [
          {
            ...defaultArrayInvalidation,
            actual: 'object',
            setting: 'Array',
            rule: 'logical',
            function: 'instanceof',
            guard: 'instance',
          },
        ],
      },
      symbol: { value: Symbol(''), invalidations: [{ ...defaultArrayInvalidation, actual: 'symbol' }] },
      bigint: { value: 1n, invalidations: [{ ...defaultArrayInvalidation, actual: 'bigint' }] },
      string: { value: 'abc', invalidations: [{ ...defaultArrayInvalidation, actual: 'string' }] },
      // eslint-disable-next-line unicorn/no-null -- Testing
      null: { value: null, invalidations: [{ ...defaultArrayInvalidation, actual: 'null' }] },
      undefined: { value: undefined, invalidations: [{ ...defaultArrayInvalidation, actual: 'undefined' }] },
    }

    for (const [name, { value, invalidations }] of Object.entries(tests)) {
      it(`validate ${name}`, () => {
        const actualInvalidations: Invalidation[] = []
        guard.validate(value, [], actualInvalidations)
        expect(actualInvalidations).toStrictEqual(invalidations)
      })
    }

    const innerGuard = boolean()

    it("should use inner guard's validator", () => {
      const innerInnerGuard = boolean()
      const arrayGuard = array(innerInnerGuard)
      const invalidations: Invalidation[] = []
      expect(arrayGuard.validate([true], [], [])).toBe(true)
      expect(arrayGuard.validate(['no'], [], invalidations)).toBe(false)
      expect(invalidations).toStrictEqual([{ path: [0], rule: 'type', setting: ['boolean'], actual: 'string' }])
    })

    it('unique items', () => {
      const arrayGuard = array(innerGuard, { unique: true })
      const invalidations: Invalidation[] = []
      expect(arrayGuard.validate([], [], [])).toBe(true)
      expect(arrayGuard.validate([true], [], [])).toBe(true)
      expect(arrayGuard.validate([true, true], [], invalidations)).toBe(false)
      expect(invalidations).toStrictEqual([
        { path: [], setting: undefined, rule: 'logical', function: 'unique', actual: [1], guard: 'array' },
      ])
    })

    it('length', () => {
      const innerInnerGuard = boolean()
      const numberGuard = number({ minimum: 1, maximum: 2 })
      const arrayGuard = array(innerInnerGuard, { length: numberGuard })
      const invalidations: Invalidation[] = []
      expect(arrayGuard.validate([], [], invalidations)).toBe(false)
      expect(invalidations).toStrictEqual([
        { path: ['length'], setting: 1, rule: 'logical', guard: 'number', function: 'minimum', actual: 0 },
      ])
      expect(arrayGuard.validate([true], [], [])).toBe(true)
      expect(arrayGuard.validate([true, true], [], [])).toBe(true)
      invalidations.length = 0
      expect(arrayGuard.validate([true, true, true], [], invalidations)).toBe(false)
      expect(invalidations).toStrictEqual([
        { path: ['length'], setting: 2, rule: 'logical', guard: 'number', function: 'maximum', actual: 3 },
      ])
    })

    it('circular', () => {
      const input = [{ arr: [] as unknown[] }]
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Testing
      input[0]!.arr.push(input)

      const guard1 = array(props({ arr: array(any()) }))

      const invalidations1: Invalidation[] = []
      expect(guard1.validate(input, [], invalidations1)).toBe(true)
      expect(invalidations1).toStrictEqual([])

      const guard2 = array(props({ arr: array(number()) }))

      const invalidations2: Invalidation[] = []
      expect(guard2.validate(input, [], invalidations2)).toBe(false)
      expect(invalidations2).toStrictEqual([
        {
          rule: 'type',
          path: [0, 'arr', 0],
          setting: ['number'],
          actual: 'object',
        },
      ])
    })
  })

  describe('substitute', () => {
    it('should replace array items', () => {
      const booleanGuard = boolean()
      const numberGuard = number()
      const arrayGuard = array(booleanGuard)
      const replacer = (_: ReadonlyArray<number | string | symbol>, guard: Guard<unknown>) => {
        // eslint-disable-next-line vitest/no-conditional-in-test -- Must be fixed in a later refactor
        if (guard === booleanGuard) {
          return numberGuard
        }
        return guard
      }
      const returnedGuard = arrayGuard.substitute([], replacer)
      expect(returnedGuard).toBe(array(numberGuard))
    })

    it('should keep settings', () => {
      const booleanGuard = boolean()
      const numberGuard = number()
      const arrayGuard = array(booleanGuard, { unique: true, length: { maximum: 2 } })
      const replacer = (_: ReadonlyArray<number | string | symbol>, guard: Guard<unknown>) => {
        // eslint-disable-next-line vitest/no-conditional-in-test -- Must be fixed in a later refactor
        if (guard === booleanGuard) {
          return numberGuard
        }
        return guard
      }
      const returnedGuard = arrayGuard.substitute([], replacer)

      expect(returnedGuard).toBeInstanceOf(ArrayGuard)

      expect(arrayGuard.arguments[1]).toStrictEqual(returnedGuard.arguments[1])
    })
  })

  describe('coerce', () => {
    it('should skip non-arrays', () => {
      const booleanGuard = boolean()
      const arrayGuard = array(booleanGuard)
      expect(arrayGuard.coerce(1, [])).toStrictEqual({ skipCoerce: false, value: 1 })
    })

    it('should coerce with items guard', () => {
      const booleanGuard = boolean()
      booleanGuard.coerce = () => ({
        skipCoerce: true,
        value: [true],
      })
      const arrayGuard = array(booleanGuard)
      expect(arrayGuard.coerce([true], [])).toStrictEqual({ skipCoerce: true, value: [[true]] })
    })

    it('should work with circular references', () => {
      const input: unknown[] = []
      input.push(input)

      const guard = array(any())
      // eslint-disable-next-line vitest/no-conditional-in-test -- Must be fixed in a later refactor
      const circularGuard = guard.substitute([], (_, guardItem) => (guardItem.type[0] === 'any' ? guard : guardItem))

      expect(circularGuard.coerce(input, [])).toStrictEqual({ skipCoerce: true, value: input })
    })

    it('should correctly coerce when needed', () => {
      const numberGuard = number({ round: true })
      const arrayGuard = array(numberGuard)
      expect(arrayGuard.coerce([1.01], [])).toStrictEqual({ skipCoerce: false, value: [1] })
    })
  })

  describe('convert', () => {
    const guard = array(boolean())

    it('should convert when guard accepts', () => {
      expect(
        guard.convert([true], undefined, [], (input, _, guardItem) => {
          // eslint-disable-next-line vitest/no-conditional-in-test -- Must be fixed in a later refactor
          if (!guardItem.accept(input)) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- Testing
            return `${input}`
          }

          return input
        }),
      ).toStrictEqual([true])
    })
  })

  describe('inspect', () => {
    it('should only be called for array', () => {
      const booleanGuard = boolean()
      const arrayGuard = array(booleanGuard)
      const inspecter = function* (_: ReadonlyArray<number | string | symbol>, guard: Guard<unknown>) {
        // eslint-disable-next-line vitest/no-conditional-in-test -- Must be fixed in a later refactor
        yield guard === arrayGuard ? 'match' : 'nomatch'
      }
      expect([...arrayGuard.inspect([], inspecter)]).toStrictEqual(['match', 'nomatch'])
    })
  })

  describe('scan', () => {
    const arrayGuard = array(boolean())
    it('should scan when guard accepts', () => {
      const scanner = (
        input: unknown,
        _: ReadonlyArray<number | string | symbol>,
        guard: Guard<unknown>,
        context: unknown[],
      ) => {
        // eslint-disable-next-line vitest/no-conditional-in-test -- Must be fixed in a later refactor
        if (guard.accept(input)) {
          context.push('accept')
        } else {
          context.push('no accept')
        }
      }

      const output: unknown[] = []
      arrayGuard.scan([true], output, [], scanner)
      expect(output).toStrictEqual(['accept', 'accept'])
    })
  })

  it('exclude', () => {
    const arrayGuard = array(boolean())
    expect(arrayGuard.exclude).toBe(Guard.prototype.exclude)
  })

  it('extract', () => {
    const arrayGuard = array(boolean())
    expect(arrayGuard.extract).toBe(Guard.prototype.extract)
  })

  describe('toString', () => {
    it('any()', () => {
      const guard = array(any())
      expect(guard.toString()).toBe('ReadonlyArray<any>')
    })

    it('unknown()', () => {
      const guard = array(unknown())
      expect(guard.toString()).toBe('ReadonlyArray<unknown>')
    })

    it('boolean()', () => {
      const guard = array(boolean())
      expect(guard.toString()).toBe('ReadonlyArray<boolean>')
    })

    it('string()', () => {
      const guard = array(string())
      expect(guard.toString()).toBe('ReadonlyArray<string>')
    })
  })

  describe('equals', () => {
    it('array(string()), array(string())', () => {
      const guard1 = array(string())
      const guard2 = array(string())

      expect(guard1.equals(guard2)).toBe(true)
      expect(guard2.equals(guard1)).toBe(true)
    })

    it('array(string()), array(number())', () => {
      const guard1 = array(string())
      const guard2 = array(number())

      expect(guard1.equals(guard2)).toBe(false)
      expect(guard2.equals(guard1)).toBe(false)
    })

    it('array(any()), set(any())', () => {
      const guard1 = array(any())
      const guard2 = set(any())

      expect(guard1.equals(guard2)).toBe(false)
      expect(guard2.equals(guard1)).toBe(false)
    })
  })
})
