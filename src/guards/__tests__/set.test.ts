import { describe, it } from 'std/testing/bdd.ts'
import { expect } from 'std/expect/mod.ts'

import { any } from '../any.ts'
import { array } from '../array.ts'
import { boolean } from '../boolean.ts'
import { Guard } from '../guard.ts'
import { assertType } from '../helpers.ts'
import { number } from '../number.ts'
import { set, SetGuard } from '../set.ts'
import { string } from '../string.ts'

import type { Invalidation } from '../errors.ts'
import type { GuardType } from '../guard.ts'
import type { Equals } from '../helpers.ts'

describe('set', () => {
  // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
  it('typescript', () => {
    const guard = set(number())
    assertType<Equals<GuardType<typeof guard>, Set<number>>>(1)
  })

  describe('properties', () => {
    describe('with no settings', () => {
      const guard = set(number())

      it('name', () => {
        expect(guard.name).toBe('set')
      })

      it('arguments', () => {
        expect(guard.arguments).toStrictEqual([number(), {}])
      })

      it('type', () => {
        expect(guard.type).toStrictEqual(['object'])
      })
    })

    describe('size: 2', () => {
      const guard = set(number(), { size: 2 })

      it('name', () => {
        expect(guard.name).toBe('set')
      })

      it('arguments', () => {
        expect(guard.arguments).toStrictEqual([number(), { size: 2 }])
      })

      it('type', () => {
        expect(guard.type).toStrictEqual(['object'])
      })
    })

    it('instanceof', () => {
      const guard = set(number())

      expect(guard).toBeInstanceOf(SetGuard)
    })

    describe("size: { parity: 'even' }", () => {
      const guard = set(number(), { size: { parity: 'even' } })

      it('name', () => {
        expect(guard.name).toBe('set')
      })

      it('arguments', () => {
        expect(guard.arguments).toStrictEqual([number(), { size: { parity: 'even' } }])
      })

      it('type', () => {
        expect(guard.type).toStrictEqual(['object'])
      })
    })

    describe("size: number({ parity: 'even' })", () => {
      const guard = set(number(), { size: number({ parity: 'even' }) })

      it('name', () => {
        expect(guard.name).toBe('set')
      })

      it('arguments', () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.any
        expect(guard.arguments).toStrictEqual([number(), { size: expect.any(Guard) }])
      })

      it('type', () => {
        expect(guard.type).toStrictEqual(['object'])
      })
    })
  })

  describe('validate & accept', () => {
    describe('any()', () => {
      const guard = set(any())

      const cases = [
        {
          input: new Set(),
          expectedInvalidations: [],
        },
        {
          input: new Set([1, 2]),
          expectedInvalidations: [],
        },
        {
          input: new Set([1, 'foo']),
          expectedInvalidations: [],
        },
        {
          input: 1,
          expectedInvalidations: [{ rule: 'type', setting: ['object'], path: [], actual: 'number' }],
        },
        {
          input: 'foo',
          expectedInvalidations: [{ rule: 'type', setting: ['object'], path: [], actual: 'string' }],
        },
      ]

      for (const { input, expectedInvalidations } of cases) {
        it(`${input}`, () => {
          const invalidations: Invalidation[] = []
          expect(guard.validate(input, [], invalidations)).toStrictEqual(expectedInvalidations.length === 0)
          expect(guard.accept(input)).toBe(expectedInvalidations.length === 0)
          expect(invalidations).toStrictEqual(expectedInvalidations)
        })
      }
    })

    describe('string()', () => {
      const guard = set(string())

      const cases = [
        {
          input: new Set(),
          expectedInvalidations: [],
        },
        {
          input: new Set(['1', '2']),
          expectedInvalidations: [],
        },
        {
          input: new Set([1, 2]),
          expectedInvalidations: [
            {
              rule: 'type',
              path: [0],
              setting: ['string'],
              actual: 'number',
            },
            {
              rule: 'type',
              path: [1],
              setting: ['string'],
              actual: 'number',
            },
          ],
        },
      ]

      for (const { input, expectedInvalidations } of cases) {
        it(`${input}`, () => {
          const invalidations: Invalidation[] = []
          expect(guard.validate(input, [], invalidations)).toStrictEqual(expectedInvalidations.length === 0)
          expect(guard.accept(input)).toBe(expectedInvalidations.length === 0)
          expect(invalidations).toStrictEqual(expectedInvalidations)
        })
      }
    })

    describe('number(), { size: 2 }', () => {
      const guard = set(number(), { size: 2 })

      const cases = [
        {
          input: new Set(),
          expectedInvalidations: [
            {
              actual: 0,
              function: 'equals',
              guard: 'literal',
              path: ['size'],
              rule: 'logical',
              setting: 2,
            },
          ],
        },
        {
          input: new Set(['1', 2]),
          expectedInvalidations: [
            {
              actual: 'string',
              path: [0],
              rule: 'type',
              setting: ['number'],
            },
          ],
        },
        {
          input: new Set([1, 2]),
          expectedInvalidations: [],
        },
        {
          input: new Set([1, 2, 2]),
          expectedInvalidations: [],
        },
        {
          input: new Set([1, 2, 3]),
          expectedInvalidations: [
            {
              actual: 3,
              function: 'equals',
              guard: 'literal',
              path: ['size'],
              rule: 'logical',
              setting: 2,
            },
          ],
        },
      ]

      for (const { input, expectedInvalidations } of cases) {
        it(`${input}`, () => {
          const invalidations: Invalidation[] = []
          expect(guard.validate(input, [], invalidations)).toStrictEqual(expectedInvalidations.length === 0)
          expect(guard.accept(input)).toBe(expectedInvalidations.length === 0)
          expect(invalidations).toStrictEqual(expectedInvalidations)
        })
      }
    })

    it('should work with self reference', () => {
      const input = new Set()
      input.add(input)
      const guard = set(any())
      // eslint-disable-next-line vitest/no-conditional-in-test -- test
      const circularGuard = guard.substitute([], (_, innerGuard) => (innerGuard.type[0] === 'any' ? guard : innerGuard))
      expect(circularGuard.accept(input)).toBe(true)
    })
  })

  describe('coerce', () => {
    it('any()', () => {
      const guard = set(any())
      const input = new Set(['a', 1])
      expect(guard.coerce(input, [])).toStrictEqual({ skipCoerce: true, value: input })
    })

    it('boolean()', () => {
      const guard = set(boolean())
      const input = new Set([true, false])
      expect(guard.coerce(input, [])).toStrictEqual({ skipCoerce: true, value: input })
    })

    it("string({ casing: 'upperCase' }), any()", () => {
      const guard = set(string({ casing: 'upperCase' }))
      const input = new Set(['a', 'B'])
      const output = new Set(['A', 'B'])
      expect(guard.coerce(input, [])).toStrictEqual({ skipCoerce: false, value: output })
    })

    it('number({ round: true })', () => {
      const guard = set(number({ round: true }))
      const input = new Set([1.1, 2.2])
      const output = new Set([1, 2])

      expect(guard.coerce(input, [])).toStrictEqual({ skipCoerce: false, value: output })
    })

    it('should work with self reference', () => {
      const input = new Set()
      input.add(input)

      const guard = set(any())
      // eslint-disable-next-line vitest/no-conditional-in-test -- test
      const circularGuard = guard.substitute([], (_, innerGuard) => (innerGuard.type[0] === 'any' ? guard : innerGuard))

      expect(circularGuard.coerce(input, [])).toStrictEqual({ skipCoerce: true, value: input })
    })
  })

  describe('substitute', () => {
    it('should substitute inner guard', () => {
      const stringGuard = string()
      const guard = set(stringGuard)
      const manipulatedGuard = guard.substitute([], (_, innerGuard) => {
        // eslint-disable-next-line vitest/no-conditional-in-test -- test
        if (innerGuard === stringGuard) {
          return number()
        }
        return innerGuard
      })
      expect(manipulatedGuard).toBe(set(number()))
    })

    it('should substitute entire guard', () => {
      const guard = set(string())
      const manipulatedGuard = guard.substitute([], (_, innerGuard) => {
        // eslint-disable-next-line vitest/no-conditional-in-test -- test
        if (innerGuard === guard) {
          return number()
        }
        return innerGuard
      })
      expect(manipulatedGuard).toBe(number())
    })
  })

  describe('convert', () => {
    const guard = set(string({ casing: 'lowerCase' }))

    it('should convert values when guard accepts', () => {
      const input = new Set(['a'])
      const output = new Set(['key-a'])

      expect(
        guard.convert(input, undefined, [], (convertInput, _, innerGuard) => {
          // eslint-disable-next-line vitest/no-conditional-in-test -- test
          if (innerGuard.name === 'string' && innerGuard.type[0] === 'string') {
            return `key-${convertInput as string}`
          }

          return convertInput
        }),
      ).toStrictEqual(output)
    })

    it('should not convert anything, if no value is changed', () => {
      const input = new Set(['a', 'b'])

      expect(guard.convert(input, undefined, [], (convertInput) => convertInput)).toBe(input)
    })
  })

  describe('inspect', () => {
    it('should go through outer and inner guard', () => {
      const guard = set(string())
      expect([
        ...guard.inspect([], function* (_, innerGuard) {
          yield `${innerGuard.name}-${innerGuard.type[0] as string}`
        }),
      ]).toStrictEqual(['set-object', 'type-string'])
    })
  })

  describe('scan', () => {
    it('should scan when guard accepts', () => {
      const guard = set(string())
      const input = new Set(['1', '2'])
      const output: unknown[] = []

      guard.scan(input, output, [], (scanningInput, _path, _guard, scanningOutput) => {
        scanningOutput.push(scanningInput)
      })

      expect(output).toStrictEqual([input, '1', '2'])
    })

    it('should throw AssertionError when guard does not accept', () => {
      const guard = set(string({ casing: 'lowerCase' }))
      const input = new Set(['A', 'B'])

      const invalidations: Invalidation[] = []
      guard.validate(input, [], invalidations)

      expect(guard.accept(input)).toBe(false)
      expect(invalidations.length).toBeGreaterThan(0)
    })
  })

  describe('toString', () => {
    it('any()', () => {
      const guard = set(any())
      expect(guard.toString()).toBe('Set<any>')
    })

    it('number()', () => {
      const guard = set(number())
      expect(guard.toString()).toBe('Set<number>')
    })
  })

  describe('equals', () => {
    it('set(string()), set(string())', () => {
      const guard1 = set(string())
      const guard2 = set(string())

      expect(guard1.equals(guard2)).toBe(true)
      expect(guard2.equals(guard1)).toBe(true)
    })

    it('set(string()), set(number())', () => {
      const guard1 = set(string())
      const guard2 = set(number())

      expect(guard1.equals(guard2)).toBe(false)
      expect(guard2.equals(guard1)).toBe(false)
    })

    it('set(any()), array(any())', () => {
      const guard1 = set(any())
      const guard2 = array(any())

      expect(guard1.equals(guard2)).toBe(false)
      expect(guard2.equals(guard1)).toBe(false)
    })
  })
})
