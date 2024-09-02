import { Guard } from './guard.ts'
import { ObjectGuard } from './object.ts'

import type { GuardType } from './guard.ts'
import type { ObjectGuardSettings } from './object.ts'

const ModelGuards = new WeakMap<object, ModelGuard<ModelConstructor>>()

const ModelExtenableGuards = new WeakMap<object, ModelGuard<ModelConstructor>>()

const ModelMaskGuards = new WeakMap<object, ModelGuard<ModelConstructor>>()

const ModelExtenableMaskGuards = new WeakMap<object, ModelGuard<ModelConstructor>>()

export const model = <Model extends ModelConstructor>(
  modelConstructor: Model,
  settings: ModelGuardSettings = {},
): ModelGuard<Model> => {
  const existing = settings.extendable === true && settings.mask === true
    ? ModelExtenableMaskGuards.get(modelConstructor)
    : settings.extendable === true
    ? ModelExtenableGuards.get(modelConstructor)
    : settings.mask === true
    ? ModelMaskGuards.get(modelConstructor)
    : ModelGuards.get(modelConstructor)

  if (existing !== undefined) {
    return existing as ModelGuard<Model>
  }

  return new ModelGuard(modelConstructor, settings)
}

export interface ModelGuardSettings extends Pick<ObjectGuardSettings, 'extendable' | 'mask'> {}

export type RemoveIndex<T> = {
  readonly [P in keyof T as string extends P ? never : number extends P ? never : P]: T[P]
}

export type ModelInstanceType<M extends Readonly<Record<number | string, Guard<unknown>>>> = {
  readonly [K in keyof RemoveIndex<M>]: GuardType<M[K]>
}

export type ModelGuardType<Model extends ModelConstructor> = ModelInstanceType<InstanceType<Model>>

// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style, functional/prefer-readonly-type -- Required
type ModelConstructor = new () => { [key: string]: Guard<unknown> }

export type ModelProps<Model extends ModelConstructor> = {
  readonly [P in keyof RemoveIndex<InstanceType<Model>>]: InstanceType<Model>[P]
}

// eslint-disable-next-line functional/prefer-readonly-type -- Required
export class ModelGuard<Model extends ModelConstructor> extends ObjectGuard<
  {
    [P in keyof RemoveIndex<InstanceType<Model>>]: InstanceType<Model>[P]
  }
> {
  readonly model: Model

  constructor(modelConstructor: Model, settings: ModelGuardSettings = {}) {
    let props: undefined | Record<string, Guard<unknown>> = undefined

    super({
      extendable: settings.extendable,

      mask: settings.mask,

      get props() {
        if (props !== undefined) {
          return props
        }

        props = new modelConstructor()

        for (const propertyKey in props) {
          const propertyGuard = props[propertyKey]

          if (propertyGuard instanceof Guard === false) {
            throw new TypeError(`Property ${modelConstructor.name}["${propertyKey}"] must be an instance of Guard`)
          }

          if (propertyGuard instanceof ModelGuard) {
            props[propertyKey] = propertyGuard.model === modelConstructor &&
                propertyGuard.extendable === settings.extendable &&
                propertyGuard.mask === settings.mask
              ? self
              : model(propertyGuard.model, {
                extendable: propertyGuard.extendable,
                mask: propertyGuard.mask,
              })
          }
        }

        return props
      },
    })

    if (this.constructor === ModelGuard) {
      if (settings.extendable === true && settings.mask === true) {
        ModelExtenableMaskGuards.set(modelConstructor, this)
      } else if (settings.extendable === true) {
        ModelExtenableGuards.set(modelConstructor, this)
      } else if (settings.mask === true) {
        ModelMaskGuards.set(modelConstructor, this)
      } else {
        ModelGuards.set(modelConstructor, this)
      }
    }

    // deno-lint-ignore no-this-alias
    const self = this

    Reflect.set(this, 'name', 'model')

    this.model = modelConstructor
  }

  override equals(other: unknown): other is ModelGuard<Model> {
    if (this === other) {
      return true
    }

    return (
      other instanceof ModelGuard &&
      other.model === this.model &&
      this.extendable === other.extendable &&
      this.mask === other.mask
    )
  }
}
