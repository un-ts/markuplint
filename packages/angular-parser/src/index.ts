import { type State, type Node } from '@markuplint/html-parser'
import type {
  MLASTAbstractNode,
  MLASTAttr,
  MLASTChildNode,
  MLASTComment,
  MLASTDoctype,
  MLASTDocument,
  MLASTElement,
  MLASTElementCloseTag,
  MLASTHTMLAttr,
  MLASTNode,
  MLASTNodeTreeItem,
  MLASTParentNode,
  MLASTText,
  MLASTToken,
} from '@markuplint/ml-ast'
import { Parser } from '@markuplint/parser-utils'
import { parse, visitAll } from 'angular-html-parser'
import type {
  Attribute,
  CDATA,
  Comment,
  DocType,
  Expansion,
  ExpansionCase,
  Text,
  Visitor,
} from 'angular-html-parser/lib/compiler/src/ml_parser/ast.js'
import type { ParseSourceSpan } from 'angular-html-parser/lib/compiler/src/parse_util.js'
import type { Writable } from 'type-fest'
import { v4 as uuid } from 'uuid'

import attrTokenizer from './attr-tokenizer.js'
import parseSelfClosingSolidus from './parse-self-closing-solidus.js'

export interface BaseVisitorContext {
  parentNode: MLASTParentNode | null
  text: string
}

export interface VisitorContext<T extends MLASTToken = MLASTNode>
  extends BaseVisitorContext {
  nodeList: T[]
  namespace?: string
}

const getSourceSpan = (
  nodeOrSourceSpan: ParseSourceSpan | { sourceSpan: ParseSourceSpan },
) =>
  'sourceSpan' in nodeOrSourceSpan
    ? nodeOrSourceSpan.sourceSpan
    : nodeOrSourceSpan

const getRaw = (
  nodeOrSourceSpan: ParseSourceSpan | { sourceSpan: ParseSourceSpan } | null,
  text: string,
) => {
  if (!nodeOrSourceSpan) {
    return ''
  }
  const { start, end } = getSourceSpan(nodeOrSourceSpan)
  return text.slice(start.offset, end.offset)
}

export interface NodeMapperOptions<T extends boolean = boolean>
  extends BaseVisitorContext {
  simpleToken?: T
}

function nodeMapper(
  nodeOrSourceSpan: ParseSourceSpan | { sourceSpan: ParseSourceSpan },
  options: Required<NodeMapperOptions<true>>,
): MLASTToken
function nodeMapper(
  nodeOrSourceSpan: ParseSourceSpan | { sourceSpan: ParseSourceSpan },
  options: NodeMapperOptions<false>,
): Omit<MLASTAbstractNode, 'nodeName' | 'type'>
function nodeMapper(
  nodeOrSourceSpan: ParseSourceSpan | { sourceSpan: ParseSourceSpan },
  { parentNode, text, simpleToken }: NodeMapperOptions,
) {
  const { start, end } = getSourceSpan(nodeOrSourceSpan)
  const startOffset = start.offset
  const endOffset = end.offset

  const token: MLASTToken = {
    uuid: uuid(),
    raw: getRaw(nodeOrSourceSpan, text),
    startOffset,
    endOffset,
    startLine: start.line + 1,
    endLine: end.line + 1,
    startCol: start.col + 1,
    endCol: end.col + 1,
  }

  return simpleToken
    ? token
    : {
        ...token,
        parentNode,
        prevNode: null,
        nextNode: null,
        isFragment: false,
        isGhost: false,
      }
}

