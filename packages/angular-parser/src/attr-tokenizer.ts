/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import type { MLASTHTMLAttr } from '@markuplint/ml-ast'

import { tokenizer } from './tokenizer.js'

/**
 * `/` is allowed in the name: while brackets are open, the Angular lexer only ends an
 * attribute name at a newline, which is what makes bindings such as `[class.w-1/2]`,
 * `[style.--my-var]` and `[attr.xlink:href]` possible.
 *
 * https://github.com/angular/angular/blob/e699fd72de588b98a10efefdd37e43ed1d3f2198/packages/compiler/src/ml_parser/lexer.ts#L1068-L1087
 * https://github.com/angular/angular/blob/e699fd72de588b98a10efefdd37e43ed1d3f2198/packages/compiler/src/ml_parser/lexer.ts#L1497-L1508
 */
const reAttrsInStartTag =
  // eslint-disable-next-line regexp/no-misleading-capturing-group, regexp/no-super-linear-backtracking, sonarjs/regex-complexity, sonarjs/super-linear-regex
  /(\s*)([^\u0000-\u001F\u007F-\u009F "'>=]+)(?:(\s*)(=)(\s*)(?:"([^"]*)"|'([^']*)'|(\S*)))?/

export default function attrTokenizer(
  raw: string,
  line: number,
  col: number,
  startOffset: number,
  isDynamicValue?: true,
): MLASTHTMLAttr {
  const attrMatched = reAttrsInStartTag.exec(raw)
  if (!attrMatched) {
    throw new SyntaxError('Illegal attribute token')
  }

  const spacesBeforeAttrString = attrMatched[1] ?? ''
  const nameChars = attrMatched[2] ?? ''
  const spacesBeforeEqualChars = attrMatched[3] ?? ''
  const equalChars = attrMatched[4] ?? null
  const spacesAfterEqualChars = attrMatched[5] ?? ''
  const quoteChars =
    attrMatched[6] == null && attrMatched[7] == null ? null : '"'
  const valueChars =
    attrMatched[6] ??
    attrMatched[7] ??
    attrMatched[8] ??
    (quoteChars ? '' : null)

  let offset = startOffset

  const spacesBeforeName = tokenizer(spacesBeforeAttrString, line, col, offset)
  line = spacesBeforeName.endLine
  col = spacesBeforeName.endCol
  offset = spacesBeforeName.endOffset

  const name = tokenizer(nameChars, line, col, offset)
  line = name.endLine
  col = name.endCol
  offset = name.endOffset

  const spacesBeforeEqual = tokenizer(spacesBeforeEqualChars, line, col, offset)
  line = spacesBeforeEqual.endLine
  col = spacesBeforeEqual.endCol
  offset = spacesBeforeEqual.endOffset

  const equal = tokenizer(equalChars, line, col, offset)
  line = equal.endLine
  col = equal.endCol
  offset = equal.endOffset

  const spacesAfterEqual = tokenizer(spacesAfterEqualChars, line, col, offset)
  line = spacesAfterEqual.endLine
  col = spacesAfterEqual.endCol
  offset = spacesAfterEqual.endOffset

  const startQuote = tokenizer(quoteChars, line, col, offset)
  line = startQuote.endLine
  col = startQuote.endCol
  offset = startQuote.endOffset

  const value = tokenizer(valueChars, line, col, offset)
  line = value.endLine
  col = value.endCol
  offset = value.endOffset

  const endQuote = tokenizer(quoteChars, line, col, offset)

  const attrToken = tokenizer(
    nameChars +
      spacesBeforeEqualChars +
      (equalChars ?? '') +
      spacesAfterEqualChars +
      (quoteChars ?? '') +
      (valueChars ?? '') +
      (quoteChars ?? ''),
    name.token.line,
    name.token.col,
    name.token.offset,
  )

  return {
    type: 'attr',
    ...attrToken.token,
    spacesBeforeName: spacesBeforeName.token,
    name: name.token,
    spacesBeforeEqual: spacesBeforeEqual.token,
    equal: equal.token,
    spacesAfterEqual: spacesAfterEqual.token,
    startQuote: startQuote.token,
    value: value.token,
    endQuote: endQuote.token,
    isDuplicatable: false,
    nodeName: name.token.raw,
    isDynamicValue,
  }
}
