import { describe, it } from 'std/testing/bdd.ts'
import { expect } from 'std/expect/mod.ts'

import { any } from '../any.ts'
import { boolean } from '../boolean.ts'
import { Guard } from '../guard.ts'
import { assertType } from '../helpers.ts'
import { map } from '../map.ts'
import { number } from '../number.ts'
import { string } from '../string.ts'

import type { Invalidation } from '../errors.ts'
import type { GuardType } from '../guard.ts'
import type { Equals } from '../helpers.ts'

describe('map', () => {
  // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
  it('typescript', () => {
    const guard = map(string(), number())

    assertType<Equals<GuardType<typeof guard>, Map<string, number>>>(1)
  })

  describe('properties', () => {
    describe('with no settings', () => {
      const guard = map(string(), number())

      it('name', () => {
        expect(guard.name).toBe('map')
      })

      it('arguments', () => {
        expect(guard.arguments).toStrictEqual([string(), number(), {}])
      })

      it('type', () => {
        expect(guard.type).toStrictEqual(['object'])
      })
    })

    describe('size: 2', () => {
      const guard = map(string(), number(), { size: 2 })

      it('name', () => {
        expect(guard.name).toBe('map')
      })

      it('arguments', () => {
        expect(guard.arguments).toStrictEqual([string(), number(), { size: 2 }])
      })

      it('type', () => {
        expect(guard.type).toStrictEqual(['object'])
      })
    })

    describe("size: { parity: 'even' }", () => {
      const guard = map(string(), number(), { size: { parity: 'even' } })

      it('name', () => {
        expect(guard.name).toBe('map')
      })

      it('arguments', () => {
        expect(guard.arguments).toStrictEqual([string(), number(), { size: { parity: 'even' } }])
      })

      it('type', () => {
        expect(guard.type).toStrictEqual(['object'])
      })
    })

    describe("size: number({ parity: 'even' })", () => {
      const guard = map(string(), number(), { size: number({ parity: 'even' }) })

      it('name', () => {
        expect(guard.name).toBe('map')
      })

      it('arguments', () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.any
        expect(guard.arguments).toStrictEqual([string(), number(), { size: expect.any(Guard) }])
      })

      it('type', () => {
        expect(guard.type).toStrictEqual(['object'])
      })
    })
  })

  describe('validate & accept', () => {
    describe('any(), any()', () => {
      const guard = map(any(), any())

      const cases = [
        {
          input: new Map(),
          expectedInvalidations: [],
        },
        {
          input: new Map([
            [1, 2],
            [2, 3],
          ]),
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

    describe('any(), string()', () => {
      const guard = map(any(), string())

      const cases = [
        {
          input: new Map(),
          expectedInvalidations: [],
        },
        {
          input: new Map([
            [1, '2'],
            [2, '3'],
          ]),
          expectedInvalidations: [],
        },
        {
          input: new Map([
            [1, 2],
            [2, 3],
          ]),
          expectedInvalidations: [
            {
              rule: 'type',
              path: [1],
              setting: ['string'],
              actual: 'number',
            },
            {
              rule: 'type',
              path: [2],
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

    describe('string(), any()', () => {
      const guard = map(string(), any())

      const cases = [
        {
          input: new Map(),
          expectedInvalidations: [],
        },
        {
          input: new Map([
            ['1', 2],
            ['2', 3],
          ]),
          expectedInvalidations: [],
        },
        {
          input: new Map([
            [1, 2],
            [2, 3],
          ]),
          expectedInvalidations: [
            {
              rule: 'type',
              path: [],
              setting: ['string'],
              actual: 'number',
            },
            {
              rule: 'type',
              path: [],
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

    describe('string(), number(), { size: 2 }', () => {
      const guard = map(string(), number(), { size: 2 })

      const cases = [
        {
          input: new Map(),
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
          input: new Map([['1', 2]]),
          expectedInvalidations: [
            {
              actual: 1,
              function: 'equals',
              guard: 'literal',
              path: ['size'],
              rule: 'logical',
              setting: 2,
            },
          ],
        },
        {
          input: new Map([
            ['1', 2],
            ['2', 3],
          ]),
          expectedInvalidations: [],
        },
        {
          input: new Map([
            ['1', 2],
            ['2', 4],
            ['3', 6],
          ]),
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
  })

  describe('coerce', () => {
    it('any(), any()', () => {
      const guard = map(any(), any())
      const input = new Map([
        ['a', 1],
        ['b', 2],
      ])
      expect(guard.coerce(input, [])).toStrictEqual({ skipCoerce: true, value: input })
    })

    it('any(), boolean()', () => {
      const guard = map(any(), boolean())
      const input = new Map([
        ['a', true],
        ['b', false],
      ])
      expect(guard.coerce(input, [])).toStrictEqual({ skipCoerce: true, value: input })
    })

    it('string(), any()', () => {
      const guard = map(string(), any())
      const input = new Map([
        ['a', true],
        ['b', false],
      ])
      expect(guard.coerce(input, [])).toStrictEqual({ skipCoerce: true, value: input })
    })

    it("string({ casing: 'upperCase' }), any()", () => {
      const guard = map(string({ casing: 'upperCase' }), any())

      const input = new Map([
        ['A', 1],
        ['B', 2],
      ])

      expect(guard.coerce(input, [])).toStrictEqual({ skipCoerce: false, value: input })
    })

    it('string({ trim: true }), any()', () => {
      const guard = map(string({ trim: true }), any())

      const input = new Map([
        ['a', 1],
        ['a ', 2],
      ])

      const output = new Map([['a', 2]])

      expect(guard.coerce(input, [])).toStrictEqual({ skipCoerce: false, value: output })
    })

    it('any(), map(any(), any())', () => {
      const guard = map(any(), map(any(), any()))
      const input = new Map([['a', new Map([['a', true]])]])
      expect(guard.coerce(input, [])).toStrictEqual({ skipCoerce: true, value: input })
    })

    it('string(), number({ round: true })', () => {
      const guard = map(string(), number({ round: true }))

      const input = new Map([
        ['0', 0],
        ['1', 0.499],
        ['2', 0.5],
        ['3', 1],
        ['4', Number.NaN],
      ])

      const output = new Map([
        ['0', 0],
        ['1', 0],
        ['2', 1],
        ['3', 1],
        ['4', Number.NaN],
      ])

      expect(guard.coerce(input, [])).toStrictEqual({ skipCoerce: false, value: output })
    })

    it("string({ casing: 'lowerCase' }), number()", () => {
      const guard = map(string({ casing: 'lowerCase' }), number())

      const input = new Map([
        ['foo', 1],
        ['BAR', 2],
      ])

      const output = new Map([
        ['foo', 1],
        ['bar', 2],
      ])

      expect(guard.coerce(input, [])).toStrictEqual({ skipCoerce: false, value: output })
    })

    it("string({ casing: 'lowerCase' }), string({ casing: 'lowerCase' })", () => {
      const guard = map(string({ casing: 'lowerCase' }), string({ casing: 'lowerCase' }))

      const input = new Map([
        ['foo', 'foo'],
        ['bAr', 'bAr'],
        ['BAZ', 'BAZ'],
      ])

      const output = new Map([
        ['foo', 'foo'],
        ['bar', 'bar'],
        ['baz', 'baz'],
      ])

      expect(guard.coerce(input, [])).toStrictEqual({ skipCoerce: false, value: output })
    })

    it('invalid input, but coercing required', () => {
      const guard = map(string({ casing: 'lowerCase' }), string({ format: 'email' }))

      const input = [
        ['egon', 'egon@webnuts.com'],
        ['benny', 'benny@webnuts.com'],
        ['kjeld', '🤷‍♂️'],
      ]

      expect(guard.accept(input)).toBe(false)
      expect(guard.coerce(input, [])).toStrictEqual({ skipCoerce: false, value: input })
    })
  })

  describe('substitute', () => {
    it('should substitute keys', () => {
      const guard = map(string(), any())
      const manipulatedGuard = guard.substitute([], (_, innerGuard) => {
        // eslint-disable-next-line vitest/no-conditional-in-test -- test
        if (innerGuard.name === 'type' && innerGuard.type[0] === 'string') {
          return number()
        }
        return innerGuard
      })
      expect(manipulatedGuard).toBe(map(number(), any()))
    })

    it('should substitute values', () => {
      const guard = map(any(), string())
      const manipulatedGuard = guard.substitute([], (_, innerGuard) => {
        // eslint-disable-next-line vitest/no-conditional-in-test -- test
        if (innerGuard.name === 'type' && innerGuard.type[0] === 'string') {
          return number()
        }
        return innerGuard
      })
      expect(manipulatedGuard).toBe(map(any(), number()))
    })

    it('should substitute keys and values', () => {
      const guard = map(string(), string())
      const manipulatedGuard = guard.substitute([], (_, innerGuard) => {
        // eslint-disable-next-line vitest/no-conditional-in-test -- test
        if (innerGuard.name === 'type' && innerGuard.type[0] === 'string') {
          return number()
        }
        return innerGuard
      })
      expect(manipulatedGuard).toBe(map(number(), number()))
    })

    it('should substitute neiter key nor value', () => {
      const guard = map(number(), number())
      const manipulatedGuard = guard.substitute([], (_, innerGuard) => {
        // eslint-disable-next-line vitest/no-conditional-in-test -- test
        if (innerGuard.name === 'type' && innerGuard.type[0] === 'string') {
          return number()
        }
        return innerGuard
      })
      expect(manipulatedGuard).toBe(map(number(), number()))
    })
  })

  describe('convert', () => {
    const guard = map(string({ casing: 'lowerCase' }), number())

    it('should convert keys when guard accepts', () => {
      const input = new Map([['a', 1]])
      const output = new Map([['key-a', 1]])

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

    it('should convert values when guard accepts', () => {
      const input = new Map([
        ['a', 2.5],
        ['b', 9.3],
      ])
      const output = new Map([
        ['a', 3],
        ['b', 9],
      ])

      expect(
        guard.convert(input, undefined, [], (convertInput, _, innerGuard) => {
          // eslint-disable-next-line vitest/no-conditional-in-test -- test
          if (innerGuard.name === 'type' && innerGuard.type[0] === 'number') {
            return Math.round(convertInput as number)
          }

          return convertInput
        }),
      ).toStrictEqual(output)
    })

    it('should not convert anything, if no value is changed', () => {
      const input = new Map([
        ['a', 2.5],
        ['b', 9.3],
      ])

      expect(guard.convert(input, undefined, [], (convertInput) => convertInput)).toBe(input)
    })
  })

  describe('inspect', () => {
    it('should visit both keys and values', () => {
      const guard = map(string(), number())
      expect([
        ...guard.inspect([], function* (_, innerGuard) {
          yield `${innerGuard.name}-${innerGuard.type[0] as string}`
        }),
      ]).toStrictEqual(['map-object', 'type-string', 'type-number'])
    })
  })

  describe('scan', () => {
    it('should scan when guard accepts', () => {
      const guard = map(string(), number())
      const input = new Map([
        ['1', 1],
        ['2', 2],
      ])
      const output: unknown[] = []

      guard.scan(input, output, [], (scanningInput) => {
        output.push(scanningInput)
      })

      expect(output).toStrictEqual([input, '1', 1, '2', 2])
    })

    it('should throw AssertionError when guard does not accept', () => {
      const guard = map(string({ casing: 'lowerCase' }), number())
      const input = new Map([
        ['A', 1],
        ['B', 2],
      ])

      const invalidations: Invalidation[] = []
      guard.validate(input, [], invalidations)

      expect(guard.accept(input)).toBe(false)
      expect(invalidations.length).toBeGreaterThan(0)
    })

    it('should support circular references', () => {
      const guard = map(string(), any())
      // eslint-disable-next-line vitest/no-conditional-in-test -- test
      const circularGuard = guard.substitute([], (_, innerGuard) => (innerGuard.type[0] === 'any' ? guard : innerGuard))

      const input = new Map<string, unknown>([])
      input.set('a', input)

      const output: unknown[] = []

      circularGuard.scan(input, output, [], (scanningInput) => {
        output.push(scanningInput)
      })

      expect(output).toStrictEqual([input, 'a', input, 'a', input]) // todo is this correct?
    })
  })

  describe('toString', () => {
    it('any(), any()', () => {
      const guard = map(any(), any())
      expect(guard.toString()).toBe('Map<any, any>')
    })

    it('string(), number()', () => {
      const guard = map(string(), number())
      expect(guard.toString()).toBe('Map<string, number>')
    })
  })
})
