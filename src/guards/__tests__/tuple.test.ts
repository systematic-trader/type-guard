import { describe, it } from 'std/testing/bdd.ts'
import { expect } from 'std/expect/mod.ts'

import { any } from '../any.ts'
import { array } from '../array.ts'
import { boolean } from '../boolean.ts'
import { assertType } from '../helpers.ts'
import { number } from '../number.ts'
import { string } from '../string.ts'
import { tuple } from '../tuple.ts'
import { union } from '../union.ts'

import type { Invalidation } from '../errors.ts'
import type { GuardType } from '../guard.ts'
import type { Equals } from '../helpers.ts'

describe('tuple', () => {
  // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
  it('typescript', () => {
    const guard = tuple([boolean()])
    assertType<Equals<GuardType<typeof guard>, readonly [boolean]>>(1)
  })

  describe('properties', () => {
    describe('boolean', () => {
      const guard = tuple([boolean()])

      it('name', () => {
        expect(guard.name).toBe('tuple')
      })

      it('arguments', () => {
        expect(guard.arguments).toStrictEqual([[boolean()]])
      })

      it('members', () => {
        expect(guard.members).toStrictEqual([boolean()])
      })

      it('type', () => {
        expect(guard.type).toStrictEqual(['object'])
      })
    })

    describe("['string', 'number']", () => {
      const members = [string(), number()]
      const guard = tuple(members)

      it('name', () => {
        expect(guard.name).toBe('tuple')
      })

      it('arguments', () => {
        expect(guard.arguments).toStrictEqual([members])
      })

      it('members', () => {
        expect(guard.members).toStrictEqual(members)
      })

      it('type', () => {
        expect(guard.type).toStrictEqual(['object'])
      })
    })

    describe('[]', () => {
      const guard = tuple([])

      it('name', () => {
        expect(guard.name).toBe('tuple')
      })

      it('arguments', () => {
        expect(guard.arguments).toStrictEqual([[]])
      })

      it('members', () => {
        expect(guard.members).toStrictEqual([])
      })

      it('type', () => {
        expect(guard.type).toStrictEqual(['object'])
      })
    })
  })

  describe('validate & accept', () => {
    describe('only arrays', () => {
      const guard = tuple([any()])
      const cases = [
        {
          input: [undefined],
          expectedInvalidations: [],
        },
        {
          input: [1],
          expectedInvalidations: [],
        },
        {
          input: new Set(),
          expectedInvalidations: [
            { rule: 'logical', setting: 'Array', path: [], actual: 'Set', function: 'instanceof', guard: 'instance' },
          ],
        },
        {
          input: new Set([1]),
          expectedInvalidations: [
            {
              rule: 'logical',
              setting: 'Array',
              path: [],
              actual: 'Set',
              function: 'instanceof',
              guard: 'instance',
            },
          ],
        },
        {
          input: 1,
          expectedInvalidations: [{ rule: 'type', setting: ['object'], path: [], actual: 'number' }],
        },
        {
          input: 'foo',
          expectedInvalidations: [{ rule: 'type', setting: ['object'], path: [], actual: 'string' }],
        },
        {
          input: { one: 1 },
          expectedInvalidations: [
            {
              rule: 'logical',
              setting: 'Array',
              path: [],
              actual: 'object',
              function: 'instanceof',
              guard: 'instance',
            },
          ],
        },
        {
          input: true,
          expectedInvalidations: [{ rule: 'type', setting: ['object'], path: [], actual: 'boolean' }],
        },
        {
          // eslint-disable-next-line unicorn/no-null -- Testing
          input: null,
          expectedInvalidations: [{ rule: 'type', setting: ['object'], path: [], actual: 'null' }],
        },
        {
          input: undefined,
          expectedInvalidations: [{ rule: 'type', setting: ['object'], path: [], actual: 'undefined' }],
        },
      ]

      for (const { input, expectedInvalidations } of cases) {
        it(`input: ${input}`, () => {
          const invalidations: Invalidation[] = []
          expect(guard.validate(input, [], invalidations)).toStrictEqual(expectedInvalidations.length === 0)
          expect(guard.accept(input)).toBe(expectedInvalidations.length === 0)
          expect(invalidations).toStrictEqual(expectedInvalidations)
        })
      }
    })

    describe('ordered is enforced', () => {
      const guard = tuple([string(), any()])
      const cases = [
        {
          input: ['foo', 1],
          expectedInvalidations: [],
        },
        {
          input: [1, 'foo'],
          expectedInvalidations: [{ actual: 'number', path: [0], rule: 'type', setting: ['string'] }],
        },
      ]

      for (const { input, expectedInvalidations } of cases) {
        it(`input: ${input}`, () => {
          const invalidations: Invalidation[] = []
          expect(guard.validate(input, [], invalidations)).toStrictEqual(expectedInvalidations.length === 0)
          expect(guard.accept(input)).toBe(expectedInvalidations.length === 0)
          expect(invalidations).toStrictEqual(expectedInvalidations)
        })
      }
    })

    describe('length is enforced', () => {
      const guard = tuple([any()])
      const cases = [
        {
          input: [],
          expectedInvalidations: [
            { actual: 0, function: 'equals', guard: 'literal', path: ['length'], rule: 'logical', setting: 1 },
          ],
        },
        {
          input: ['foo'],
          expectedInvalidations: [],
        },
        {
          input: ['foo', 1],
          expectedInvalidations: [
            { actual: 2, function: 'equals', guard: 'literal', path: ['length'], rule: 'logical', setting: 1 },
          ],
        },
      ]

      for (const { input, expectedInvalidations } of cases) {
        it(`input: ${input}`, () => {
          const invalidations: Invalidation[] = []
          expect(guard.validate(input, [], invalidations)).toStrictEqual(expectedInvalidations.length === 0)
          expect(guard.accept(input)).toBe(expectedInvalidations.length === 0)
          expect(invalidations).toStrictEqual(expectedInvalidations)
        })
      }
    })
  })

  describe('coerce', () => {
    it('skip no coercers string()', () => {
      const guard = tuple([string()])
      const input = ['a']
      expect(guard.coerce(input, [])).toStrictEqual({ skipCoerce: true, value: input })
    })

    it("string({ casing: 'upperCase' })", () => {
      const guard = tuple([string({ casing: 'upperCase' })])
      const input = ['a']
      const output = ['A']
      expect(guard.coerce(input, [])).toStrictEqual({ skipCoerce: false, value: output })
    })

    it('many coercers', () => {
      const guard = tuple([string({ casing: 'upperCase' }), number({ round: true }), string({ trim: true })])
      const input = ['a', 1.1, ' b ']
      const output = ['A', 1, 'b']
      expect(guard.coerce(input, [])).toStrictEqual({ skipCoerce: false, value: output })
    })

    it('many coercers with no input', () => {
      const guard = tuple([number({ round: true }), number({ round: true }), number({ round: true })])
      const input: unknown = []
      const output: unknown = []
      expect(guard.coerce(input, [])).toStrictEqual({ skipCoerce: false, value: output })
    })

    it('many coercers with some non-coercable input', () => {
      const guard = tuple([number({ round: true }), number({ round: true }), number({ round: true })])
      const input = [1]
      const output: unknown = [1]
      expect(guard.coerce(input, [])).toStrictEqual({ skipCoerce: false, value: output })
    })

    it('many coercers with some coercable input', () => {
      const guard = tuple([number({ round: true }), number({ round: true }), number({ round: true })])
      const input = [1.1]
      const output: unknown = [1]
      expect(guard.coerce(input, [])).toStrictEqual({ skipCoerce: false, value: output })
    })

    it('no guards with input', () => {
      const guard = tuple([])
      const input: unknown = []
      expect(guard.coerce(input, [])).toStrictEqual({ skipCoerce: true, value: input })
    })
  })

  describe('substitute', () => {
    it('should return self when nothing is replaced', () => {
      const guard = tuple([string()])
      const manipulatedGuard = guard.substitute([], (_, innerGuard) => innerGuard)
      expect(manipulatedGuard).toBe(guard)
    })

    it('should replace inner guard', () => {
      const guard = tuple([any(), string()])
      const manipulatedGuard = guard.substitute([], (_, innerGuard) => {
        // eslint-disable-next-line vitest/no-conditional-in-test -- conditional is part of test
        if (innerGuard.name === 'type' && innerGuard.type[0] === 'any') {
          return number()
        }
        return innerGuard
      })
      expect(manipulatedGuard.equals(tuple([number(), string()]))).toBe(true)
    })

    it('should replace self', () => {
      const guard = tuple([any(), string()])
      const manipulatedGuard = guard.substitute([], (_, innerGuard) => {
        // eslint-disable-next-line vitest/no-conditional-in-test -- conditional is part of test
        if (innerGuard.name === 'tuple') {
          return number()
        }
        return innerGuard
      })
      expect(manipulatedGuard.equals(number())).toBe(true)
    })
  })

  describe('convert', () => {
    const guard = tuple([string({ casing: 'lowerCase' }), number()])

    it('should convert when guard accepts', () => {
      const input: [string, number] = ['a', 1]
      const output = ['key-a', 1]
      expect(
        guard.convert(input, undefined, [], (convertInput, _, innerGuard) => {
          // eslint-disable-next-line vitest/no-conditional-in-test -- conditional is part of test
          if (innerGuard.name === 'string' && innerGuard.type[0] === 'string') {
            return `key-${convertInput as string}`
          }

          return convertInput
        }),
      ).toStrictEqual(output)
    })

    it('should not convert anything, if no value is changed', () => {
      const input: [string, number] = ['a', 2.5]
      expect(guard.convert(input, undefined, [], (convertInput) => convertInput)).toBe(input)
    })
  })

  describe('inspect', () => {
    it('should visit every guard', () => {
      const guard = tuple([string(), number()])
      expect([
        ...guard.inspect([], function* (_, innerGuard) {
          yield `${innerGuard.name}-${innerGuard.type[0] as string}`
        }),
      ]).toStrictEqual(['tuple-object', 'type-string', 'type-number'])
    })
  })

  describe('scan', () => {
    it('should scan when guard accepts', () => {
      const guard = tuple([string(), number()])
      const input = ['1', 1]
      const output: unknown[] = []

      guard.scan(input, output, [], (scanningInput, _path, _guard, scanningOutput) => {
        scanningOutput.push(scanningInput)
      })

      expect(output).toStrictEqual([input, '1', 1])
    })

    it('should throw AssertionError when guard does not accept', () => {
      const guard = tuple([string({ casing: 'lowerCase' }), number()])
      const input = ['A', 1]

      const invalidations: Invalidation[] = []
      guard.validate(input, [], invalidations)

      expect(guard.accept(input)).toBe(false)
      expect(invalidations.length).toBeGreaterThan(0)
    })
  })

  describe('unionize', () => {
    it('any(), any()', () => {
      const members = [any(), any()]
      const guard = tuple(members)

      expect(guard.unionize()).toBe(union(members))
    })

    it('string(), number()', () => {
      const members = [string(), number()]
      const guard = tuple(members)

      expect(guard.unionize()).toBe(union(members))
    })
  })

  describe('pluck', () => {
    it('any()', () => {
      const guard = tuple([any()])
      expect(guard.pluck(0)).toBe(any())
    })

    it('should throw when no guard at index', () => {
      const guard = tuple([any()])
      expect(() => guard.pluck(1)).toThrow(`[1] is out of bounds. Pluck between 0-0`)
    })
  })

  describe('pick', () => {
    it('any()', () => {
      const guard = tuple([any()])
      expect(guard.pick([0]).equals(tuple([any()]))).toBe(true)
    })

    it('number(), string(), any() -> tuple([number(), string()]', () => {
      const guard = tuple([number(), string(), any()])
      expect(guard.pick([0, 1]).equals(tuple([number(), string()]))).toBe(true)
    })

    it('number(), string(), any() -> tuple([number(), any()]', () => {
      const guard = tuple([number(), string(), any()])
      expect(guard.pick([0, 2]).equals(tuple([number(), any()]))).toBe(true)
    })

    it('should throw when no guard at index', () => {
      const guard = tuple([any()])
      expect(() => guard.pick([0, 1])).toThrow(`[1] is out of bounds. Pluck between 0-0`)
    })
  })

  describe('prepend', () => {
    it('any()', () => {
      const guard = tuple([])
      expect(guard.prepend([any()]).equals(tuple([any()]))).toBe(true)
    })
    it('any() + string() -> string(),any()', () => {
      const guard = tuple([any()])
      expect(guard.prepend([string()]).equals(tuple([string(), any()]))).toBe(true)
    })
  })

  describe('append', () => {
    it('any()', () => {
      const guard = tuple([])
      expect(guard.append([any()]).equals(tuple([any()]))).toBe(true)
    })
    it('any() + string() -> any(),string()', () => {
      const guard = tuple([any()])
      expect(guard.append([string()]).equals(tuple([any(), string()]))).toBe(true)
    })
  })

  describe('toString', () => {
    it('[]', () => {
      const guard = tuple([])
      expect(guard.toString()).toBe('[]')
    })

    it('any(), any()', () => {
      const guard = tuple([any(), any()])
      expect(guard.toString()).toBe('[any, any]')
    })

    it('string(), number()', () => {
      const guard = tuple([string(), number()])
      expect(guard.toString()).toBe('[string, number]')
    })
  })

  describe('equals', () => {
    it('tuple([string()]), tuple([string()])', () => {
      const guard1 = tuple([string()])
      const guard2 = tuple([string()])

      expect(guard1.equals(guard2)).toBe(true)
      expect(guard2.equals(guard1)).toBe(true)
    })

    it('tuple([string()]), tuple([number()])', () => {
      const guard1 = tuple([string()])
      const guard2 = tuple([number()])

      expect(guard1.equals(guard2)).toBe(false)
      expect(guard2.equals(guard1)).toBe(false)
    })

    it('tuple([any()]), array(any())', () => {
      const guard1 = tuple([any()])
      const guard2 = array(any())

      expect(guard1.equals(guard2)).toBe(false)
      expect(guard2.equals(guard1)).toBe(false)
    })
  })
})
