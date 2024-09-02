import { describe, it } from 'std/testing/bdd.ts'
import { expect } from 'std/expect/mod.ts'

import { assertType } from '../helpers.ts'
import { number } from '../number.ts'
import { object, ObjectGuard, props } from '../object.ts'
import { string } from '../string.ts'
import { unknown } from '../unknown.ts'

import type { Invalidation } from '../errors.ts'
import type { GuardType } from '../guard.ts'
import type { Equals } from '../helpers.ts'

describe('object', () => {
  describe('typescript', () => {
    // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
    it('props: { foo: unknown() }', () => {
      const guard = object({ props: { foo: unknown() } })
      assertType<Equals<GuardType<typeof guard>, { readonly foo: unknown }>>(1)
    })

    // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
    it('props: { foo: unknown() }, extendable: true', () => {
      const guard = object({ props: { foo: unknown() }, extendable: true })
      assertType<Equals<GuardType<typeof guard>, { readonly foo: unknown }>>(1)
    })

    // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
    it('props: { foo: unknown() }, mask: true', () => {
      const guard = object({ props: { foo: unknown() }, mask: true })
      assertType<Equals<GuardType<typeof guard>, { readonly foo: unknown }>>(1)
    })

    it('circular guard', () => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- circular type
      type Circular = { nested: ObjectGuard<{ self: Circular['nested'] }> }

      const guard: ObjectGuard<Circular> = object({
        props: {
          nested: props(() => ({ self: guard.props.nested })),
        },
      })

      const input: Record<string, Record<string, unknown>> = { nested: {} }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Guaranteed to be set
      input['nested']!['self'] = input['nested']

      expect(guard.accept(input)).toBe(true)
      expect(guard.accept({ nested: { self: {} } })).toBe(false)

      expect(guard.toTypeScript({ interfaceName: 'CircularInterface' })).toBe(
        'interface CircularInterface { readonly "nested": { readonly "self": CircularInterface["nested"] } }',
      )
    })
  })

  describe('arguments', () => {
    it('props: { foo: unknown() }', () => {
      const guard = object({ props: { foo: unknown() } })
      expect(guard.arguments).toStrictEqual([{ props: { foo: unknown() } }])
    })

    it('props: { foo: unknown() }, extendable: true', () => {
      const guard = object({ props: { foo: unknown() }, extendable: true })
      expect(guard.arguments).toStrictEqual([{ props: { foo: unknown() }, extendable: true }])
    })

    it('props: { foo: unknown() }, mask: true', () => {
      const guard = object({ props: { foo: unknown() }, mask: true })
      expect(guard.arguments).toStrictEqual([{ props: { foo: unknown() }, mask: true }])
    })
  })

  describe('props', () => {
    it('{ foo: unknown() }', () => {
      const guard1 = props({ foo: unknown() })
      const guard2 = object({ props: { foo: unknown() }, extendable: undefined, mask: undefined })

      expect(guard1.equals(guard2)).toBe(true)
      expect(guard2.equals(guard1)).toBe(true)
    })

    it('{ foo: unknown() }, { extendable: true }', () => {
      const guard1 = props({ foo: unknown() }, { extendable: true })
      const guard2 = object({ props: { foo: unknown() }, extendable: true, mask: undefined })

      expect(guard1.equals(guard2)).toBe(true)
      expect(guard2.equals(guard1)).toBe(true)
    })

    it('{ foo: unknown() }, { mask: true }', () => {
      const guard1 = props({ foo: unknown() }, { mask: true })
      const guard2 = object({ props: { foo: unknown() }, extendable: undefined, mask: true })

      expect(guard1.equals(guard2)).toBe(true)
      expect(guard2.equals(guard1)).toBe(true)
    })
  })

  describe('coerce', () => {
    it('{ props: { foo: unknown() } }', () => {
      const guard = object({ props: { foo: unknown() } })

      const input = { foo: 1 }
      const output = input

      expect(guard.coerce(input, [])).toStrictEqual({ skipCoerce: true, value: output })
    })

    it('{ props: { foo: number() } }', () => {
      const guard = object({ props: { foo: number() } })

      const input = { foo: 1 }
      const output = input

      expect(guard.coerce(input, [])).toStrictEqual({ skipCoerce: true, value: output })
    })

    it('{ props: { foo: object({ props: { foo: unknown() } }) } }', () => {
      const guard = object({ props: { foo: object({ props: { foo: unknown() } }) } })

      const input = { foo: { foo: 1 } }
      const output = input

      expect(guard.coerce(input, [])).toStrictEqual({ skipCoerce: true, value: output })
    })

    it('{ props: { foo: number({ round: true }) } }', () => {
      const guard = object({ props: { foo: number({ round: true }) } })

      const input = { foo: 0.5 }
      const output = { foo: 1 }

      // eslint-disable-next-line vitest/prefer-strict-equal -- some undefined property is part of result
      expect(guard.coerce(input, [])).toEqual({ skipCoerce: false, value: output })
    })

    it("{ props: { foo: string({ casing: 'lowerCase' }) } }", () => {
      const guard = object({ props: { foo: string({ casing: 'lowerCase' }) } })

      const input = { foo: 'FOO' }
      const output = { foo: 'foo' }

      // eslint-disable-next-line vitest/prefer-strict-equal -- some undefined property is part of result
      expect(guard.coerce(input, [])).toEqual({ skipCoerce: false, value: output })
    })

    it("{ props: { foo: string({ casing: 'lowerCase' }), bar: unknown() } }", () => {
      const guard = object({ props: { foo: string({ casing: 'lowerCase' }), bar: unknown() } })

      const input = { foo: 'FOO', bar: 1 }
      const output = { foo: 'foo', bar: 1 }

      // eslint-disable-next-line vitest/prefer-strict-equal -- some undefined property is part of result
      expect(guard.coerce(input, [])).toEqual({ skipCoerce: false, value: output })
    })

    describe('{ props: { foo: unknown() }, mask: true }', () => {
      it("{ foo: 'foo' }", () => {
        const guard = object({ props: { foo: unknown() }, mask: true })

        const input = { foo: 'foo' }
        const output = input

        expect(guard.coerce(input, [])).toStrictEqual({ skipCoerce: false, value: output })
      })

      it("{ foo: 'foo', bar: true }", () => {
        const guard = object({ props: { foo: unknown() }, mask: true })

        const input = { foo: 'foo', bar: true }
        const output = { foo: 'foo' }

        // eslint-disable-next-line vitest/prefer-strict-equal -- some undefined property is part of result
        expect(guard.coerce(input, [])).toEqual({ skipCoerce: false, value: output })
      })
    })

    describe("{ props: { foo: string({ casing: 'lowerCase' }) }, mask: true }", () => {
      const guard = object({ props: { foo: string({ casing: 'lowerCase' }) }, mask: true })

      it("{ foo: 'FOO' }", () => {
        const input = { foo: 'FOO' }
        const output = { foo: 'foo' }

        // eslint-disable-next-line vitest/prefer-strict-equal -- some undefined property is part of result
        expect(guard.coerce(input, [])).toEqual({ skipCoerce: false, value: output })
      })

      it("{ foo: 'FOO', bar: true }", () => {
        const input = { foo: 'FOO', bar: true }
        const output = { foo: 'foo' }

        // eslint-disable-next-line vitest/prefer-strict-equal -- some undefined property is part of result
        expect(guard.coerce(input, [])).toEqual({ skipCoerce: false, value: output })
      })
    })

    describe("{ props: { foo: string({ casing: 'lowerCase' }), bar: unknown() }, mask: true }", () => {
      const guard = object({ props: { foo: string({ casing: 'lowerCase' }), bar: unknown() }, mask: true })

      it("{ foo: 'FOO', bar: 2, baz: true }", () => {
        const input = { foo: 'FOO', bar: 2, baz: true }
        const output = { foo: 'foo', bar: 2 }

        // eslint-disable-next-line vitest/prefer-strict-equal -- some undefined property is part of result
        expect(guard.coerce(input, [])).toEqual({ skipCoerce: false, value: output })
      })
    })

    it('{ props: { [symbol]: unknown() } }', () => {
      const symbol = Symbol('foo')
      const guard = object({ props: { [symbol]: unknown() } })

      const input = { [symbol]: 1 }
      expect(guard.coerce(input, [])).toStrictEqual({ skipCoerce: true, value: input })
    })
  })

  describe('validate', () => {
    describe('{ props: { foo: number() } }', () => {
      const guard = object({ props: { foo: number() } })

      const cases = [
        {
          name: '{ foo: 2 }',
          input: { foo: 2 },
          expectedInvalidations: [],
        },
        {
          name: '{ foo: -2 }',
          input: { foo: -2 },
          expectedInvalidations: [],
        },
        {
          name: "{ foo: 'bar' }",
          input: { foo: 'bar' },
          expectedInvalidations: [
            {
              actual: 'string',
              path: ['foo'],
              rule: 'type',
              setting: ['number'],
            },
          ],
        },
        {
          name: '{ foo: 1, bar: 2 }',
          input: { foo: 1, bar: 2 },
          expectedInvalidations: [
            {
              actual: ['bar'],
              function: 'extendable',
              guard: 'object',
              path: [],
              rule: 'logical',
              setting: false,
            },
          ],
        },
        {
          name: '{ bar: true }',
          input: { bar: true },
          expectedInvalidations: [
            {
              actual: 'undefined',
              path: ['foo'],
              rule: 'type',
              setting: ['number'],
            },
            {
              actual: ['bar'],
              function: 'extendable',
              guard: 'object',
              path: [],
              rule: 'logical',
              setting: false,
            },
          ],
        },
        {
          name: '1',
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
          name: "'foo'",
          input: 'foo',
          expectedInvalidations: [
            {
              actual: 'string',
              path: [],
              rule: 'type',
              setting: ['object'],
            },
          ],
        },
      ]

      for (const { name, input, expectedInvalidations } of cases) {
        it(name, () => {
          const invalidations: Invalidation[] = []
          expect(guard.validate(input, [], invalidations)).toStrictEqual(expectedInvalidations.length === 0)
          expect(invalidations).toStrictEqual(expectedInvalidations)
        })
      }
    })

    describe('{ props: { foo: number() }, extendable: false }', () => {
      const guard = object({ props: { foo: number() }, extendable: false })

      const cases = [
        {
          name: '{ foo: 2 }',
          input: { foo: 2 },
          expectedInvalidations: [],
        },
        {
          name: '{ foo: 1, bar: 2 }',
          input: { foo: 1, bar: 2 },
          expectedInvalidations: [
            {
              actual: ['bar'],
              function: 'extendable',
              guard: 'object',
              path: [],
              rule: 'logical',
              setting: false,
            },
          ],
        },
      ]

      for (const { name, input, expectedInvalidations } of cases) {
        it(name, () => {
          const invalidations: Invalidation[] = []
          expect(guard.validate(input, [], invalidations)).toStrictEqual(expectedInvalidations.length === 0)
          expect(invalidations).toStrictEqual(expectedInvalidations)
        })
      }
    })

    describe('{ props: { [symbol]: number() } }', () => {
      const symbol = Symbol('foo')
      const guard = object({ props: { [symbol]: number() } })

      const cases = [
        {
          name: '{ [symbol]: 2 }',
          input: { [symbol]: 2 },
          expectedInvalidations: [],
        },
        {
          name: '{ [symbol]: 2, [Symbol.iterator]: 2 }',
          input: { [symbol]: 2, [Symbol.iterator]: 2 },
          expectedInvalidations: [],
        },
        {
          name: '{ [Symbol.iterator]: 2 }',
          input: { [Symbol.iterator]: 2 },
          expectedInvalidations: [{ actual: 'undefined', path: [symbol], rule: 'type', setting: ['number'] }],
        },
      ]

      for (const { name, input, expectedInvalidations } of cases) {
        it(name, () => {
          const invalidations: Invalidation[] = []
          expect(guard.validate(input, [], invalidations)).toStrictEqual(expectedInvalidations.length === 0)
          expect(invalidations).toStrictEqual(expectedInvalidations)
        })
      }
    })
  })

  describe('scan', () => {
    it('{ props: { foo: unknown() } }', () => {
      const guard = object({ props: { foo: unknown() } })
      const input = { foo: 1 }
      const output: unknown[] = []

      guard.scan(input, output, [], (scanningInput, _path, _guard, scanningOutput) => {
        scanningOutput.push(scanningInput)
      })

      expect(output).toStrictEqual([input, 1])
    })

    it('{ props: { foo: number() } }', () => {
      const guard = object({ props: { foo: number() } })
      const input = { foo: '1' }

      const invalidations: Invalidation[] = []
      guard.validate(input, [], invalidations)

      expect(invalidations.length).toBeGreaterThan(0)
    })
  })

  describe('convert', () => {
    it('{ props: { foo: unknown() } }', () => {
      const innerGuard = unknown()
      const guard = object({ props: { foo: innerGuard } })

      const input = { foo: 1 }

      const result1 = guard.convert(input, undefined, [], (convertInput, _path, _guard) =>
        // eslint-disable-next-line vitest/no-conditional-in-test -- test
        typeof convertInput === 'number' ? convertInput.toString() : convertInput)

      // eslint-disable-next-line vitest/prefer-strict-equal -- some undefined property is part of result
      expect(result1).toEqual({ foo: '1' })

      const result2 = guard.convert(input, undefined, [], (scanningInput, _path, subjectGuard) =>
        // eslint-disable-next-line vitest/no-conditional-in-test -- test
        subjectGuard instanceof ObjectGuard ? Object.keys(scanningInput as object) : scanningInput)

      expect(result2).toStrictEqual(['foo'])
    })

    it("{ props: { foo: string({ casing: 'lowerCase' }) } }", () => {
      const guard = object({ props: { foo: string({ casing: 'lowerCase' }) } })
      const input = { foo: 'A' }

      const invalidations: Invalidation[] = []
      guard.validate(input, [], invalidations)

      expect(invalidations.length).toBeGreaterThan(0)
    })

    it('{ props: { foo: innerGuard }, extendable: true }', () => {
      const innerGuard = unknown()
      const guard = object({ props: { foo: innerGuard }, extendable: true })

      const input = { foo: 1, bar: true }

      const result1 = guard.convert(input, undefined, [], (convertInput, _path, _guard) =>
        // eslint-disable-next-line vitest/no-conditional-in-test -- test
        typeof convertInput === 'number' ? convertInput.toString() : convertInput)

      // eslint-disable-next-line vitest/prefer-strict-equal -- some undefined property is part of result
      expect(result1).toEqual({ bar: true, foo: '1' })

      const result2 = guard.convert(input, undefined, [], (convertInput, _path, subjectGuard) =>
        // eslint-disable-next-line vitest/no-conditional-in-test -- test
        subjectGuard instanceof ObjectGuard ? Object.keys(convertInput as object) : convertInput)

      expect(result2).toStrictEqual(['foo', 'bar'])
    })
  })

  describe('substitute', () => {
    it('unknown() -> number()', () => {
      const anyGuard = unknown()
      const numberGuard = number()
      const guard = object({ props: { foo: anyGuard }, extendable: false, mask: false })

      const result = guard.substitute([], (_path, subjectGuard) => {
        // eslint-disable-next-line vitest/no-conditional-in-test --  test
        if (subjectGuard === anyGuard) {
          return numberGuard
        }

        return subjectGuard
      })

      const resultGuard = object({ props: { foo: number() }, extendable: false, mask: false })

      expect(result.equals(resultGuard)).toBe(true)
    })

    it('no change', () => {
      const guard = object({ props: { foo: unknown() } })

      const result = guard.substitute([], (_path, subjectGuard) => subjectGuard)

      expect(result).toStrictEqual(guard)
    })
  })

  describe('inspect', () => {
    it('should visit both keys and values', () => {
      const guard = object({ props: { a: number() } })
      expect([
        ...guard.inspect([], function* (_, inspectGuard) {
          yield `${inspectGuard.name}-${inspectGuard.type[0] as string}`
        }),
      ]).toStrictEqual(['object-object', 'type-number'])
    })
  })

  it('pick', () => {
    const guard = object({ props: { foo: unknown(), bar: unknown() } }).pick(['foo'])
    const resultGuard = object({ props: { foo: unknown() }, extendable: undefined, mask: undefined })

    expect(guard.equals(resultGuard)).toBe(true)
    expect(resultGuard.equals(guard)).toBe(true)
  })

  it('pluck', () => {
    const guard = object({ props: { foo: unknown(), bar: unknown() } }).pluck('foo')
    const resultGuard = unknown()

    expect(guard.equals(resultGuard)).toBe(true)
    expect(resultGuard.equals(guard)).toBe(true)
  })

  it('omit', () => {
    const guard = object({ props: { foo: unknown(), bar: unknown() } }).omit(['bar'])
    const resultGuard = object({ props: { foo: unknown() }, extendable: undefined, mask: undefined })

    expect(guard.equals(resultGuard)).toBe(true)
    expect(resultGuard.equals(guard)).toBe(true)
  })

  it('merge', () => {
    const guard1 = object({ props: { foo: unknown() } })
    const guard2 = object({ props: { bar: unknown() } })

    const mergedGuard = guard1.merge(guard2)
    const resultGuard = object({ props: { foo: unknown(), bar: unknown() }, extendable: undefined, mask: undefined })

    expect(mergedGuard.equals(resultGuard)).toBe(true)
    expect(resultGuard.equals(mergedGuard)).toBe(true)
  })

  describe('toString', () => {
    it('object({ props: { a: number() } })', () => {
      const guard = object({ props: { a: number() } })
      expect(guard.toString()).toBe('{ readonly "a": number }')
    })

    it('object({ props: { a: number(), b: string() } })', () => {
      const guard = object({ props: { a: number(), b: string() } })
      expect(guard.toString()).toBe('{ readonly "a": number; readonly "b": string }')
    })

    it(`object({ props: { 'a"': unknown() } })`, () => {
      const guard = object({ props: { 'a"': unknown() } })
      expect(guard.toString()).toBe('{ readonly "a\\""?: unknown }')
    })
  })
})
