import { describe, it } from 'std/testing/bdd.ts'
import { expect } from 'std/expect/mod.ts'

import { any } from '../any.ts'
import { enums } from '../enums.ts'
import { assertType } from '../helpers.ts'
import { number } from '../number.ts'
import { object } from '../object.ts'
import { record } from '../record.ts'
import { string } from '../string.ts'
import { symbol } from '../symbol.ts'

import type { Invalidation } from '../errors.ts'
import type { GuardType } from '../guard.ts'
import type { Equals } from '../helpers.ts'

describe('record', () => {
  // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
  it('typescript', () => {
    const guard = record(string(), number())
    assertType<Equals<GuardType<typeof guard>, Record<string, number>>>(1)
  })

  describe('key/value must be type', () => {
    const validGuards = [any(), number(), string(), symbol()]
    const invalidKeyGuards = [record(any(), any()), object({ props: { a: any() } })]

    for (const validGuard of validGuards) {
      it(`key: ${validGuard}`, () => {
        expect(() => {
          record(validGuard, any())
        }).not.toThrow()
      })

      it(`value: ${validGuard}`, () => {
        expect(() => {
          record(any(), validGuard)
        }).not.toThrow()
      })
    }

    for (const invalidKeyGuard of invalidKeyGuards) {
      it(`invalid key: ${invalidKeyGuard}`, () => {
        expect(() => {
          record(invalidKeyGuard as never, any())
        }).toThrow('Type of key must be a number, string or symbol (or "any"), but got ["object"]')
      })

      it(`invalid value: ${invalidKeyGuard}`, () => {
        expect(() => {
          record(any(), invalidKeyGuard)
        }).not.toThrow()
      })
    }
  })

  describe('properties', () => {
    describe('with no settings', () => {
      const guard = record(string(), number())

      it('name', () => {
        expect(guard.name).toBe('record')
      })

      it('arguments', () => {
        expect(guard.arguments).toStrictEqual([string(), number()])
      })

      it('type', () => {
        expect(guard.type).toStrictEqual(['object'])
      })
    })
  })

  describe('validate & accept', () => {
    describe('string({ blank: false }), any()', () => {
      const guard = record(string({ blank: false }), any())

      const cases = [
        {
          input: {},
          expectedInvalidations: [],
        },
        {
          input: { '1': 1, '2': 2 },
          expectedInvalidations: [],
        },
        {
          input: { 1: 1, 2: 2 },
          expectedInvalidations: [],
        },
        {
          input: 1,
          expectedInvalidations: [
            {
              actual: 'number',
              path: [],
              rule: 'type',
              setting: ['object'],
            },
          ],
        },
        {
          input: new Map([
            ['1', 1],
            ['2', 2],
          ]),
          expectedInvalidations: [],
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

    describe('any(), string({ blank: false })', () => {
      const guard = record(any(), string({ blank: false }))

      const cases = [
        {
          input: {},
          expectedInvalidations: [],
        },
        {
          input: { '1': '1', '2': '2' },
          expectedInvalidations: [],
        },
        {
          input: { 1: '1', 2: '2' },
          expectedInvalidations: [],
        },
        {
          input: { 1: '' },
          expectedInvalidations: [
            {
              actual: '',
              function: 'blank',
              guard: 'string',
              path: ['1'],
              rule: 'logical',
              setting: false,
            },
          ],
        },
        {
          input: 1,
          expectedInvalidations: [
            {
              actual: 'number',
              path: [],
              rule: 'type',
              setting: ['object'],
            },
          ],
        },
        {
          input: new Map([
            ['1', 1],
            ['2', 2],
          ]),
          expectedInvalidations: [],
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

    describe('string(), number()', () => {
      const guard = record(string(), number())

      const cases = [
        {
          input: {},
          expectedInvalidations: [],
        },
        {
          input: { '1': 1, '2': 2 },
          expectedInvalidations: [],
        },
        {
          input: { 1: 1, 2: 2 },
          expectedInvalidations: [],
        },
        {
          input: { '1': '1', '2': '2' },
          expectedInvalidations: [
            {
              actual: 'string',
              path: ['1'],
              rule: 'type',
              setting: ['number'],
            },
            {
              actual: 'string',
              path: ['2'],
              rule: 'type',
              setting: ['number'],
            },
          ],
        },
        {
          input: 1,
          expectedInvalidations: [
            {
              actual: 'number',
              path: [],
              rule: 'type',
              setting: ['object'],
            },
          ],
        },
        {
          input: new Map([
            ['1', 1],
            ['2', 2],
          ]),
          expectedInvalidations: [],
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

    describe('symbol(), number({ precision: 0 })', () => {
      const fooSymbol = Symbol('foo')
      const barSymbol = Symbol('bar')
      const guard = record(symbol(), number({ precision: 0 }))

      const cases = [
        {
          input: {},
          expectedInvalidations: [],
        },
        {
          input: { [fooSymbol]: 1, [barSymbol]: 2 },
          expectedInvalidations: [],
        },
        {
          input: { [fooSymbol]: 1, a: 2 },
          expectedInvalidations: [
            {
              actual: 'string',
              path: [],
              rule: 'type',
              setting: ['symbol'],
            },
          ],
        },
        {
          input: { [fooSymbol]: 1, [barSymbol]: '2' },
          expectedInvalidations: [
            {
              actual: 'string',
              path: [barSymbol],
              rule: 'type',
              setting: ['number'],
            },
          ],
        },
        {
          input: 1,
          expectedInvalidations: [
            {
              actual: 'number',
              path: [],
              rule: 'type',
              setting: ['object'],
            },
          ],
        },
        {
          input: new Map([
            ['1', 1],
            ['2', 2],
          ]),
          expectedInvalidations: [],
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

    describe('symbol(), any()', () => {
      const fooSymbol = Symbol('foo')
      const barSymbol = Symbol('bar')
      const guard = record(symbol(), any())

      const cases = [
        {
          input: {},
          expectedInvalidations: [],
        },
        {
          input: { [fooSymbol]: 1, [barSymbol]: 2 },
          expectedInvalidations: [],
        },
        {
          input: { [fooSymbol]: 1, a: 2 },
          expectedInvalidations: [
            {
              actual: 'string',
              path: [],
              rule: 'type',
              setting: ['symbol'],
            },
          ],
        },
        {
          input: { [fooSymbol]: 1, [barSymbol]: '2' },
          expectedInvalidations: [],
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

    describe('enums([symbolA, symbolB]), any()', () => {
      const symbolA = Symbol('A')
      const symbolB = Symbol('B')
      const symbolC = Symbol('C')
      const guard = record(enums([symbolA, symbolB]), any())

      const cases = [
        {
          input: {},
          expectedInvalidations: [],
        },
        {
          input: { [symbolA]: 1, [symbolB]: 2 },
          expectedInvalidations: [],
        },
        {
          input: { [symbolC]: 1 },
          expectedInvalidations: [
            {
              actual: symbolC,
              function: 'equals',
              guard: 'literal',
              path: [],
              rule: 'logical',
              setting: symbolA,
            },
            {
              actual: symbolC,
              function: 'equals',
              guard: 'literal',
              path: [],
              rule: 'logical',
              setting: symbolB,
            },
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

    describe('any(), enums([symbolA, symbolB])', () => {
      const symbolA = Symbol('A')
      const symbolB = Symbol('B')
      const symbolC = Symbol('C')
      const guard = record(any(), enums([symbolA, symbolB]))

      const cases = [
        {
          input: {},
          expectedInvalidations: [],
        },
        {
          input: { 1: symbolA, 2: symbolB },
          expectedInvalidations: [],
        },
        {
          input: { 1: symbolC },
          expectedInvalidations: [
            {
              actual: symbolC,
              function: 'equals',
              guard: 'literal',
              path: ['1'],
              rule: 'logical',
              setting: symbolA,
            },
            {
              actual: symbolC,
              function: 'equals',
              guard: 'literal',
              path: ['1'],
              rule: 'logical',
              setting: symbolB,
            },
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

    describe('enums([symbolA, symbolB]), enums([symbolA, symbolB])', () => {
      const symbolA = Symbol('A')
      const symbolB = Symbol('B')
      const symbolC = Symbol('C')
      const guard = record(enums([symbolA, symbolB]), enums([symbolA, symbolB]))

      const cases = [
        {
          input: {},
          expectedInvalidations: [],
        },
        {
          input: { [symbolA]: symbolA, [symbolB]: symbolB },
          expectedInvalidations: [],
        },
        {
          input: { [symbolA]: symbolC },
          expectedInvalidations: [
            {
              actual: symbolC,
              function: 'equals',
              guard: 'literal',
              path: [symbolA],
              rule: 'logical',
              setting: symbolA,
            },
            {
              actual: symbolC,
              function: 'equals',
              guard: 'literal',
              path: [symbolA],
              rule: 'logical',
              setting: symbolB,
            },
          ],
        },
        {
          input: { [symbolC]: symbolA },
          expectedInvalidations: [
            {
              actual: symbolC,
              function: 'equals',
              guard: 'literal',
              path: [],
              rule: 'logical',
              setting: symbolA,
            },
            {
              actual: symbolC,
              function: 'equals',
              guard: 'literal',
              path: [],
              rule: 'logical',
              setting: symbolB,
            },
          ],
        },
        {
          input: { [symbolC]: symbolC },
          expectedInvalidations: [
            {
              actual: symbolC,
              function: 'equals',
              guard: 'literal',
              path: [],
              rule: 'logical',
              setting: symbolA,
            },
            {
              actual: symbolC,
              function: 'equals',
              guard: 'literal',
              path: [],
              rule: 'logical',
              setting: symbolB,
            },
            {
              actual: symbolC,
              function: 'equals',
              guard: 'literal',
              path: [symbolC],
              rule: 'logical',
              setting: symbolA,
            },
            {
              actual: symbolC,
              function: 'equals',
              guard: 'literal',
              path: [symbolC],
              rule: 'logical',
              setting: symbolB,
            },
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

    describe('any(), any()', () => {
      const guard = record(any(), any())

      const cases = [
        {
          input: {},
          expectedInvalidations: [],
        },
        {
          input: { [Symbol.iterator]: 1 },
          expectedInvalidations: [],
        },
        {
          input: { a: 1, 2: 2 },
          expectedInvalidations: [],
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

    describe('string({ blank: false }), any() - identical title???', () => {
      const guard = record(string({ blank: false }), any())

      const cases = [
        {
          input: {},
          expectedInvalidations: [],
        },
        {
          input: { a: { aa: 1 }, b: { bb: 1 } },
          expectedInvalidations: [],
        },
        {
          input: { '': { aa: 1 } },
          expectedInvalidations: [
            {
              actual: '',
              function: 'blank',
              guard: 'string',
              path: [],
              rule: 'logical',
              setting: false,
            },
          ],
        },
        {
          input: 1,
          expectedInvalidations: [
            {
              actual: 'number',
              path: [],
              rule: 'type',
              setting: ['object'],
            },
          ],
        },
        {
          input: new Map([
            ['1', 1],
            ['2', 2],
          ]),
          expectedInvalidations: [],
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
    it('string(), any()', () => {
      const guard = record(string(), any())
      const input = { a: true, b: false }
      expect(guard.coerce(input, [])).toStrictEqual({ skipCoerce: true, value: input })
    })

    it("string({ casing: 'upperCase' }), any()", () => {
      const guard = record(string({ casing: 'upperCase' }), any())
      const input = { A: 1, B: 2 }
      expect(guard.coerce(input, [])).toStrictEqual({ skipCoerce: false, value: input })
    })

    it('string({ trim: true }), any()', () => {
      const guard = record(string({ trim: true }), any())
      const input = { a: 1, 'a ': 2 }
      const output = { a: 2 }

      // eslint-disable-next-line vitest/prefer-strict-equal -- some undefined property is part of result
      expect(guard.coerce(input, [])).toEqual({ value: output, skipCoerce: false })
    })

    it('string(), number({ round: true })', () => {
      const guard = record(string(), number({ round: true }))

      const input = {
        '0': 0,
        '1': 0.499,
        '2': 0.5,
        '3': 1,
        '4': Number.NaN,
      }

      const output = {
        '0': 0,
        '1': 0,
        '2': 1,
        '3': 1,
        '4': Number.NaN,
      }

      expect(guard.coerce(input, [])).toMatchObject({ skipCoerce: false, value: output })
    })

    it("string({ casing: 'lowerCase' }), number()", () => {
      const guard = record(string({ casing: 'lowerCase' }), number())
      const input = { foo: 1, BAR: 2 }
      const output = { foo: 1, bar: 2 }
      expect(guard.coerce(input, [])).toMatchObject({ skipCoerce: false, value: output })
    })

    it("string({ casing: 'lowerCase' }), string({ casing: 'lowerCase' })", () => {
      const guard = record(string({ casing: 'lowerCase' }), string({ casing: 'lowerCase' }))
      const input = { foo: 'foo', bAr: 'bAr', BAZ: 'BAZ' }
      const output = { foo: 'foo', bar: 'bar', baz: 'baz' }
      expect(guard.coerce(input, [])).toMatchObject({ skipCoerce: false, value: output })
    })

    it('invalid input, but coercing required', () => {
      const guard = record(string({ casing: 'lowerCase' }), string({ format: 'email' }))

      const input = [
        ['egon', 'egon@webnuts.com'],
        ['benny', 'benny@webnuts.com'],
        ['kjeld', '🤷‍♂️'],
      ]

      expect(guard.accept(input)).toBe(false)
      expect(guard.coerce(input, [])).toMatchObject({ skipCoerce: false, value: input })
    })
  })

  describe('substitute', () => {
    it('should substitute keys', () => {
      const guard = record(string(), any())
      const manipulatedGuard = guard.substitute([], (_, innerGuard) => {
        // eslint-disable-next-line vitest/no-conditional-in-test -- test
        if (innerGuard.name === 'type' && innerGuard.type[0] === 'string') {
          return string({ blank: false })
        }
        return innerGuard
      })

      expect(manipulatedGuard.equals(record(string({ blank: false }), any()))).toBe(true)
    })

    it('should substitute values', () => {
      const guard = record(string(), number())
      const manipulatedGuard = guard.substitute([], (_, innerGuard) => {
        // eslint-disable-next-line vitest/no-conditional-in-test -- test
        if (innerGuard.name === 'type' && innerGuard.type[0] === 'number') {
          return number({ round: true })
        }
        return innerGuard
      })

      expect(manipulatedGuard.equals(record(string(), number({ round: true })))).toBe(true)
    })

    it('should substitute keys and values', () => {
      const guard = record(string(), string())
      const manipulatedGuard = guard.substitute([], (_, innerGuard) => {
        // eslint-disable-next-line vitest/no-conditional-in-test -- test
        if (innerGuard.name === 'type' && innerGuard.type[0] === 'string') {
          return string({ blank: false })
        }
        return innerGuard
      })
      expect(manipulatedGuard.equals(record(string({ blank: false }), string({ blank: false })))).toBe(true)
    })

    it('should substitute neiter key nor value', () => {
      const guard = record(string(), string())
      const manipulatedGuard = guard.substitute([], (_, innerGuard) => innerGuard)
      expect(manipulatedGuard.equals(record(string(), string()))).toBe(true)
    })
  })

  describe('convert', () => {
    const guard = record(string({ casing: 'lowerCase' }), number())

    it('should convert keys when guard accepts', () => {
      const input = { a: 1 }
      const output = { 'key-a': 1 }

      expect(
        guard.convert(input, undefined, [], (convertInput, _, innerGuard) => {
          // eslint-disable-next-line vitest/no-conditional-in-test -- test
          if (innerGuard.name === 'string' && innerGuard.type[0] === 'string') {
            return `key-${convertInput as string}`
          }

          return convertInput
        }),
      ).toMatchObject(output)
    })

    it('should convert values when guard accepts', () => {
      const input = { a: 2.5, b: 9.3 }
      const output = { a: 3, b: 9 }

      expect(
        guard.convert(input, undefined, [], (convertInput, _, innerGuard) => {
          // eslint-disable-next-line vitest/no-conditional-in-test -- test
          if (innerGuard.name === 'type' && innerGuard.type[0] === 'number') {
            return Math.round(convertInput as number)
          }

          return convertInput
        }),
      ).toMatchObject(output)
    })

    it('should not convert anything, if no value is changed', () => {
      const input = { a: 2.5, b: 9.3 }
      expect(guard.convert(input, undefined, [], (convertInput) => convertInput)).toBe(input)
    })
  })

  describe('inspect', () => {
    it('should visit both keys and values', () => {
      const guard = record(string(), number())
      expect([
        ...guard.inspect([], function* (_, innerGuard) {
          yield `${innerGuard.name}-${innerGuard.type[0] as string}`
        }),
      ]).toStrictEqual(['record-object', 'type-string', 'type-number'])
    })
  })

  describe('scan', () => {
    it('should scan when guard accepts', () => {
      const guard = record(string(), number())
      const input = { '1': 1, '2': 2 }
      const output: unknown[] = []

      guard.scan(input, output, [], (scanningInput, _path, _guard, scanningOutput) => {
        scanningOutput.push(scanningInput)
      })

      expect(output).toStrictEqual([input, '1', 1, '2', 2])
    })

    it('should throw AssertionError when guard does not accept', () => {
      const guard = record(string({ casing: 'lowerCase' }), number())
      const input = { A: 1, B: 2 }

      const invalidations: Invalidation[] = []
      guard.validate(input, [], invalidations)

      expect(guard.accept(input)).toBe(false)
      expect(invalidations.length).toBeGreaterThan(0)
    })
  })

  it('toString', () => {
    const guard = record(string(), number())
    expect(guard.toString()).toBe('Record<string, number>')
  })
})
