import type { MLASTToken } from '@markuplint/ml-ast'
import { getEndCol, getEndLine } from '@markuplint/parser-utils/location'
import { v4 as uuid } from 'uuid'

export function tokenizer(
  raw: string | null | undefined,
  startLine: number,
  startCol: number,
  startOffset: number,
): MLASTToken {
  raw ??= ''
  const endLine = getEndLine(raw, startLine)
  const endCol = getEndCol(raw, startCol)
  const endOffset = startOffset + raw.length
  return {
    uuid: uuid(),
    raw,
    startOffset,
    endOffset,
    startLine,
    endLine,
    startCol,
    endCol,
  }
}