const DOCTYPE_REGEXP =
  // eslint-disable-next-line regexp/no-super-linear-backtracking, regexp/no-unused-capturing-group, sonarjs/slow-regex
  /^<!doctype\s+html\s+public\s*(["'])([^"']*)\1\s*((["'])([^"']*)\4)?.*>$/i

const visitor: Visitor = {
  visitElement(
    { startSourceSpan, endSourceSpan, name: nodeName, attrs, children },
    { nodeList, namespace, ...options }: VisitorContext,
  ) {
    const partialStartTag = nodeMapper(startSourceSpan, options)

    const { text } = options
    const startTagText = getRaw(startSourceSpan, text)
    const endTagText = getRaw(endSourceSpan, text)

    const attributes: MLASTAttr[] = []
    const childNodes: MLASTChildNode[] = []

    // https://github.com/ikatyang/angular-html-parser/issues/22
    nodeName = nodeName.startsWith(':') ? nodeName.slice(1) : nodeName

    namespace =
      attrs.find(attr => attr.name === 'xmlns')?.value ||
      (nodeName === 'svg' || nodeName.startsWith('svg:')
        ? 'http://www.w3.org/2000/svg'
        : namespace || 'http://www.w3.org/1999/xhtml')

    const selfClosingSolidus = parseSelfClosingSolidus(
      startTagText,
      partialStartTag.startLine,
      partialStartTag.startCol,
      partialStartTag.startOffset,
    )

    const isCustomElement = nodeName.includes('-')

    const startTag: Writable<MLASTElement> = {
      ...partialStartTag,
      elementType: isCustomElement ? 'authored' : 'html',
      type: 'starttag',
      depth: 0,
      isFragment: false,
      isGhost: false,
      nodeName,
      namespace,
      attributes,
      childNodes,
      hasSpreadAttr: false,
      pairNode: null,
      selfClosingSolidus,
      tagOpenChar: '<',
      tagCloseChar: startTagText === endTagText ? '/>' : '>',
    }

    visitAll(visitor, attrs, {
      parentNode: startTag,
      nodeList: attributes,
      text,
      namespace,
    })

    visitAll(visitor, children, {
      parentNode: startTag,
      nodeList: childNodes,
      text,
      namespace,
    })

    let endTag: MLASTElementCloseTag | null = null

    if (startTagText !== endTagText && endTagText) {
      startTag.pairNode = endTag = {
        ...nodeMapper(endSourceSpan!, options),
        type: 'endtag',
        depth: 0,
        parentNode: null,
        pairNode: startTag,
        nodeName,
        tagOpenChar: '</',
        tagCloseChar: '>',
      }
    }

    nodeList.push(startTag)

    if (endTag) {
      nodeList.push(endTag)
    }
  },
  visitAttribute(
    attribute: Attribute,
    { nodeList, ...options }: VisitorContext<MLASTAttr>,
  ) {
    const {
      name,
      sourceSpan: { start },
      value,
    } = attribute

    const _value = value.trim()

    const dynamicName = // template reference or structural directive
      /^[#*]/.test(name) ||
      // dynamic attribute or Angular Input
      /^\[[^.[\]]+\]$/.test(name) ||
      // event binding
      /^\([^().]+\)$/.test(name)
    const dynamicValue = /^\{\{.*\}\}$/.test(_value)

    const node: Writable<MLASTHTMLAttr> = attrTokenizer(
      getRaw(attribute, options.text),
      start.line + 1,
      start.col,
      start.offset,
      dynamicName || dynamicValue || undefined,
    )

    const potentialName = name
      /**
       * remove leading `[attr.`
       *
       * @example `<input [attr.type]="type" />`
       *
       * Notice `<input attr.type="number" />` is not same as `<input type="number" />`,
       * what means `[]` wrapper is required
       */
      .replace(/^\[attr\./, '')
      // remove leading `*`, `@`, `[]` and `()` wrapper
      .replaceAll(/[()*@[\]]/g, '')

    node.potentialName = potentialName

    nodeList.push(node)
  },
  visitText(text: Text, { nodeList, ...options }: VisitorContext) {
    const node: MLASTText = {
      ...nodeMapper(text, options),
      depth: 0,
      type: 'text',
      nodeName: '#text',
    }
    nodeList.push(node)
  },
  visitCdata(cdata: CDATA, { nodeList, ...options }: VisitorContext) {
    // mark cdata as comment
    const node: MLASTComment = {
      ...nodeMapper(cdata, options),
      depth: 0,
      type: 'comment',
      nodeName: '#comment',
      isBogus: false,
    }
    nodeList.push(node)
  },
  visitComment(comment: Comment, { nodeList, ...options }: VisitorContext) {
    const node: MLASTComment = {
      ...nodeMapper(comment, options),
      depth: 0,
      type: 'comment',
      nodeName: '#comment',
      isBogus: false,
    }
    nodeList.push(node)
  },
  visitDocType(docType: DocType, { nodeList, ...options }: VisitorContext) {
    const partialDocType = nodeMapper(docType, options)
    const matched = DOCTYPE_REGEXP.exec(partialDocType.raw)
    const node: MLASTDoctype = {
      ...partialDocType,
      depth: 0,
      type: 'doctype',
      name: docType.value!.split(/\s/)[0],
      nodeName: '#doctype',
      publicId: matched?.[2] ?? '',
      systemId: matched?.[5] ?? '',
    }
    nodeList.push(node)
  },
  /* istanbul ignore next */
  visitExpansion(expansion: Expansion, _context: VisitorContext) {
    throw new Error(
      'unexpected expansion node: ' +
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        expansion.toString(),
    )
  },
  /* istanbul ignore next */
  visitExpansionCase(expansionCase: ExpansionCase, _context: VisitorContext) {
    throw new Error(
      'unexpected expansionCase node: ' +
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        expansionCase.toString(),
    )
  },
  visitBlock() {
    // markuplint does not support angular block
  },
  visitBlockParameter() {
    // markuplint does not support angular block
  },
  visitLetDeclaration() {
    // markuplint does not support angular block
  },
}

export class AngularParser extends Parser<Node, State> {
  override parse(text: string) {
    const { rootNodes, errors } = parse(text)

    const nodeList: MLASTNodeTreeItem[] = []

    visitAll(visitor, rootNodes, {
      parentNode: null,
      nodeList,
      text,
    })

    const document: Writable<MLASTDocument> = {
      raw: text,
      nodeList: this.flattenNodes(nodeList),
      isFragment: !nodeList.some(
        node =>
          node.type === 'doctype' ||
          (node.type === 'starttag' && node.nodeName.toLowerCase() === 'html'),
      ),
    }

    if (errors.length > 0) {
      document.unknownParseError = errors.map(err => err.toString()).join('\n')
    }

    return document
  }
}

export const parser = new AngularParser()
