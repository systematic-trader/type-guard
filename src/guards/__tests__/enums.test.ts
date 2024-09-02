import { describe, it } from 'std/testing/bdd.ts'
import { expect } from 'std/expect/mod.ts'

import { enums } from '../enums.ts'
import { literal } from '../literal.ts'
import { never } from '../never.ts'
import { union } from '../union.ts'

describe('enums', () => {
  it('no enums is never', () => {
    const guard1 = enums([])
    const guard2 = never()

    expect(guard1.equals(guard2)).toBe(true)
    expect(guard2.equals(guard1)).toBe(true)
  })

  it('one enum is literal', () => {
    const guard1 = enums([1])
    const guard2 = literal(1)

    expect(guard1.equals(guard2)).toBe(true)
    expect(guard2.equals(guard1)).toBe(true)
  })

  it('more than one enums is a union of literals', () => {
    const guard1 = enums([1, 'A'])
    const guard2 = union([literal(1), literal('A')])

    expect(guard1.equals(guard2)).toBe(true)
    expect(guard2.equals(guard1)).toBe(true)
  })
})
