export function pathLiteral(path: ReadonlyArray<number | string | symbol>): string {
  let literal = ''

  // eslint-disable-next-line unicorn/no-for-loop, @typescript-eslint/prefer-for-of -- performance
  for (let index = 0; index < path.length; index++) {
    const pathItem = path[index]

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- false positive
    if (pathItem === null) {
      literal += '[null]'
    } else if (pathItem === undefined) {
      literal += '[undefined]'
    } else {
      switch (typeof pathItem) {
        case 'string': {
          literal += `["${pathItem}"]`
          break
        }

        case 'symbol': {
          literal += `[${pathItem.toString()}]`
          break
        }

        default: {
          literal += `[${pathItem}]`
          break
        }
      }
    }
  }

  return literal
}
