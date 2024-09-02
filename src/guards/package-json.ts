// import { array } from './array'
// import { props } from './object'
// import { optional } from './optional'
// import { string, format } from './string'

// export interface PackageJSON {
//   readonly private?: boolean
//   readonly name?: string
//   readonly version?: string
//   readonly description?: string
//   readonly main?: string
//   readonly module?: string
//   readonly types?: string
//   readonly typings?: string
//   readonly files?: string[]
//   readonly scripts?: Record<string, string>
//   readonly repository?: string | { readonly type: string; readonly url: string }
//   readonly keywords?: string[]
//   readonly author?: string
//   readonly license?: string
//   readonly bugs?: string | { readonly url: string }
//   readonly homepage?: string
//   readonly dependencies?: Record<string, string>
//   readonly devDependencies?: Record<string, string>
//   readonly peerDependencies?: Record<string, string>
//   readonly optionalDependencies?: Record<string, string>
//   readonly engines?: Record<string, string>
//   readonly os?: string[]
//   readonly cpu?: string[]
//   readonly preferGlobal?: boolean
//   readonly publishConfig?: Record<string, string>
// }

// export const PackageJSON = props(
//   {
//     name: optional(string({ blank: false, length: { maximum: 214 } })),
//     version: optional(format('semantic-version')),
//     description: optional(string({ blank: false })),
//     keywords: optional(array(string({ blank: false }))),
//     homepage: optional(string({ blank: false })),
//     bugs: optional(string({ blank: false }))
//   },
//   { extendable: true }
// )
export {}
