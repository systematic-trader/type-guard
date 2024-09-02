import { describe, it } from 'std/testing/bdd.ts'
import { expect } from 'std/expect/mod.ts'

import { enums } from '../enums.ts'
import { AssertionError } from '../errors.ts'
import { Guard } from '../guard.ts'
import { assertType } from '../helpers.ts'
import { number } from '../number.ts'
import { string } from '../string.ts'

import type { Invalidation } from '../errors.ts'
import type { GuardType } from '../guard.ts'
import type { Equals } from '../helpers.ts'

describe('guard', () => {
  // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
  it('typescript', () => {
    const guard = new Guard({
      name: 'CustomGuard',
      arguments: [],
      type: ['unknown'],
    })

    assertType<Equals<GuardType<typeof guard>, unknown>>(1)
  })

  describe('properties', () => {
    const guard = new Guard({
      name: 'CustomGuard',
      arguments: [],
      type: ['unknown'],
    })
    it('name', () => {
      expect(guard.name).toBe('CustomGuard')
    })

    it('arguments', () => {
      expect(guard.arguments).toStrictEqual([])
    })

    it('type', () => {
      expect(guard.type).toStrictEqual(['unknown'])
    })
  })

  it('accept', () => {
    const guard = new Guard({
      name: 'CustomGuard',
      arguments: [],
      type: ['unknown'],
    })
    expect(guard.accept(undefined)).toBe(true)
  })

  it('validate', () => {
    const guard = new Guard({
      name: 'CustomGuard',
      arguments: [],
      type: ['unknown'],
    })
    expect(guard.validate(undefined, [], [])).toBe(true)
  })

  describe('equals', () => {
    const guard = new Guard({
      name: 'CustomGuard',
      arguments: [],
      type: ['unknown'],
    })
    it('same', () => {
      expect(guard.equals(guard)).toBe(true)
    })
    it('not same', () => {
      const guardB = new Guard({ name: 'CustomGuard', arguments: [], type: ['unknown'] })
      expect(guard.equals(guardB)).toBe(false)
      expect(guardB.equals(guard)).toBe(false)
    })
  })

  describe('scan', () => {
    it('should scan accepting input', () => {
      const guard = new Guard({
        name: 'CustomGuard',
        arguments: [],
        type: ['any'],
      })

      const output: unknown[] = []

      guard.scan('b', output, [], (input, _path, _guard, scanningOutput) => {
        scanningOutput.push(input)
      })

      expect(output).toStrictEqual(['b'])
    })

    it('should keep scanning unaccepted input on skipAssertion', () => {
      const guard = new Guard({
        name: 'CustomGuard',
        arguments: [],
        type: ['number'],
      })

      const output: unknown[] = []

      guard.scan('B', output, [], (input, _path, _guard, scanningOutput) => {
        scanningOutput.push(input)
      })

      expect(output).toStrictEqual(['B'])
    })

    it('should stop scanning on maxPathLength accepting input', () => {
      const guard = new Guard({
        name: 'CustomGuard',
        arguments: [],
        type: ['any'],
      })

      const output: unknown[] = []

      guard.scan(
        'b',
        output,
        [1],
        (input, _path, _guard, scanningOutput) => {
          scanningOutput.push(input)
        },
        { maxPathLength: 0 },
      )

      expect(output).toStrictEqual([])
    })

    // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
    it('should throw if base guard does not accept', () => {
      const guard = new Guard({
        name: 'CustomGuard',
        arguments: [],
        type: ['number'],
        accept(_input): _input is string {
          return false
        },
        validate(_input, path, invalidations): _input is string {
          invalidations.push({ rule: 'type', path, setting: [], actual: 'string' })
          return false
        },
      })
      const invalidations: Invalidation[] = []
      guard.validate('B', [], invalidations)
    })
  })

  describe('convert', () => {
    it('should convert accepting input', () => {
      const guard = new Guard({
        name: 'CustomGuard',
        arguments: [],
        type: ['string'],
      })
      expect(
        guard.convert('b', undefined, [], (input, _) => {
          // eslint-disable-next-line vitest/no-conditional-in-test -- Must be fixed in a later refactor
          if (typeof input === 'string') {
            return input.toUpperCase()
          }
          return input
        }),
      ).toBe('B')
    })
  })

  describe('exclude', () => {
    it('should return self with no values', () => {
      const guard = new Guard({
        name: 'CustomGuard',
        arguments: [],
        type: ['unknown'],
      })
      expect(guard.exclude([])).toBe(guard)
    })

    it('should throw error on invalid values', () => {
      const guard = new Guard({
        name: 'CustomGuard',
        arguments: [],
        type: ['number'],
        accept(_input): _input is string {
          return false
        },
      })
      expect(() => guard.exclude(['A'])).toThrow('Value A is not valid and cannot be excluded')
    })

    describe('exludeGuard', () => {
      describe('properties', () => {
        const guard1 = new Guard({
          name: 'CustomGuard',
          arguments: [],
          type: ['any'],
        })
        const guard = guard1.exclude(['A'])
        it('name', () => {
          expect(guard.name).toBe('exclude')
        })
        it('type', () => {
          expect(guard.type).toBe(guard1.type)
        })
        it('arguments', () => {
          expect(guard.arguments).toStrictEqual([guard1, ['A']])
        })
      })

      describe('validate & accept', () => {
        // eslint-disable-next-line vitest/max-nested-describe -- Must be fixed in a later refactor
        describe('any', () => {
          const guard1 = new Guard({
            name: 'CustomGuard',
            arguments: [],
            type: ['any'],
          })
          it('excluded value', () => {
            const guard = guard1.exclude(['A'])
            expect(guard.accept('B')).toBe(true)
            const invalidations: Invalidation[] = []
            expect(guard.validate('B', [], invalidations)).toBe(true)
            expect(invalidations).toStrictEqual([])

            expect(guard.accept('A')).toBe(false)
            expect(guard.validate('A', [], invalidations)).toBe(false)
            expect(invalidations).toStrictEqual([
              { actual: 'A', function: 'notEquals', guard: 'CustomGuard', path: [], rule: 'logical', setting: 'A' },
            ])
          })
          it('excluded object', () => {
            const guard = guard1.exclude([{ one: 2 }])
            expect(guard.accept({ one: 1 })).toBe(true)
            const invalidations: Invalidation[] = []
            expect(guard.validate({ one: 1 }, [], invalidations)).toBe(true)
            expect(invalidations).toStrictEqual([])

            expect(guard.accept({ one: 2 })).toBe(false)
            expect(guard.validate({ one: 2 }, [], invalidations)).toBe(false)
            expect(invalidations).toStrictEqual([
              {
                actual: { one: 2 },
                function: 'notEquals',
                guard: 'CustomGuard',
                path: [],
                rule: 'logical',
                setting: { one: 2 },
              },
            ])
          })
        })
      })

      describe('equals', () => {
        it('not a guard', () => {
          const guard1 = new Guard({
            name: 'CustomGuard',
            arguments: [],
            type: ['any'],
          })
          const guard = guard1.exclude([1])
          expect(guard.equals({})).toBe(false)
        })
        it('exclude same', () => {
          const customGuard = new Guard({
            name: 'CustomGuard',
            arguments: [],
            type: ['any'],
          })
          const guard1 = customGuard.exclude([1])
          const guard2 = customGuard.exclude([1])
          expect(guard1.equals(guard2)).toBe(true)
          expect(guard2.equals(guard1)).toBe(true)
        })

        it('exclude different', () => {
          const customGuard = new Guard({
            name: 'CustomGuard',
            arguments: [],
            type: ['any'],
          })
          const guard1 = customGuard.exclude([1])
          const guard2 = customGuard.exclude([2])
          expect(guard1.equals(guard2)).toBe(false)
          expect(guard2.equals(guard1)).toBe(false)
        })
        it('exclude same different order', () => {
          const customGuard = new Guard({
            name: 'CustomGuard',
            arguments: [],
            type: ['any'],
          })
          const guard1 = customGuard.exclude([1, 2])
          const guard2 = customGuard.exclude([2, 1])
          expect(guard1.equals(guard2)).toBe(true)
          expect(guard2.equals(guard1)).toBe(true)
        })
      })

      describe('coerce', () => {
        it('any should skipCoerce', () => {
          const customGuard = new Guard({
            name: 'CustomGuard',
            arguments: [],
            type: ['any'],
          })
          const guard = customGuard.exclude([1, 2])
          expect(guard.coerce(1, [])).toStrictEqual({
            skipCoerce: true,
            value: 1,
          })
        })
        it('number should coerce', () => {
          const numberGuard = number({ round: true })
          const guard = numberGuard.exclude([1, 2])
          expect(guard.coerce(1.1, [])).toStrictEqual({
            skipCoerce: false,
            value: 1,
          })
        })
      })

      describe('convert', () => {
        it('should convert accepting input', () => {
          const customGuard = new Guard({
            name: 'CustomGuard',
            arguments: [],
            type: ['any'],
          })
          const guard = customGuard.exclude(['a'])
          expect(
            guard.convert('b', undefined, [], (input) => {
              // eslint-disable-next-line vitest/no-conditional-in-test -- Must be fixed in a later refactor
              if (typeof input === 'string') {
                return input.toUpperCase()
              }
              return input
            }),
          ).toBe('B')
        })

        it('should not convert input if not changed', () => {
          const customGuard = new Guard({
            name: 'CustomGuard',
            arguments: [],
            type: ['any'],
          })
          const guard = customGuard.exclude(['a'])
          expect(guard.convert('b', undefined, [], (input) => input)).toBe('b')
        })

        it('should throw if value is excluded', () => {
          const customGuard = new Guard({
            name: 'CustomGuard',
            arguments: [],
            type: ['any'],
          })
          const guard = customGuard.exclude(['a'])
          const invalidations: Invalidation[] = []
          guard.validate('a', [], invalidations)
          expect(() => guard.convert('a', undefined, [], () => undefined)).toThrow(new AssertionError(invalidations))
        })
      })

      it('should run on inner guard', () => {
        const customGuard = new Guard({
          name: 'CustomGuard',
          arguments: [],
          type: ['any'],
        })
        const guard = customGuard.exclude(['a'])
        expect([
          ...guard.inspect([], function* (_, inspectedGuard) {
            // eslint-disable-next-line vitest/no-conditional-in-test -- Must be fixed in a later refactor
            yield inspectedGuard.type[0] === 'any' ? 'any' : 'exclude'
          }),
        ]).toStrictEqual(['any'])
      })

      describe('scan', () => {
        it('should scan accepting input', () => {
          const customGuard = new Guard({
            name: 'CustomGuard',
            arguments: [],
            type: ['any'],
          })
          const guard = customGuard.exclude(['a'])
          const output: unknown[] = []

          guard.scan('b', output, [], (input, _path, _guard, scanningOutput) => {
            scanningOutput.push(input)
          })

          expect(output).toStrictEqual(['b'])
        })

        it('should throw if value is excluded', () => {
          const customGuard = new Guard({
            name: 'CustomGuard',
            arguments: [],
            type: ['string'],
          })
          const guard = customGuard.exclude(['a'])
          const invalidations: Invalidation[] = []
          guard.validate('a', [], invalidations)
          expect(() => guard.scan('a', [] as unknown[], [], () => undefined)).toThrow(new AssertionError(invalidations))
        })
      })

      it('substitute', () => {
        const customGuard = new Guard({
          name: 'CustomGuard',
          arguments: [],
          type: ['any'],
        })
        const guard = customGuard.exclude(['a'])
        expect(
          guard.substitute([], (_, substituteGuard) => {
            // eslint-disable-next-line vitest/no-conditional-in-test -- Must be fixed in a later refactor
            if (substituteGuard.type[0] === 'any') {
              return string()
            }
            return substituteGuard
          }),
        ).toStrictEqual(string())
      })
    })
  })

  describe('extract', () => {
    it('should create a guard from values', () => {
      const customGuard = new Guard({
        name: 'CustomGuard',
        arguments: [],
        type: ['any'],
      })
      const guard = customGuard.extract([1, 2, 3])
      expect(guard.equals(enums([1, 2, 3]))).toBe(true)
    })
    it('should throw error when not accepting', () => {
      const customGuard = new Guard({
        name: 'CustomGuard',
        arguments: [],
        type: ['string'],
        accept(input): input is string {
          // eslint-disable-next-line vitest/no-conditional-in-test -- Must be fixed in a later refactor
          return typeof input === 'string' && input === input.toLowerCase()
        },
      })
      expect(() => customGuard.extract(['a', 'b', 'B'])).toThrow('Value B is not valid and cannot be extracted')
    })
  })
})
