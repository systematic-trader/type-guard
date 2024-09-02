import { describe, it } from 'std/testing/bdd.ts'
import { expect } from 'std/expect/mod.ts'

import { assertType } from '../helpers.ts'
import { literal } from '../literal.ts'
import { model, ModelGuard } from '../model.ts'
import { ObjectGuard } from '../object.ts'

// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- Testing
import type { Guard, GuardType } from '../guard.ts'
import type { Equals } from '../helpers.ts'
import type { ModelProps } from '../model.ts'

abstract class Model {
  readonly [key: string]: Guard<unknown>
}

class User extends Model {
  readonly friend = model(User)
  readonly name = literal('xyz')
}

describe('model', () => {
  // eslint-disable-next-line vitest/expect-expect -- TypeScript checking
  it('typescript', () => {
    const guard = model(User)

    assertType<
      Equals<
        GuardType<typeof guard>,
        {
          readonly name: 'xyz'
          readonly friend: { readonly [P in keyof ModelProps<typeof User>]: GuardType<ModelProps<typeof User>[P]> }
        }
      >
    >(1)
  })

  it('instanceof', () => {
    const guard = model(User)

    expect(guard).toBeInstanceOf(ObjectGuard)
    expect(guard).toBeInstanceOf(ModelGuard)
  })

  describe('properties', () => {
    const guard = model(User)

    it('name', () => {
      expect(guard.name).toBe('model')
    })

    it('props', () => {
      expect(Object.keys(guard.props)).toStrictEqual(['friend', 'name'])

      expect(guard.props.name.equals(literal('xyz'))).toBe(true)
      expect(guard.props.friend).toStrictEqual(model(User))
    })

    it('arguments', () => {
      expect(guard.arguments).toStrictEqual([
        {
          extendable: undefined,
          mask: undefined,
          props: guard.props,
        },
      ])
    })

    it('type', () => {
      expect(guard.type).toStrictEqual(['object'])
    })
  })
})
