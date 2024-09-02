import { describe, it } from 'std/testing/bdd.ts'
import { expect } from 'std/expect/mod.ts'

import { any } from '../any.ts'
import { constructor } from '../constructor.ts'
import { Guard } from '../guard.ts'
import { assertType } from '../helpers.ts'

import type { Invalidation } from '../errors.ts'
import type { GuardType } from '../guard.ts'
import type { Equals } from '../helpers.ts'

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Testing
class MyClass {}
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Testing
class MyOtherClass {}

describe('constructor', () => {
  describe('typescript', () => {
    // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
    it('class', () => {
      const guard = constructor(MyClass)
      assertType<Equals<GuardType<typeof guard>, typeof MyClass>>(1)
    })

    // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
    it('subclass', () => {
      class MySubClass extends MyClass {}
      const guard = constructor(MySubClass)
      assertType<Equals<GuardType<typeof guard>, typeof MyClass>>(1)
      assertType<Equals<GuardType<typeof guard>, typeof MySubClass>>(1)
    })

    // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
    it('object', () => {
      const guard = constructor(Object)
      assertType<Equals<GuardType<typeof guard>, typeof Object>>(1)
    })
  })

  describe('properties', () => {
    const guard = constructor(MyClass)

    it('name', () => {
      expect(guard.name).toBe('constructor')
    })

    it('arguments', () => {
      expect(guard.arguments).toStrictEqual([MyClass])
    })

    it('type', () => {
      expect(guard.type).toStrictEqual(['function'])
    })
  })

  describe('accept', () => {
    class MySubClass extends MyClass {}
    const guard = constructor(MyClass)

    const cases = {
      symbol: { value: Symbol(''), accepts: false },
      boolean: { value: true, accepts: false },
      string: { value: 'abc', accepts: false },
      number: { value: 1, accepts: false },
      bigint: { value: 1n, accepts: false },
      // eslint-disable-next-line unicorn/no-null -- Testing
      null: { value: null, accepts: false },
      undefined: { value: undefined, accepts: false },
      class: { value: MyClass, accepts: true },
      subclass: { value: MySubClass, accepts: true },
    }

    for (const [name, { value, accepts }] of Object.entries(cases)) {
      it(`accept ${name}`, () => {
        expect(guard.accept(value)).toBe(accepts)
      })
    }
  })

  describe('validate', () => {
    class MySubClass extends MyClass {}

    const guard = constructor(MyClass)

    const tests = {
      boolean: {
        value: true,
        invalidations: [{ rule: 'type', path: [], setting: ['function'], actual: 'boolean' }],
      },
      string: {
        value: 'abc',
        invalidations: [{ rule: 'type', path: [], setting: ['function'], actual: 'string' }],
      },
      number: {
        value: 1,
        invalidations: [{ rule: 'type', path: [], setting: ['function'], actual: 'number' }],
      },
      bigint: {
        value: 1n,
        invalidations: [{ rule: 'type', path: [], setting: ['function'], actual: 'bigint' }],
      },
      null: {
        // eslint-disable-next-line unicorn/no-null -- Testing
        value: null,
        invalidations: [{ rule: 'type', path: [], setting: ['function'], actual: 'null' }],
      },
      undefined: {
        value: undefined,
        invalidations: [{ rule: 'type', path: [], setting: ['function'], actual: 'undefined' }],
      },
      symbol: {
        value: Symbol(''),
        invalidations: [{ rule: 'type', path: [], setting: ['function'], actual: 'symbol' }],
      },
      MyOtherClass: {
        value: MyOtherClass,
        invalidations: [
          {
            rule: 'logical',
            guard: 'constructor',
            path: [],
            function: 'class',
            setting: MyClass.name,
            actual: MyOtherClass,
          },
        ],
      },
      MyClass: {
        value: MyClass,
        invalidations: [],
      },
      MySubClass: {
        value: MySubClass,
        invalidations: [],
      },
    }

    for (const [name, data] of Object.entries(tests)) {
      it(name, () => {
        const invalidations: Invalidation[] = []
        guard.validate(data.value, [], invalidations)
        expect(invalidations).toStrictEqual(data.invalidations)
      })
    }
  })

  it('coerce', () => {
    const guard = constructor(MyClass)

    expect(guard.coerce).toBe(Guard.prototype.coerce)
  })

  it('convert', () => {
    const guard = constructor(MyClass)

    expect(guard.convert).toBe(Guard.prototype.convert)
  })

  it('exclude', () => {
    const guard = constructor(MyClass)

    expect(guard.exclude).toBe(Guard.prototype.exclude)
  })

  it('extract', () => {
    const guard = constructor(MyClass)

    expect(guard.extract).toBe(Guard.prototype.extract)
  })

  it('inspect', () => {
    const guard = constructor(MyClass)

    expect(guard.inspect).toBe(Guard.prototype.inspect)
  })

  it('scan', () => {
    const guard = constructor(MyClass)

    expect(guard.scan).toBe(Guard.prototype.scan)
  })

  it('substitute', () => {
    const guard = constructor(MyClass)

    expect(guard.substitute).toBe(Guard.prototype.substitute)
  })

  it('toString', () => {
    const guard = constructor(MyClass)

    expect(guard.toString()).toBe('typeof MyClass')
  })

  describe('equals', () => {
    it('constructor(MyClass), constructor(MyClass)', () => {
      const guard1 = constructor(MyClass)
      const guard2 = constructor(MyClass)

      expect(guard1.equals(guard2)).toBe(true)
      expect(guard2.equals(guard1)).toBe(true)
    })

    it('constructor(MyClass), constructor(MySubClass)', () => {
      const guard1 = constructor(MyClass)
      const guard2 = constructor(MyOtherClass)

      expect(guard1.equals(guard2)).toBe(false)
      expect(guard2.equals(guard1)).toBe(false)
    })

    it('constructor(MyClass), any()', () => {
      const guard1 = constructor(MyClass)
      const guard2 = any()

      expect(guard1.equals(guard2)).toBe(false)
      expect(guard2.equals(guard1)).toBe(false)
    })
  })
})
