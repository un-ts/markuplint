import type { MLASTToken } from '@markuplint/ml-ast'

import { isCustomElementName } from './is-custom-element-name.js'
import { tokenizer } from './tokenizer.js'

const reTag = /^<([\s\S]+)>\s*$/
const reTagName = /^[a-z][^\0\t\n\f\u0020/>]*/i

// eslint-disable-next-line sonarjs/slow-regex
const reEndTokens = /(\s*\/)?\s*>$/

export default function parseSelfClosingSolidus(
  raw: string,
  startLine: number,
  startCol: number,
  startOffset: number,
): MLASTToken {
  let offset = startOffset
  const line = startLine
  let col = startCol

  const matched = reTag.exec(raw)
  const tagWithAttrs = matched?.[1]

  if (!tagWithAttrs) {
    throw new SyntaxError(`Invalid tag syntax: "${raw}"`)
  }

  const tagNameSplitted = tagWithAttrs.split(/[\0\t\n\f\u0020/>]/)
  const tagName = tagNameSplitted[0] || tagNameSplitted[1]
  if (!tagName || (!reTagName.test(tagName) && !isCustomElementName(tagName))) {
    throw new SyntaxError(`Invalid tag name: "${tagName}" in <${tagWithAttrs}>`)
  }

  const tagStartPos = tagWithAttrs.indexOf(tagName)

  col += tagName.length + 1 + tagStartPos
  offset += tagName.length + 1 + tagStartPos

  const endTokens = reEndTokens.exec(raw)

  return tokenizer(endTokens?.[1], line, col, offset)
}
