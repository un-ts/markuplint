import type { MLASTDocument } from '@markuplint/ml-ast'

import { parser } from 'markuplint-angular-parser'

const map = new WeakMap<object, true>()

const deleteKeys = <T extends object>(node: T, keys: string[]) => {
  for (const key of Object.keys(node)) {
    if (keys.includes(key) || key.startsWith('_')) {
      delete node[key as keyof T]
    }
  }
  return node
}

export const _cleanParse = <T extends object>(nodes: T) => {
  for (const _key of Object.keys(nodes)) {
    const key = _key as keyof T

    const node = nodes[key] as unknown as object | null

    if (!node || typeof node !== 'object' || map.get(node)) {
      continue
    }

    map.set(node, true)

    if (!Array.isArray(node)) {
      deleteKeys(node, [
        'uuid',
        'childNodes',
        'parentNode',
        'prevNode',
        'nextNode',
        'pearNode',
      ])
    }

    _cleanParse(node)
  }

  if (Array.isArray(nodes)) {
    nodes.splice(
      0,
      nodes.length,
      ...(nodes as Array<{ type?: string } | null>).filter(
        node => node?.type !== 'omittedtag',
      ),
    )
  }

  return nodes
}

export const cleanParse = (textOrDocument: MLASTDocument | string) =>
  _cleanParse(
    typeof textOrDocument === 'string'
      ? parser.parse(textOrDocument)
      : textOrDocument,
  )
