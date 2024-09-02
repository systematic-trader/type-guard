import { describe, it } from 'std/testing/bdd.ts'
import { expect } from 'std/expect/mod.ts'

import { assertType } from '../helpers.ts'
import { integer } from '../integer.ts'
import { number } from '../number.ts'

import type { GuardType } from '../guard.ts'
import type { Equals } from '../helpers.ts'

describe('integer', () => {
  // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
  it('typescript', () => {
    const guard = integer()
    assertType<Equals<GuardType<typeof guard>, number>>(1)
  })

  describe('properties', () => {
    const guard = integer()
    it('name', () => {
      expect(guard.name).toBe('number')
    })

    it('arguments', () => {
      expect(guard.arguments).toStrictEqual([{ precision: 0 }])
    })

    it('type', () => {
      expect(guard.type).toStrictEqual(['number'])
    })
  })

  describe('settings errors', () => {
    const tests = {
      exclusiveMaximum: '"exclusiveMaximum" must be undefined or be an integer',
      exclusiveMinimum: '"exclusiveMinimum" must be undefined or be an integer',
      maximum: '"maximum" must be undefined or be an integer',
      minimum: '"minimum" must be undefined or be an integer',
      parity:
        '"parity" must be undefined, "even" or "odd" or an object with "multipleOf" of integer and an optional "offset" of integer',
    }

    for (const [name, data] of Object.entries(tests)) {
      it(name, () => {
        expect(() => integer({ [name]: 'invalid' })).toThrow(data)
      })
    }
  })

  describe('integer is a number', () => {
    it('no settings', () => {
      const integerGuard = integer()
      const numberGuard = number({ precision: 0 })

      expect(integerGuard.equals(numberGuard)).toBe(true)
      expect(numberGuard.equals(integerGuard)).toBe(true)
    })

    it('with settings', () => {
      const settings = { maximum: 1, exclusiveMinimum: 1, exclusiveMaximum: 1, minimum: 1 }
      const integerGuard = integer(settings)
      const numberGuard = number({ precision: 0, ...settings })

      expect(integerGuard.equals(numberGuard)).toBe(true)
      expect(numberGuard.equals(integerGuard)).toBe(true)
    })
  })
})
