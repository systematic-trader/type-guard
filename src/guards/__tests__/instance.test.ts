import { describe, it } from 'std/testing/bdd.ts'
import { expect } from 'std/expect/mod.ts'

import { Guard } from '../guard.ts'
import { assertType } from '../helpers.ts'
import { instance } from '../instance.ts'

import type { Invalidation } from '../errors.ts'
import type { GuardType } from '../guard.ts'
import type { Equals } from '../helpers.ts'

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Test class
class MyClass {}
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Test class
class MyOtherClass {}

describe('instance', () => {
  describe('typescript', () => {
    // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
    it('object', () => {
      const guard = instance(Object)
      // deno-lint-ignore ban-types
      assertType<Equals<GuardType<typeof guard>, Object>>(1)
    })

    // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
    it('myClass', () => {
      const guard = instance(MyClass)
      assertType<Equals<GuardType<typeof guard>, MyClass>>(1)
    })
  })

  describe('properties', () => {
    const guard = instance(MyClass)

    it('name', () => {
      expect(guard.name).toBe('instance')
    })

    it('arguments', () => {
      expect(guard.arguments).toStrictEqual([MyClass])
    })

    it('type', () => {
      expect(guard.type).toStrictEqual(['object'])
    })
  })

  describe('accept', () => {
    describe('myClass', () => {
      class MySubClass extends MyClass {}
      const guard = instance(MyClass)

      const tests = {
        symbol: { value: Symbol(''), accepts: false },
        boolean: { value: true, accepts: false },
        string: { value: 'abc', accepts: false },
        number: { value: 1, accepts: false },
        bigint: { value: 1n, accepts: false },
        // eslint-disable-next-line unicorn/no-null -- Testing
        null: { value: null, accepts: false },
        undefined: { value: undefined, accepts: false },
        Error: { value: new Error('Oh-ooo'), accepts: false },
        MyClass: { value: new MyClass(), accepts: true },
        MySubClass: { value: new MySubClass(), accepts: true },
      }

      for (const [name, data] of Object.entries(tests)) {
        it(`accept ${name}`, () => {
          expect(guard.accept(data.value)).toBe(data.accepts)
        })
      }
    })

    describe('error', () => {
      class MySubClass extends MyClass {}
      const guard = instance(Error)

      const tests = {
        symbol: { value: Symbol(''), accepts: false },
        boolean: { value: true, accepts: false },
        string: { value: 'abc', accepts: false },
        number: { value: 1, accepts: false },
        bigint: { value: 1n, accepts: false },
        // eslint-disable-next-line unicorn/no-null -- Testing
        null: { value: null, accepts: false },
        undefined: { value: undefined, accepts: false },
        Error: { value: new Error('Oh-ooo'), accepts: true },
        TypeError: { value: new TypeError('Oh-ooo'), accepts: true },
        MyClass: { value: new MyClass(), accepts: false },
        MySubClass: { value: new MySubClass(), accepts: false },
      }

      for (const [name, data] of Object.entries(tests)) {
        it(`accept ${name}`, () => {
          expect(guard.accept(data.value)).toBe(data.accepts)
        })
      }
    })
  })

  describe('validate', () => {
    describe('myClass', () => {
      class MySubClass extends MyClass {}

      const guard = instance(MyClass)
      const tests = {
        boolean: {
          value: true,
          invalidations: [{ rule: 'type', path: [], setting: ['object'], actual: 'boolean' }],
        },
        string: {
          value: 'abc',
          invalidations: [{ rule: 'type', path: [], setting: ['object'], actual: 'string' }],
        },
        number: {
          value: 1,
          invalidations: [{ rule: 'type', path: [], setting: ['object'], actual: 'number' }],
        },
        bigint: {
          value: 1n,
          invalidations: [{ rule: 'type', path: [], setting: ['object'], actual: 'bigint' }],
        },
        null: {
          // eslint-disable-next-line unicorn/no-null -- Testing
          value: null,
          invalidations: [{ rule: 'type', path: [], setting: ['object'], actual: 'null' }],
        },
        undefined: {
          value: undefined,
          invalidations: [{ rule: 'type', path: [], setting: ['object'], actual: 'undefined' }],
        },
        symbol: {
          value: Symbol(''),
          invalidations: [{ rule: 'type', path: [], setting: ['object'], actual: 'symbol' }],
        },
        MyClass: {
          value: new MyClass(),
          invalidations: [],
        },
        MySubClass: {
          value: new MySubClass(),
          invalidations: [],
        },
        MyOtherClass: {
          value: new MyOtherClass(),
          invalidations: [
            {
              rule: 'logical',
              guard: 'instance',
              path: [],
              function: 'instanceof',
              setting: MyClass.name,
              actual: 'MyOtherClass',
            },
          ],
        },
      }

      for (const [name, data] of Object.entries(tests)) {
        it(`validate ${name}`, () => {
          const invalidations: Invalidation[] = []
          guard.validate(data.value, [], invalidations)
          expect(invalidations).toStrictEqual(data.invalidations)
        })
      }
    })
  })

  it('coerce', () => {
    const guard = instance(MyClass)

    expect(guard.coerce).toBe(Guard.prototype.coerce)
  })

  it('convert', () => {
    const guard = instance(MyClass)

    expect(guard.convert).toBe(Guard.prototype.convert)
  })

  it('exclude', () => {
    const guard = instance(MyClass)

    expect(guard.exclude).toBe(Guard.prototype.exclude)
  })

  it('extract', () => {
    const guard = instance(MyClass)

    expect(guard.extract).toBe(Guard.prototype.extract)
  })

  it('inspect', () => {
    const guard = instance(MyClass)

    expect(guard.inspect).toBe(Guard.prototype.inspect)
  })

  it('scan', () => {
    const guard = instance(MyClass)

    expect(guard.scan).toBe(Guard.prototype.scan)
  })

  it('substitute', () => {
    const guard = instance(MyClass)

    expect(guard.substitute).toBe(Guard.prototype.substitute)
  })

  it('toString', () => {
    const guard = instance(MyClass)

    expect(guard.toString()).toBe('MyClass')
  })

  describe('equals', () => {
    it('instance(Error), instance(Error)', () => {
      const guard1 = instance(Error)
      const guard2 = instance(Error)

      expect(guard1.equals(guard2)).toBe(true)
      expect(guard2.equals(guard1)).toBe(true)
    })

    it('instance(Error), instance(TypeError)', () => {
      const guard1 = instance(Error)
      const guard2 = instance(TypeError)

      expect(guard1.equals(guard2)).toBe(false)
      expect(guard2.equals(guard1)).toBe(false)
    })
  })
})
