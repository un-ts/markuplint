import type { MLASTToken } from '@markuplint/ml-ast'
import { getEndCol, getEndLine } from '@markuplint/parser-utils/location'
import { v4 as uuid } from 'uuid'

export interface Tokenization {
  token: MLASTToken
  endOffset: number
  endLine: number
  endCol: number
}

export function tokenizer(
  raw: string | null | undefined,
  line: number,
  col: number,
  offset: number,
): Tokenization {
  raw ??= ''
  return {
    token: {
      uuid: uuid(),
      raw,
      offset,
      line,
      col,
    },
    endLine: getEndLine(raw, line),
    endCol: getEndCol(raw, col),
    endOffset: offset + raw.length,
  }
}
