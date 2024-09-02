export type Equals<A1, A2> = (<A>() => A extends A2 ? 1 : 0) extends <A>() => A extends A1 ? 1 : 0 ? 1 : 0

export const assertType = <T extends 1 | true>(_: T): undefined => undefined
