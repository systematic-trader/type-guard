import { describe, it } from 'std/testing/bdd.ts'
import { expect } from 'std/expect/mod.ts'

import { Guard } from '../guard.ts'
import { assertType } from '../helpers.ts'
import { integer } from '../integer.ts'
import { number } from '../number.ts'
import { endsWith, format, pattern, startsWith, string } from '../string.ts'

import type { Invalidation } from '../errors.ts'
import type { GuardType } from '../guard.ts'
import type { Equals } from '../helpers.ts'
import type { StringGuardSettings } from '../string.ts'

describe('string', () => {
  // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
  it('typescript', () => {
    const guard = string()
    assertType<Equals<GuardType<typeof guard>, string>>(1)
  })

  describe('properties', () => {
    describe('with no settings', () => {
      const guard = string()

      it('name', () => {
        expect(guard.name).toBe('type')
      })

      it('arguments', () => {
        expect(guard.arguments).toStrictEqual([['string']])
      })

      it('type', () => {
        expect(guard.type).toStrictEqual(['string'])
      })
    })

    describe('with some settings', () => {
      const guard = string({ blank: false })

      it('name', () => {
        expect(guard.name).toBe('string')
      })

      it('arguments', () => {
        expect(guard.arguments).toStrictEqual([{ blank: false }])
      })

      it('type', () => {
        expect(guard.type).toStrictEqual(['string'])
      })
    })
  })

  describe('validate & accept', () => {
    describe('{}', () => {
      const guard = string({})

      const cases = [
        {
          input: 'foo',
          expectedInvalidations: [],
        },
        {
          input: 'foobar',
          expectedInvalidations: [],
        },
        {
          input: '2',
          expectedInvalidations: [],
        },
        {
          input: 2,
          expectedInvalidations: [{ actual: 'number', path: [], rule: 'type', setting: ['string'] }],
        },
        {
          input: () => undefined,
          expectedInvalidations: [{ actual: 'function', path: [], rule: 'type', setting: ['string'] }],
        },
      ] as const

      for (const { input, expectedInvalidations } of cases) {
        it(`${input}`, () => {
          const invalidations: Invalidation[] = []
          expect(guard.validate(input, [], invalidations)).toStrictEqual(expectedInvalidations.length === 0)
          expect(guard.accept(input)).toBe(expectedInvalidations.length === 0)
          expect(invalidations).toStrictEqual(expectedInvalidations)
        })
      }
    })

    // this test is a bit vague, since we don't yet have a complete interface
    describe("format: 'email'", () => {
      const guard = string({ format: 'email' })

      const cases = [
        {
          input: 'foo@bar.com',
          expectedInvalidations: [],
        },
        {
          input: 'no way',
          expectedInvalidations: [
            { actual: 'no way', guard: 'string', path: [], rule: 'logical', setting: 'email', function: 'format' },
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

    describe("format: 'base64'", () => {
      const guard = string({ format: 'base64' })

      const cases = [
        {
          input: 'Zm9v',
          expectedInvalidations: [],
        },
        {
          input: '🤖',
          expectedInvalidations: [
            { actual: '🤖', guard: 'string', path: [], rule: 'logical', setting: 'base64', function: 'format' },
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

    describe("format: 'camelcase'", () => {
      const guard = string({ format: 'camelcase' })

      const cases = [
        {
          input: 'foo',
          expectedInvalidations: [],
        },
        {
          input: 'fooBar',
          expectedInvalidations: [],
        },
        {
          input: 'Foo',
          expectedInvalidations: [
            { actual: 'Foo', guard: 'string', path: [], rule: 'logical', setting: 'camelcase', function: 'format' },
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

    describe("format: 'date-iso8601'", () => {
      const guard = string({ format: 'date-iso8601' })

      const cases = [
        {
          input: '2021-11-08T13:31:01.706Z',
          expectedInvalidations: [],
        },
        {
          input: '2000-01-01T00:00:00.000Z',
          expectedInvalidations: [],
        },
        {
          input: '2000-01-01T00:00:00.000S',
          expectedInvalidations: [
            {
              actual: '2000-01-01T00:00:00.000S',
              guard: 'string',
              path: [],
              rule: 'logical',
              setting: 'date-iso8601',
              function: 'format',
            },
          ],
        },
        {
          input: 'foo',
          expectedInvalidations: [
            { actual: 'foo', guard: 'string', path: [], rule: 'logical', setting: 'date-iso8601', function: 'format' },
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

    describe("format: 'gregorian-date'", () => {
      const guard = string({ format: 'gregorian-date' })

      const cases = [
        {
          input: '2021-11-08',
          expectedInvalidations: [],
        },
        {
          input: '2000-01-01',
          expectedInvalidations: [],
        },
        {
          input: '2000-01-00',
          expectedInvalidations: [
            {
              actual: '2000-01-00',
              guard: 'string',
              path: [],
              rule: 'logical',
              setting: 'gregorian-date',
              function: 'format',
            },
          ],
        },
        {
          input: 'foo',
          expectedInvalidations: [
            {
              actual: 'foo',
              guard: 'string',
              path: [],
              rule: 'logical',
              setting: 'gregorian-date',
              function: 'format',
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

    describe("format: 'gregorian-year'", () => {
      const guard = string({ format: 'gregorian-year' })

      const cases = [
        {
          input: '2021',
          expectedInvalidations: [],
        },
        {
          input: '2000',
          expectedInvalidations: [],
        },
        {
          input: '20000',
          expectedInvalidations: [
            {
              actual: '20000',
              guard: 'string',
              path: [],
              rule: 'logical',
              setting: 'gregorian-year',
              function: 'format',
            },
          ],
        },
        {
          input: '200',
          expectedInvalidations: [
            {
              actual: '200',
              guard: 'string',
              path: [],
              rule: 'logical',
              setting: 'gregorian-year',
              function: 'format',
            },
          ],
        },
        {
          input: 'foo',
          expectedInvalidations: [
            {
              actual: 'foo',
              guard: 'string',
              path: [],
              rule: 'logical',
              setting: 'gregorian-year',
              function: 'format',
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

    describe("format: 'integer'", () => {
      const guard = string({ format: 'integer' })

      const cases = [
        {
          input: '1',
          expectedInvalidations: [],
        },
        {
          input: '15',
          expectedInvalidations: [],
        },
        {
          input: '-3',
          expectedInvalidations: [],
        },
        {
          input: '3e+10',
          expectedInvalidations: [],
        },
        {
          input: '15.3',
          expectedInvalidations: [
            { actual: '15.3', guard: 'string', path: [], rule: 'logical', setting: 'integer', function: 'format' },
          ],
        },
        {
          input: '-3.6',
          expectedInvalidations: [
            { actual: '-3.6', guard: 'string', path: [], rule: 'logical', setting: 'integer', function: 'format' },
          ],
        },
        {
          input: 'foo',
          expectedInvalidations: [
            { actual: 'foo', guard: 'string', path: [], rule: 'logical', setting: 'integer', function: 'format' },
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

    describe("format: 'non-negative-integer'", () => {
      const guard = string({ format: 'non-negative-integer' })

      const cases = [
        {
          input: '1',
          expectedInvalidations: [],
        },
        {
          input: '15',
          expectedInvalidations: [],
        },
        {
          input: '-3',
          expectedInvalidations: [
            {
              actual: '-3',
              guard: 'string',
              path: [],
              rule: 'logical',
              setting: 'non-negative-integer',
              function: 'format',
            },
          ],
        },
        {
          input: '3e10',
          expectedInvalidations: [],
        },
        {
          input: '15.3',
          expectedInvalidations: [
            {
              actual: '15.3',
              guard: 'string',
              path: [],
              rule: 'logical',
              setting: 'non-negative-integer',
              function: 'format',
            },
          ],
        },
        {
          input: '-3.6',
          expectedInvalidations: [
            {
              actual: '-3.6',
              guard: 'string',
              path: [],
              rule: 'logical',
              setting: 'non-negative-integer',
              function: 'format',
            },
          ],
        },
        {
          input: 'foo',
          expectedInvalidations: [
            {
              actual: 'foo',
              guard: 'string',
              path: [],
              rule: 'logical',
              setting: 'non-negative-integer',
              function: 'format',
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

    describe("format: 'kebabcase'", () => {
      const guard = string({ format: 'kebabcase' })

      const cases = [
        {
          input: 'foo',
          expectedInvalidations: [],
        },
        {
          input: 'foo-bar',
          expectedInvalidations: [],
        },
        {
          input: 'foo-Bar',
          expectedInvalidations: [
            { actual: 'foo-Bar', guard: 'string', path: [], rule: 'logical', setting: 'kebabcase', function: 'format' },
          ],
        },
        {
          input: 'Foo-bar',
          expectedInvalidations: [
            { actual: 'Foo-bar', guard: 'string', path: [], rule: 'logical', setting: 'kebabcase', function: 'format' },
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

    describe("format: 'number'", () => {
      const guard = string({ format: 'number' })

      const cases = [
        {
          input: '1',
          expectedInvalidations: [],
        },
        {
          input: '0',
          expectedInvalidations: [],
        },
        {
          input: '-1',
          expectedInvalidations: [],
        },
        {
          input: '1.5',
          expectedInvalidations: [],
        },
        {
          input: '0.5',
          expectedInvalidations: [],
        },
        {
          input: '-1.5',
          expectedInvalidations: [],
        },
        {
          input: 'foo',
          expectedInvalidations: [
            { actual: 'foo', guard: 'string', path: [], rule: 'logical', setting: 'number', function: 'format' },
          ],
        },
        {
          input: '3e10',
          expectedInvalidations: [],
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

    describe("format: 'pascalcase'", () => {
      const guard = string({ format: 'pascalcase' })

      const cases = [
        {
          input: 'Foo',
          expectedInvalidations: [],
        },
        {
          input: 'FooBar',
          expectedInvalidations: [],
        },
        {
          input: 'foo',
          expectedInvalidations: [
            { actual: 'foo', guard: 'string', path: [], rule: 'logical', setting: 'pascalcase', function: 'format' },
          ],
        },
        {
          input: 'fooBar',
          expectedInvalidations: [
            { actual: 'fooBar', guard: 'string', path: [], rule: 'logical', setting: 'pascalcase', function: 'format' },
          ],
        },
        {
          input: 'Foo-Bar',
          expectedInvalidations: [
            {
              actual: 'Foo-Bar',
              guard: 'string',
              path: [],
              rule: 'logical',
              setting: 'pascalcase',
              function: 'format',
            },
          ],
        },
        {
          input: '10',
          expectedInvalidations: [
            { actual: '10', guard: 'string', path: [], rule: 'logical', setting: 'pascalcase', function: 'format' },
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

    describe("format: 'snakecase'", () => {
      const guard = string({ format: 'snakecase' })

      const cases = [
        {
          input: 'foo',
          expectedInvalidations: [],
        },
        {
          input: 'foo_bar',
          expectedInvalidations: [],
        },
        {
          input: 'foo_______bar',
          expectedInvalidations: [],
        },
        {
          input: 'fooBar',
          expectedInvalidations: [
            { actual: 'fooBar', guard: 'string', path: [], rule: 'logical', setting: 'snakecase', function: 'format' },
          ],
        },
        {
          input: 'Foo-Bar',
          expectedInvalidations: [
            { actual: 'Foo-Bar', guard: 'string', path: [], rule: 'logical', setting: 'snakecase', function: 'format' },
          ],
        },
        {
          input: '10',
          expectedInvalidations: [
            { actual: '10', guard: 'string', path: [], rule: 'logical', setting: 'snakecase', function: 'format' },
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

    describe("format: 'time12h'", () => {
      const guard = string({ format: 'time12h' })

      const cases = [
        {
          input: '10:00am',
          expectedInvalidations: [],
        },
        {
          input: '10:00pm',
          expectedInvalidations: [],
        },
        {
          input: '11:00',
          expectedInvalidations: [
            { actual: '11:00', guard: 'string', path: [], rule: 'logical', setting: 'time12h', function: 'format' },
          ],
        },
        {
          input: '13:00am',
          expectedInvalidations: [
            { actual: '13:00am', guard: 'string', path: [], rule: 'logical', setting: 'time12h', function: 'format' },
          ],
        },
        {
          input: '14.35pm',
          expectedInvalidations: [
            { actual: '14.35pm', guard: 'string', path: [], rule: 'logical', setting: 'time12h', function: 'format' },
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

    describe("format: 'time24h-full'", () => {
      const guard = string({ format: 'time24h-full' })

      const cases = [
        {
          input: '10:00:00',
          expectedInvalidations: [],
        },
        {
          input: '22:00:00',
          expectedInvalidations: [],
        },
        {
          input: '10:30:00',
          expectedInvalidations: [],
        },
        {
          input: '22:30:00',
          expectedInvalidations: [],
        },
        {
          input: '10:30:45',
          expectedInvalidations: [],
        },
        {
          input: '22:30:45',
          expectedInvalidations: [],
        },
        {
          input: '11:69:00',
          expectedInvalidations: [
            {
              actual: '11:69:00',
              guard: 'string',
              path: [],
              rule: 'logical',
              setting: 'time24h-full',
              function: 'format',
            },
          ],
        },
        {
          input: '25:10:00',
          expectedInvalidations: [
            {
              actual: '25:10:00',
              guard: 'string',
              path: [],
              rule: 'logical',
              setting: 'time24h-full',
              function: 'format',
            },
          ],
        },
        {
          input: '10:00:60',
          expectedInvalidations: [
            {
              actual: '10:00:60',
              guard: 'string',
              path: [],
              rule: 'logical',
              setting: 'time24h-full',
              function: 'format',
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

    describe("format: 'uuid'", () => {
      const guard = string({ format: 'uuid' })

      const cases = [
        {
          input: '544a97c6-4133-11ec-973a-0242ac130003',
          expectedInvalidations: [],
        },
        {
          input: '5adde58e-4133-11ec-973a-0242ac130003',
          expectedInvalidations: [],
        },
        {
          input: '5øvøv58e-4133-11ec-973a-0242ac130003',
          expectedInvalidations: [
            {
              actual: '5øvøv58e-4133-11ec-973a-0242ac130003',
              guard: 'string',
              path: [],
              rule: 'logical',
              setting: 'uuid',
              function: 'format',
            },
          ],
        },
        {
          input: 'foo-bar-123',
          expectedInvalidations: [
            { actual: 'foo-bar-123', guard: 'string', path: [], rule: 'logical', setting: 'uuid', function: 'format' },
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

    describe('blank: false', () => {
      const guard = string({ blank: false })

      const cases = [
        {
          input: 'foo bar',
          expectedInvalidations: [],
        },
        {
          input: ' foo bar',
          expectedInvalidations: [],
        },
        {
          input: 'foo bar ',
          expectedInvalidations: [],
        },
        {
          input: ' ',
          expectedInvalidations: [
            { actual: ' ', guard: 'string', path: [], rule: 'logical', setting: false, function: 'blank' },
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

    describe("startsWith: 'foo'", () => {
      const guard = string({ startsWith: 'foo' })

      const cases = [
        {
          input: 'foo',
          expectedInvalidations: [],
        },
        {
          input: 'foobar',
          expectedInvalidations: [],
        },
        {
          input: 'foo bar',
          expectedInvalidations: [],
        },
        {
          input: 'Foo',
          expectedInvalidations: [
            { actual: 'Foo', guard: 'string', path: [], rule: 'logical', setting: 'foo', function: 'startsWith' },
          ],
        },
        {
          input: 'fOo',
          expectedInvalidations: [
            { actual: 'fOo', guard: 'string', path: [], rule: 'logical', setting: 'foo', function: 'startsWith' },
          ],
        },
        {
          input: ' foo',
          expectedInvalidations: [
            { actual: ' foo', guard: 'string', path: [], rule: 'logical', setting: 'foo', function: 'startsWith' },
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

    describe("endsWith: 'bar'", () => {
      const guard = string({ endsWith: 'bar' })

      const cases = [
        {
          input: 'bar',
          expectedInvalidations: [],
        },
        {
          input: 'foobar',
          expectedInvalidations: [],
        },
        {
          input: 'foo bar',
          expectedInvalidations: [],
        },
        {
          input: 'baR',
          expectedInvalidations: [
            { actual: 'baR', guard: 'string', path: [], rule: 'logical', setting: 'bar', function: 'endsWith' },
          ],
        },
        {
          input: 'bAr',
          expectedInvalidations: [
            { actual: 'bAr', guard: 'string', path: [], rule: 'logical', setting: 'bar', function: 'endsWith' },
          ],
        },
        {
          input: 'bar ',
          expectedInvalidations: [
            { actual: 'bar ', guard: 'string', path: [], rule: 'logical', setting: 'bar', function: 'endsWith' },
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

    describe("maximum: 'b'", () => {
      const guard = string({ maximum: 'b' })

      const cases = [
        {
          input: 'a',
          expectedInvalidations: [],
        },
        {
          input: 'b',
          expectedInvalidations: [],
        },
        {
          input: 'c',
          expectedInvalidations: [
            { actual: 'c', guard: 'string', path: [], rule: 'logical', setting: 'b', function: 'maximum' },
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

    describe("minimum: 'b'", () => {
      const guard = string({ minimum: 'b' })

      const cases = [
        {
          input: 'a',
          expectedInvalidations: [
            { actual: 'a', guard: 'string', path: [], rule: 'logical', setting: 'b', function: 'minimum' },
          ],
        },
        {
          input: 'b',
          expectedInvalidations: [],
        },
        {
          input: 'c',
          expectedInvalidations: [],
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

    describe("exclusiveMaximum: 'b'", () => {
      const guard = string({ exclusiveMaximum: 'b' })

      const cases = [
        {
          input: 'a',
          expectedInvalidations: [],
        },
        {
          input: 'b',
          expectedInvalidations: [
            { actual: 'b', guard: 'string', path: [], rule: 'logical', setting: 'b', function: 'exclusiveMaximum' },
          ],
        },
        {
          input: 'c',
          expectedInvalidations: [
            { actual: 'c', guard: 'string', path: [], rule: 'logical', setting: 'b', function: 'exclusiveMaximum' },
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

    describe("exclusiveMinimum: 'b'", () => {
      const guard = string({ exclusiveMinimum: 'b' })

      const cases = [
        {
          input: 'a',
          expectedInvalidations: [
            { actual: 'a', guard: 'string', path: [], rule: 'logical', setting: 'b', function: 'exclusiveMinimum' },
          ],
        },
        {
          input: 'b',
          expectedInvalidations: [
            { actual: 'b', guard: 'string', path: [], rule: 'logical', setting: 'b', function: 'exclusiveMinimum' },
          ],
        },
        {
          input: 'c',
          expectedInvalidations: [],
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

    describe('length: 2', () => {
      const guard = string({ length: 2 })

      const cases = [
        {
          input: 'a',
          expectedInvalidations: [
            { actual: 1, guard: 'literal', path: ['length'], rule: 'logical', setting: 2, function: 'equals' },
          ],
        },
        {
          input: 'aa',
          expectedInvalidations: [],
        },
        {
          input: 'aaa',
          expectedInvalidations: [
            { actual: 3, guard: 'literal', path: ['length'], rule: 'logical', setting: 2, function: 'equals' },
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

    describe('length: { minimum: 2 }', () => {
      const guard = string({ length: { minimum: 2 } })

      const cases = [
        {
          input: 'a',
          expectedInvalidations: [
            { actual: 1, guard: 'number', path: ['length'], rule: 'logical', setting: 2, function: 'minimum' },
          ],
        },
        {
          input: 'aa',
          expectedInvalidations: [],
        },
        {
          input: 'aaa',
          expectedInvalidations: [],
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

    describe('length: number({ minimum: 2 })', () => {
      const guard = string({ length: number({ minimum: 2 }) })

      const cases = [
        {
          input: 'a',
          expectedInvalidations: [
            { actual: 1, guard: 'number', path: ['length'], rule: 'logical', setting: 2, function: 'minimum' },
          ],
        },
        {
          input: 'aa',
          expectedInvalidations: [],
        },
        {
          input: 'aaa',
          expectedInvalidations: [],
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

    describe('length: { maximum: 2 }', () => {
      const guard = string({ length: { maximum: 2 } })

      const cases = [
        {
          input: 'a',
          expectedInvalidations: [],
        },
        {
          input: 'aa',
          expectedInvalidations: [],
        },
        {
          input: 'aaa',
          expectedInvalidations: [
            { actual: 3, guard: 'number', path: ['length'], rule: 'logical', setting: 2, function: 'maximum' },
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

    describe("pattern: 'foo.*'", () => {
      const guard = string({ pattern: 'foo.*' })

      const cases = [
        {
          input: 'foo',
          expectedInvalidations: [],
        },
        {
          input: 'foobar',
          expectedInvalidations: [],
        },
        {
          input: 'barfoo',
          expectedInvalidations: [],
        },
        {
          input: 'FOOBAR',
          expectedInvalidations: [
            { actual: 'FOOBAR', guard: 'string', path: [], rule: 'logical', setting: 'foo.*', function: 'pattern' },
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

    describe('pattern: /foo.*/g', () => {
      const guard = string({ pattern: /foo.*/g })

      const cases = [
        {
          input: 'foo',
          expectedInvalidations: [],
        },
        {
          input: 'foobar',
          expectedInvalidations: [],
        },
        {
          input: 'barfoo',
          expectedInvalidations: [],
        },
        {
          input: 'FOOBAR',
          expectedInvalidations: [
            { actual: 'FOOBAR', guard: 'string', path: [], rule: 'logical', setting: '/foo.*/g', function: 'pattern' },
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

    describe("casing: 'lowerCase'", () => {
      const guard = string({ casing: 'lowerCase' })

      const cases = [
        {
          input: 'foo',
          expectedInvalidations: [],
        },
        {
          input: 'foo-bar',
          expectedInvalidations: [],
        },
        {
          input: 'foo bar',
          expectedInvalidations: [],
        },
        {
          input: 'foobAr',
          expectedInvalidations: [
            { actual: 'foobAr', guard: 'string', path: [], rule: 'logical', setting: 'lowerCase', function: 'casing' },
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

    describe("casing: 'upperCase'", () => {
      const guard = string({ casing: 'upperCase' })

      const cases = [
        {
          input: 'FOO',
          expectedInvalidations: [],
        },
        {
          input: 'FOO-BAR',
          expectedInvalidations: [],
        },
        {
          input: 'FOO BAR',
          expectedInvalidations: [],
        },
        {
          input: 'FOOBaR',
          expectedInvalidations: [
            { actual: 'FOOBaR', guard: 'string', path: [], rule: 'logical', setting: 'upperCase', function: 'casing' },
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

    describe("casing: 'localeLowerCase'", () => {
      const guard = string({ casing: 'localeLowerCase' })

      const cases = [
        {
          input: 'foo',
          expectedInvalidations: [],
        },
        {
          input: 'foo-bar',
          expectedInvalidations: [],
        },
        {
          input: 'foo bar',
          expectedInvalidations: [],
        },
        {
          input: 'foobAr',
          expectedInvalidations: [
            {
              actual: 'foobAr',
              guard: 'string',
              path: [],
              rule: 'logical',
              setting: 'localeLowerCase',
              function: 'casing',
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

    describe("casing: 'localeUpperCase'", () => {
      const guard = string({ casing: 'localeUpperCase' })

      const cases = [
        {
          input: 'FOO',
          expectedInvalidations: [],
        },
        {
          input: 'FOO-BAR',
          expectedInvalidations: [],
        },
        {
          input: 'FOO BAR',
          expectedInvalidations: [],
        },
        {
          input: 'FOOBaR',
          expectedInvalidations: [
            {
              actual: 'FOOBaR',
              guard: 'string',
              path: [],
              rule: 'logical',
              setting: 'localeUpperCase',
              function: 'casing',
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

  it('convert', () => {
    const guard = string()
    expect(guard.convert).toBe(Guard.prototype.convert)
  })

  it('exclude', () => {
    const guard = string()
    expect(guard.exclude).toBe(Guard.prototype.exclude)
  })

  it('extract', () => {
    const guard = string()
    expect(guard.extract).toBe(Guard.prototype.extract)
  })

  it('inspect', () => {
    const guard = string()
    expect(guard.inspect).toBe(Guard.prototype.inspect)
  })

  it('scan', () => {
    const guard = string()
    expect(guard.scan).toBe(Guard.prototype.scan)
  })

  it('substitute', () => {
    const guard = string()
    expect(guard.substitute).toBe(Guard.prototype.substitute)
  })

  describe('format', () => {
    const cases = [
      'base64',
      'camelcase',
      'date-iso8601',
      'email',
      'gregorian-date',
      'gregorian-year',
      'integer',
      'non-negative-integer',
      'kebabcase',
      'number',
      'pascalcase',
      'snakecase',
      'time12h',
      'time24h',
      'time24h-full',
      'uuid',
    ] as const

    for (const name of cases) {
      it(name, () => {
        const formatGuard = format(name)
        const expected = string({ format: name })

        expect(formatGuard.arguments).toStrictEqual(expected.arguments)
      })
    }
  })

  describe('coerce', () => {
    describe('coercion not required', () => {
      const cases: ReadonlyArray<{ settings: StringGuardSettings; input: unknown; output: unknown }> = [
        {
          settings: {},
          input: '',
          output: { skipCoerce: true, value: '' },
        },
        {
          settings: { blank: true },
          input: '',
          output: { skipCoerce: true, value: '' },
        },
        {
          settings: { endsWith: 'foo' },
          input: '',
          output: { skipCoerce: true, value: '' },
        },
        {
          settings: { exclusiveMaximum: 'foo' },
          input: '',
          output: { skipCoerce: true, value: '' },
        },
        {
          settings: { exclusiveMinimum: 'foo' },
          input: '',
          output: { skipCoerce: true, value: '' },
        },
        {
          settings: { format: 'email' },
          input: '',
          output: { skipCoerce: true, value: '' },
        },
        {
          settings: { length: 5 },
          input: '',
          output: { skipCoerce: true, value: '' },
        },
        {
          settings: { maximum: 'foo' },
          input: '',
          output: { skipCoerce: true, value: '' },
        },
        {
          settings: { minimum: 'foo' },
          input: '',
          output: { skipCoerce: true, value: '' },
        },
        {
          settings: { pattern: /\n/g },
          input: '',
          output: { skipCoerce: true, value: '' },
        },
        {
          settings: { pattern: 'foo' },
          input: '',
          output: { skipCoerce: true, value: '' },
        },
        {
          settings: { startsWith: 'foo' },
          input: '',
          output: { skipCoerce: true, value: '' },
        },
      ]

      for (const { settings, input, output } of cases) {
        it(`${JSON.stringify(settings)} ${input}`, () => {
          const guard = string(settings)
          expect(guard.coerce(input, [])).toStrictEqual(output)
        })
      }
    })

    describe('coercion required', () => {
      const cases: ReadonlyArray<{ settings: StringGuardSettings; input: unknown; output: unknown }> = [
        {
          settings: { casing: 'lowerCase' },
          input: 'A',
          output: { skipCoerce: false, value: 'a' },
        },
        {
          settings: { casing: 'upperCase' },
          input: 'a',
          output: { skipCoerce: false, value: 'A' },
        },
        {
          settings: { casing: 'localeLowerCase' },
          input: 'A',
          output: { skipCoerce: false, value: 'a' },
        },
        {
          settings: { casing: 'localeUpperCase' },
          input: 'a',
          output: { skipCoerce: false, value: 'A' },
        },
        {
          settings: { trim: true },
          input: ' a ',
          output: { skipCoerce: false, value: 'a' },
        },
      ]

      for (const { settings, input, output } of cases) {
        it(`${JSON.stringify(settings)} ${input}`, () => {
          const guard = string(settings)
          expect(guard.coerce(input, [])).toStrictEqual(output)
        })
      }
    })

    describe('trim: true', () => {
      const cases = [
        {
          input: '',
          output: { skipCoerce: false, value: '' },
        },
        {
          input: ' ',
          output: { skipCoerce: false, value: '' },
        },
        {
          input: 'foo',
          output: { skipCoerce: false, value: 'foo' },
        },
        {
          input: 'foo bar',
          output: { skipCoerce: false, value: 'foo bar' },
        },
        {
          input: 'foo bar ',
          output: { skipCoerce: false, value: 'foo bar' },
        },
        {
          input: ' foo bar',
          output: { skipCoerce: false, value: 'foo bar' },
        },
        {
          input: ' foo bar ',
          output: { skipCoerce: false, value: 'foo bar' },
        },
        {
          input: 'foo   bar',
          output: { skipCoerce: false, value: 'foo   bar' },
        },
        {
          input: 2,
          output: { skipCoerce: false, value: 2 },
        },
      ] as const

      const guard = string({ trim: true })

      for (const { input, output } of cases) {
        it(`${input}`, () => {
          expect(guard.coerce(input, [])).toStrictEqual(output)
        })
      }
    })

    describe("casing: 'lowerCase'", () => {
      const cases = [
        {
          input: 'foo',
          output: { skipCoerce: false, value: 'foo' },
        },
        {
          input: 'Foo',
          output: { skipCoerce: false, value: 'foo' },
        },
        {
          input: 'FOO',
          output: { skipCoerce: false, value: 'foo' },
        },
        {
          input: 'FOO BAR',
          output: { skipCoerce: false, value: 'foo bar' },
        },
        {
          input: '🤖',
          output: { skipCoerce: false, value: '🤖' },
        },
        {
          input: 'FOO@BAR.com',
          output: { skipCoerce: false, value: 'foo@bar.com' },
        },
      ] as const

      const guard = string({ casing: 'lowerCase' })

      for (const { input, output } of cases) {
        it(`${input}`, () => {
          expect(guard.coerce(input, [])).toStrictEqual(output)
        })
      }
    })

    describe("casing: 'upperCase'", () => {
      const cases = [
        {
          input: 'foo',
          output: { skipCoerce: false, value: 'FOO' },
        },
        {
          input: 'Foo',
          output: { skipCoerce: false, value: 'FOO' },
        },
        {
          input: 'FOO',
          output: { skipCoerce: false, value: 'FOO' },
        },
        {
          input: 'foo bar',
          output: { skipCoerce: false, value: 'FOO BAR' },
        },
        {
          input: '🤖',
          output: { skipCoerce: false, value: '🤖' },
        },
        {
          input: 'foo@bar.COM',
          output: { skipCoerce: false, value: 'FOO@BAR.COM' },
        },
      ] as const

      const guard = string({ casing: 'upperCase' })

      for (const { input, output } of cases) {
        it(`${input}`, () => {
          expect(guard.coerce(input, [])).toStrictEqual(output)
        })
      }
    })

    describe("casing: 'localeLowerCase'", () => {
      const cases = [
        {
          input: 'foo',
          output: { skipCoerce: false, value: 'foo' },
        },
        {
          input: 'Foo',
          output: { skipCoerce: false, value: 'foo' },
        },
        {
          input: 'FOO',
          output: { skipCoerce: false, value: 'foo' },
        },
        {
          input: 'FOO BAR',
          output: { skipCoerce: false, value: 'foo bar' },
        },
        {
          input: '🤖',
          output: { skipCoerce: false, value: '🤖' },
        },
        {
          input: 'FOO@BAR.com',
          output: { skipCoerce: false, value: 'foo@bar.com' },
        },
      ] as const

      const guard = string({ casing: 'localeLowerCase' })

      for (const { input, output } of cases) {
        it(`${input}`, () => {
          expect(guard.coerce(input, [])).toStrictEqual(output)
        })
      }
    })

    describe("casing: 'localeUpperCase'", () => {
      const cases = [
        {
          input: 'foo',
          output: { skipCoerce: false, value: 'FOO' },
        },
        {
          input: 'Foo',
          output: { skipCoerce: false, value: 'FOO' },
        },
        {
          input: 'FOO',
          output: { skipCoerce: false, value: 'FOO' },
        },
        {
          input: 'foo bar',
          output: { skipCoerce: false, value: 'FOO BAR' },
        },
        {
          input: '🤖',
          output: { skipCoerce: false, value: '🤖' },
        },
        {
          input: 'foo@bar.COM',
          output: { skipCoerce: false, value: 'FOO@BAR.COM' },
        },
      ] as const

      const guard = string({ casing: 'localeUpperCase' })

      for (const { input, output } of cases) {
        it(`${input}`, () => {
          expect(guard.coerce(input, [])).toStrictEqual(output)
        })
      }
    })
  })

  describe('pattern', () => {
    it('string-pattern', () => {
      const args = 'foo'
      const aaa = pattern(args)
      const bbb = string({ pattern: args })

      expect(aaa.arguments).toStrictEqual(bbb.arguments)
    })

    it('regex-pattern', () => {
      const args = /foo/gi
      const aaa = pattern(args)
      const bbb = string({ pattern: args })

      expect(aaa.arguments).toStrictEqual(bbb.arguments)
    })
  })

  it('startsWith', () => {
    const args = 'foo'
    const aaa = startsWith(args)
    const bbb = string({ startsWith: args })

    expect(aaa.arguments).toStrictEqual(bbb.arguments)
  })

  it('endsWith', () => {
    const args = 'foo'
    const aaa = endsWith(args)
    const bbb = string({ endsWith: args })

    expect(aaa.arguments).toStrictEqual(bbb.arguments)
  })

  describe('equals', () => {
    it('string(), string()', () => {
      const guard1 = string()
      const guard2 = string()

      expect(guard1.equals(guard2)).toBe(true)
      expect(guard2.equals(guard1)).toBe(true)
    })

    it('string({ blank: true }), string({ blank: true })', () => {
      const guard1 = string({ blank: true })
      const guard2 = string({ blank: true })

      expect(guard1.equals(guard2)).toBe(true)
      expect(guard2.equals(guard1)).toBe(true)
    })

    it("string({ casing: 'lowerCase' }), string({ casing: 'upperCase' })", () => {
      const guard1 = string({ casing: 'lowerCase' })
      const guard2 = string({ casing: 'upperCase' })

      expect(guard1.equals(guard2)).toBe(false)
      expect(guard2.equals(guard1)).toBe(false)
    })

    it('string(), integer()', () => {
      const guard1 = string()
      const guard2 = integer()

      expect(guard1.equals(guard2)).toBe(false)
      expect(guard2.equals(guard1)).toBe(false)
    })
  })
})
