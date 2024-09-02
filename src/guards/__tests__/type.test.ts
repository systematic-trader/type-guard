import { describe, it } from 'std/testing/bdd.ts'
import { expect } from 'std/expect/mod.ts'

import { any } from '../any.ts'
import { assertType } from '../helpers.ts'
import { type } from '../type.ts'

import type { Invalidation } from '../errors.ts'
import type { GuardType } from '../guard.ts'
import type { Equals } from '../helpers.ts'

describe('type', () => {
  // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
  it('typescript', () => {
    const guard = type('number')
    assertType<Equals<GuardType<typeof guard>, number>>(1)
  })

  describe('properties', () => {
    describe('string', () => {
      const guard = type('string')

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

    describe("['string', 'number']", () => {
      const guard = type(['string', 'number'])

      it('name', () => {
        expect(guard.name).toBe('type')
      })

      it('arguments', () => {
        expect(guard.arguments).toStrictEqual([['number', 'string']])
      })

      it('type', () => {
        expect(guard.type).toStrictEqual(['number', 'string'])
      })
    })

    describe('[]', () => {
      const guard = type([])

      it('name', () => {
        expect(guard.name).toBe('type')
      })

      it('arguments', () => {
        expect(guard.arguments).toStrictEqual([['never']])
      })

      it('type', () => {
        expect(guard.type).toStrictEqual(['never'])
      })
    })
  })

  // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
  it('accept', () => {
    const guard = type(['string', 'number'])

    // eslint-disable-next-line vitest/no-conditional-in-test -- TypeScript checking
    if (guard.accept(undefined as unknown)) {
      assertType<Equals<GuardType<typeof guard>, number | string>>(1)
    }
  })

  describe('multiple types', () => {
    it("['string', 'any']", () => {
      const guard = type(['string', 'any'])

      expect(guard.type).toStrictEqual(['any'])
      expect(guard.accept(2)).toBe(true)
    })

    it("['string', 'unknown']", () => {
      const guard = type(['string', 'unknown'])

      expect(guard.type).toStrictEqual(['unknown'])
      expect(guard.accept(2)).toBe(true)
    })

    it("['string', 'never']", () => {
      const guard = type(['string', 'never'])

      expect(guard.type).toStrictEqual(['string'])
      expect(guard.accept(2)).toBe(false)
    })
  })

  const cases = {
    any: {
      typescript: 'any',
      values: {
        bigint: {
          value: 1n,
          accepts: true,
          invalidations: [],
        },
        boolean: {
          value: true,
          accepts: true,
          invalidations: [],
        },
        function: {
          value: () => undefined,
          accepts: true,
          invalidations: [],
        },
        null: {
          // eslint-disable-next-line unicorn/no-null -- Testing
          value: null,
          accepts: true,
          invalidations: [],
        },
        number: {
          value: 1,
          accepts: true,
          invalidations: [],
        },
        object: {
          value: {},
          accepts: true,
          invalidations: [],
        },
        string: {
          value: 'foo',
          accepts: true,
          invalidations: [],
        },
        symbol: {
          value: Symbol(''),
          accepts: true,
          invalidations: [],
        },
        undefined: {
          value: undefined,
          accepts: true,
          invalidations: [],
        },
      },
    },
    bigint: {
      typescript: 'bigint',
      values: {
        bigint: {
          value: 1n,
          accepts: true,
          invalidations: [],
        },
        boolean: {
          value: true,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['bigint'], actual: 'boolean' }],
        },
        function: {
          value: () => undefined,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['bigint'], actual: 'function' }],
        },
        null: {
          // eslint-disable-next-line unicorn/no-null -- Testing
          value: null,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['bigint'], actual: 'null' }],
        },
        number: {
          value: 1,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['bigint'], actual: 'number' }],
        },
        object: {
          value: {},
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['bigint'], actual: 'object' }],
        },
        string: {
          value: 'foo',
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['bigint'], actual: 'string' }],
        },
        symbol: {
          value: Symbol(''),
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['bigint'], actual: 'symbol' }],
        },
        undefined: {
          value: undefined,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['bigint'], actual: 'undefined' }],
        },
      },
    },
    boolean: {
      typescript: 'boolean',
      values: {
        bigint: {
          value: 1n,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['boolean'], actual: 'bigint' }],
        },
        boolean: {
          value: true,
          accepts: true,
          invalidations: [],
        },
        function: {
          value: () => undefined,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['boolean'], actual: 'function' }],
        },
        null: {
          // eslint-disable-next-line unicorn/no-null -- Testing
          value: null,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['boolean'], actual: 'null' }],
        },
        number: {
          value: 1,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['boolean'], actual: 'number' }],
        },
        object: {
          value: {},
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['boolean'], actual: 'object' }],
        },
        string: {
          value: 'foo',
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['boolean'], actual: 'string' }],
        },
        symbol: {
          value: Symbol(''),
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['boolean'], actual: 'symbol' }],
        },
        undefined: {
          value: undefined,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['boolean'], actual: 'undefined' }],
        },
      },
    },
    function: {
      typescript: '((...args: readonly unknown[]) => unknown))',
      values: {
        bigint: {
          value: 1n,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['function'], actual: 'bigint' }],
        },
        boolean: {
          value: true,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['function'], actual: 'boolean' }],
        },
        function: {
          value: () => undefined,
          accepts: true,
          invalidations: [],
        },
        null: {
          // eslint-disable-next-line unicorn/no-null -- Testing
          value: null,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['function'], actual: 'null' }],
        },
        number: {
          value: 1,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['function'], actual: 'number' }],
        },
        object: {
          value: {},
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['function'], actual: 'object' }],
        },
        string: {
          value: 'foo',
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['function'], actual: 'string' }],
        },
        symbol: {
          value: Symbol(''),
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['function'], actual: 'symbol' }],
        },
        undefined: {
          value: undefined,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['function'], actual: 'undefined' }],
        },
      },
    },
    null: {
      typescript: 'null',
      values: {
        bigint: {
          value: 1n,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['null'], actual: 'bigint' }],
        },
        boolean: {
          value: true,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['null'], actual: 'boolean' }],
        },
        function: {
          value: () => undefined,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['null'], actual: 'function' }],
        },
        null: {
          // eslint-disable-next-line unicorn/no-null -- Testing
          value: null,
          accepts: true,
          invalidations: [],
        },
        number: {
          value: 1,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['null'], actual: 'number' }],
        },
        object: {
          value: {},
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['null'], actual: 'object' }],
        },
        string: {
          value: 'foo',
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['null'], actual: 'string' }],
        },
        symbol: {
          value: Symbol(''),
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['null'], actual: 'symbol' }],
        },
        undefined: {
          value: undefined,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['null'], actual: 'undefined' }],
        },
      },
    },
    number: {
      typescript: 'number',
      values: {
        bigint: {
          value: 1n,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['number'], actual: 'bigint' }],
        },
        boolean: {
          value: true,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['number'], actual: 'boolean' }],
        },
        function: {
          value: () => undefined,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['number'], actual: 'function' }],
        },
        null: {
          // eslint-disable-next-line unicorn/no-null -- Testing
          value: null,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['number'], actual: 'null' }],
        },
        number: {
          value: 1,
          accepts: true,
          invalidations: [],
        },
        object: {
          value: {},
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['number'], actual: 'object' }],
        },
        string: {
          value: 'foo',
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['number'], actual: 'string' }],
        },
        symbol: {
          value: Symbol(''),
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['number'], actual: 'symbol' }],
        },
        undefined: {
          value: undefined,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['number'], actual: 'undefined' }],
        },
      },
    },
    object: {
      typescript: 'Record<number | string | symbol, unknown>',
      values: {
        bigint: {
          value: 1n,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['object'], actual: 'bigint' }],
        },
        boolean: {
          value: true,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['object'], actual: 'boolean' }],
        },
        function: {
          value: () => undefined,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['object'], actual: 'function' }],
        },
        null: {
          // eslint-disable-next-line unicorn/no-null -- Testing
          value: null,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['object'], actual: 'null' }],
        },
        number: {
          value: 1,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['object'], actual: 'number' }],
        },
        object: {
          value: {},
          accepts: true,
          invalidations: [],
        },
        string: {
          value: 'foo',
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['object'], actual: 'string' }],
        },
        symbol: {
          value: Symbol(''),
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['object'], actual: 'symbol' }],
        },
        undefined: {
          value: undefined,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['object'], actual: 'undefined' }],
        },
      },
    },
    string: {
      typescript: 'string',
      values: {
        bigint: {
          value: 1n,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['string'], actual: 'bigint' }],
        },
        boolean: {
          value: true,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['string'], actual: 'boolean' }],
        },
        function: {
          value: () => undefined,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['string'], actual: 'function' }],
        },
        null: {
          // eslint-disable-next-line unicorn/no-null -- Testing
          value: null,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['string'], actual: 'null' }],
        },
        number: {
          value: 1,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['string'], actual: 'number' }],
        },
        object: {
          value: {},
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['string'], actual: 'object' }],
        },
        string: {
          value: 'foo',
          accepts: true,
          invalidations: [],
        },
        symbol: {
          value: Symbol(''),
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['string'], actual: 'symbol' }],
        },
        undefined: {
          value: undefined,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['string'], actual: 'undefined' }],
        },
      },
    },
    symbol: {
      typescript: 'symbol',
      values: {
        bigint: {
          value: 1n,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['symbol'], actual: 'bigint' }],
        },
        boolean: {
          value: true,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['symbol'], actual: 'boolean' }],
        },
        function: {
          value: () => undefined,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['symbol'], actual: 'function' }],
        },
        null: {
          // eslint-disable-next-line unicorn/no-null -- Testing
          value: null,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['symbol'], actual: 'null' }],
        },
        number: {
          value: 1,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['symbol'], actual: 'number' }],
        },
        object: {
          value: {},
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['symbol'], actual: 'object' }],
        },
        string: {
          value: 'foo',
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['symbol'], actual: 'string' }],
        },
        symbol: {
          value: Symbol(''),
          accepts: true,
          invalidations: [],
        },
        undefined: {
          value: undefined,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['symbol'], actual: 'undefined' }],
        },
      },
    },
    undefined: {
      typescript: 'undefined',
      values: {
        bigint: {
          value: 1n,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['undefined'], actual: 'bigint' }],
        },
        boolean: {
          value: true,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['undefined'], actual: 'boolean' }],
        },
        function: {
          value: () => undefined,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['undefined'], actual: 'function' }],
        },
        null: {
          // eslint-disable-next-line unicorn/no-null -- Testing
          value: null,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['undefined'], actual: 'null' }],
        },
        number: {
          value: 1,
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['undefined'], actual: 'number' }],
        },
        object: {
          value: {},
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['undefined'], actual: 'object' }],
        },
        string: {
          value: 'foo',
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['undefined'], actual: 'string' }],
        },
        symbol: {
          value: Symbol(''),
          accepts: false,
          invalidations: [{ rule: 'type', path: [], setting: ['undefined'], actual: 'symbol' }],
        },
        undefined: {
          value: undefined,
          accepts: true,
          invalidations: [],
        },
      },
    },
  }

  for (const [typeName, { typescript, values }] of Object.entries(cases)) {
    describe(typeName, () => {
      const guard = type(typeName as Parameters<typeof type>[0])

      it('typescript', () => {
        expect(guard.toString()).toBe(typescript)
      })

      for (const [name, { value, accepts, invalidations: expectedInvalidations }] of Object.entries(values)) {
        it(name, () => {
          expect(guard.accept(value)).toBe(accepts)

          const invalidations: Invalidation[] = []
          expect(guard.validate(value, [], invalidations)).toBe(expectedInvalidations.length === 0)
          expect(invalidations).toStrictEqual(expectedInvalidations)
        })
      }
    })
  }

  describe('equals', () => {
    it("type('number'), type('number')", () => {
      const guard1 = type('number')
      const guard2 = type('number')

      expect(guard1.equals(guard2)).toBe(true)
      expect(guard2.equals(guard1)).toBe(true)
    })

    it("type('string'), type('string')", () => {
      const guard1 = type('string')
      const guard2 = type('string')

      expect(guard1.equals(guard2)).toBe(true)
      expect(guard2.equals(guard1)).toBe(true)
    })

    it("type('number'), type('string')", () => {
      const guard1 = type('number')
      const guard2 = type('string')

      expect(guard1.equals(guard2)).toBe(false)
      expect(guard2.equals(guard1)).toBe(false)
    })

    it("type('number'), any()", () => {
      const guard1 = type('number')
      const guard2 = any()

      expect(guard1.equals(guard2)).toBe(false)
      expect(guard2.equals(guard1)).toBe(false)
    })
  })
})
