import { describe, it } from 'std/testing/bdd.ts'
import { expect } from 'std/expect/mod.ts'

import { array } from '../array.ts'
import { boolean } from '../boolean.ts'
import { assertType } from '../helpers.ts'
import { iterable } from '../iterable.ts'
import { number } from '../number.ts'
import { string } from '../string.ts'
import { tuple } from '../tuple.ts'
import { unknown } from '../unknown.ts'

import type { Invalidation } from '../errors.ts'
import type { GuardType } from '../guard.ts'
import type { Equals } from '../helpers.ts'

describe('iterable', () => {
  // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
  it('typescript', () => {
    const guard = iterable(number())
    assertType<Equals<GuardType<typeof guard>, Iterable<number>>>(1)
  })

  describe('properties', () => {
    describe('number()', () => {
      const guard = iterable(number())

      it('name', () => {
        expect(guard.name).toBe('iterable')
      })

      it('arguments', () => {
        expect(guard.arguments).toStrictEqual([number()])
      })

      it('type', () => {
        expect(guard.type).toStrictEqual(['object'])
      })
    })

    describe('boolean()', () => {
      const guard = iterable(boolean())

      it('name', () => {
        expect(guard.name).toBe('iterable')
      })

      it('arguments', () => {
        expect(guard.arguments).toStrictEqual([boolean()])
      })

      it('type', () => {
        expect(guard.type).toStrictEqual(['object'])
      })
    })

    describe('iterable(number())', () => {
      const guard = iterable(iterable(number()))

      it('name', () => {
        expect(guard.name).toBe('iterable')
      })

      it('arguments', () => {
        expect(guard.arguments).toStrictEqual([iterable(number())])
      })

      it('type', () => {
        expect(guard.type).toStrictEqual(['object'])
      })
    })
  })

  describe('coerce', () => {
    it('number()', () => {
      const guard = iterable(number())
      const input: unknown[] = []
      expect(guard.coerce(input, [])).toStrictEqual({ skipCoerce: false, value: input })
    })

    it('boolean()', () => {
      const guard = iterable(boolean())
      const input = [true, false]
      expect(guard.coerce(input, [])).toStrictEqual({ skipCoerce: true, value: input })
    })

    it('iterable(number())', () => {
      const guard = iterable(iterable(number()))
      const input = [
        [1, 2],
        [2, 3],
      ]
      expect(guard.coerce(input, [])).toStrictEqual({ skipCoerce: true, value: input })
    })

    it("string({ casing: 'lowerCase' })", () => {
      const guard = iterable(string({ casing: 'lowerCase' }))
      const input = 'FOO'
      const output = 'foo'
      expect(guard.coerce(input, [])).toStrictEqual({ skipCoerce: false, value: output })
    })

    describe('number({ round: true })', () => {
      const guard = iterable(number({ round: true }))

      it('[···]', () => {
        const input = [0, 0.499, 0.5, 1, Number.NaN]
        const output = [0, 0, 1, 1, Number.NaN]
        expect(guard.coerce(input, [])).toStrictEqual({ skipCoerce: false, value: output })
      })

      it('new Set(···)', () => {
        const input = new Set([0, 0.499, 0.5, 1, Number.NaN])
        const output = new Set([0, 0, 1, 1, Number.NaN])
        expect(guard.coerce(input, [])).toStrictEqual({ skipCoerce: false, value: output })
      })

      it('no change', () => {
        const input = [1, 2]
        const output = [1, 2]
        expect(guard.coerce(input, [])).toStrictEqual({ skipCoerce: false, value: output })
      })

      it('invalid type', () => {
        const input = { a: 0.5, b: 1 }
        expect(guard.coerce(input, [])).toStrictEqual({ skipCoerce: false, value: input })
      })
    })

    describe('tuple([string(), number({ round: true })])', () => {
      const guard = iterable(tuple([string(), number({ round: true })]))

      it('new Map(···)', () => {
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
    })
  })

  it('inspect', () => {
    const guard = iterable(number())

    expect([
      ...guard.inspect([], function* (_, inspectedGuard) {
        yield `${inspectedGuard.name}-${inspectedGuard.type[0] as string}`
      }),
    ]).toStrictEqual(['iterable-object', 'type-number'])
  })

  describe('scan', () => {
    describe('number()', () => {
      const guard = iterable(number())

      it('[···]', () => {
        const input = [1, 2, 3]
        const output: number[] = []

        guard.scan(input, output, [], (scanningInput, _path, _guard, scanningOutput) => {
          scanningOutput.push(scanningInput as number)
        })

        expect(output).toStrictEqual([input, ...input])
      })

      it('new Set(···)', () => {
        const input = new Set([1, 2, 3])
        const output: number[] = []

        guard.scan(input, output, [], (scanningInput) => {
          output.push(scanningInput as number)
        })

        expect(output).toStrictEqual([input, 1, 2, 3])
      })
    })

    it('invalid input', () => {
      const guard = iterable(string({ casing: 'lowerCase' }))
      const input = ['F', 'O', 'O']

      const invalidations: Invalidation[] = []
      guard.validate(input, [], invalidations)

      expect(invalidations.length).toBeGreaterThan(0)
    })
  })

  describe('convert', () => {
    describe('number()', () => {
      const guard = iterable(unknown())

      it('no change', () => {
        const input = [1, 2, 3]

        const result = guard.convert(input, undefined, [], (convertInput) => convertInput)

        expect(result).toStrictEqual(input)
      })

      it('[···]', () => {
        const input = [1, 2, 3]

        const result = guard.convert(input, undefined, [], (convertInput) =>
          // eslint-disable-next-line vitest/no-conditional-in-test -- test
          typeof convertInput === 'number' ? convertInput.toString() : convertInput)

        expect(result).toStrictEqual(['1', '2', '3'])
      })

      it('new Set([···])', () => {
        const input = new Set([1, 2, 3])

        const result = guard.convert(input, undefined, [], (convertInput) =>
          // eslint-disable-next-line vitest/no-conditional-in-test -- test
          typeof convertInput === 'number' ? convertInput.toString() : convertInput)

        expect(result).toStrictEqual(new Set(['1', '2', '3']))
      })

      it('new Map([···])', () => {
        const input = new Map([
          ['0', 1],
          ['1', 2],
          ['2', 3],
        ])

        const result = guard.convert(input, undefined, [], (convertInput) =>
          // eslint-disable-next-line vitest/no-conditional-in-test -- test
          Array.isArray(convertInput) && convertInput.length === 2 && typeof convertInput[1] === 'number'
            ? [convertInput[0], convertInput[1].toString()]
            : convertInput)

        expect(result).toStrictEqual(
          new Map([
            ['0', '1'],
            ['1', '2'],
            ['2', '3'],
          ]),
        )
      })
    })

    it('invalid input', () => {
      const guard = iterable(string({ casing: 'lowerCase' }))
      const input = ['F', 'O', 'O']

      const invalidations: Invalidation[] = []
      guard.validate(input, [], invalidations)

      expect(invalidations.length).toBeGreaterThan(0)
    })
  })

  describe('substitute', () => {
    it('any() -> number()', () => {
      const anyGuard = unknown()
      const numberGuard = number()
      const guard = iterable(unknown())

      const result = guard.substitute([], (_path, innerGuard) => {
        // eslint-disable-next-line vitest/no-conditional-in-test -- test
        if (innerGuard === anyGuard) {
          return numberGuard
        }

        return innerGuard
      })

      expect(result).toStrictEqual(iterable(number()))
    })

    it('no change', () => {
      const guard = iterable(unknown())

      const result = guard.substitute([], (_path, innerGuard) => innerGuard)

      expect(result).toStrictEqual(guard)
    })
  })

  describe('validate', () => {
    describe('any()', () => {
      const guard = iterable(unknown())

      const cases = [
        {
          input: [],
          expectedInvalidations: [],
        },
        {
          input: [1, 2, 3],
          expectedInvalidations: [],
        },
        {
          input: new Set([1, 2, 3]),
          expectedInvalidations: [],
        },
        {
          input: new Map([
            ['0', 1],
            ['1', 2],
            ['2', 3],
          ]),
          expectedInvalidations: [],
        },
        {
          input: 'foo',
          expectedInvalidations: [],
        },
        {
          input: {},
          expectedInvalidations: [
            {
              actual: 'undefined',
              path: [Symbol.iterator],
              rule: 'type',
              setting: ['function'],
            },
          ],
        },
        {
          input: 2,
          expectedInvalidations: [
            {
              actual: 'number',
              path: [],
              rule: 'type',
              setting: ['object', 'string'],
            },
          ],
        },
        {
          input: () => undefined,
          expectedInvalidations: [
            {
              actual: 'function',
              path: [],
              rule: 'type',
              setting: ['object', 'string'],
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

    describe('number()', () => {
      const guard = iterable(number())

      const cases = [
        {
          name: '[]',
          input: [],
          expectedInvalidations: [],
        },
        {
          name: '[1, 2, 3]',
          input: [1, 2, 3],
          expectedInvalidations: [],
        },
        {
          name: 'new Set([1, 2, 3])',
          input: new Set([1, 2, 3]),
          expectedInvalidations: [],
        },
        {
          name: 'new Map()',
          input: new Map(),
          expectedInvalidations: [],
        },
        {
          name: "new Map([['1', 1]])",
          input: new Map([['1', 1]]),
          expectedInvalidations: [
            {
              actual: 'object',
              path: [0],
              rule: 'type',
              setting: ['number'],
            },
          ],
        },
        {
          name: "'foo'",
          input: 'foo',
          expectedInvalidations: [
            { actual: 'string', path: [0], rule: 'type', setting: ['number'] },
            { actual: 'string', path: [1], rule: 'type', setting: ['number'] },
            { actual: 'string', path: [2], rule: 'type', setting: ['number'] },
          ],
        },
        {
          name: '{}',
          input: {},
          expectedInvalidations: [
            {
              actual: 'undefined',
              path: [Symbol.iterator],
              rule: 'type',
              setting: ['function'],
            },
          ],
        },
        {
          name: '2',
          input: 2,
          expectedInvalidations: [
            {
              actual: 'number',
              path: [],
              rule: 'type',
              setting: ['object', 'string'],
            },
          ],
        },
        {
          name: '() => undefined',
          input: () => undefined,
          expectedInvalidations: [
            {
              actual: 'function',
              path: [],
              rule: 'type',
              setting: ['object', 'string'],
            },
          ],
        },
      ]

      for (const _case of cases) {
        it(_case.name, () => {
          const invalidations: Invalidation[] = []
          expect(guard.validate(_case.input, [], invalidations)).toStrictEqual(_case.expectedInvalidations.length === 0)
          expect(guard.accept(_case.input)).toBe(_case.expectedInvalidations.length === 0)
          expect(invalidations).toStrictEqual(_case.expectedInvalidations)
        })
      }
    })
  })

  describe('equals', () => {
    it('iterable(string()), iterable(string())', () => {
      const guard1 = iterable(string())
      const guard2 = iterable(string())

      expect(guard1.equals(guard2)).toBe(true)
      expect(guard2.equals(guard1)).toBe(true)
    })

    it('iterable(string()), iterable(number())', () => {
      const guard1 = iterable(string())
      const guard2 = iterable(number())

      expect(guard1.equals(guard2)).toBe(false)
      expect(guard2.equals(guard1)).toBe(false)
    })

    it('iterable(any()), array(any())', () => {
      const guard1 = iterable(unknown())
      const guard2 = array(unknown())

      expect(guard1.equals(guard2)).toBe(false)
      expect(guard2.equals(guard1)).toBe(false)
    })
  })

  describe('toString', () => {
    it('any()', () => {
      const guard = iterable(unknown())
      expect(guard.toString()).toBe('Iterable<unknown>')
    })

    it('unknown()', () => {
      const guard = iterable(unknown())
      expect(guard.toString()).toBe('Iterable<unknown>')
    })

    it('boolean()', () => {
      const guard = iterable(boolean())
      expect(guard.toString()).toBe('Iterable<boolean>')
    })

    it('string()', () => {
      const guard = iterable(string())
      expect(guard.toString()).toBe('Iterable<string>')
    })
  })
})
