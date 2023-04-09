import * as _htmlParser from '@markuplint/html-parser'
import type {
  MLASTAbstractNode,
  MLASTAttr,
  MLASTComment,
  MLASTDoctype,
  MLASTDocument,
  MLASTElement,
  MLASTElementCloseTag,
  MLASTNode,
  MLASTParentNode,
  MLASTText,
  MLToken,
} from '@markuplint/ml-ast'
import * as parserUtils from '@markuplint/parser-utils'
import { parse } from 'angular-html-parser'
import {
  Attribute,
  CDATA,
  Comment,
  DocType,
  Element,
  Expansion,
  ExpansionCase,
  Text,
  visitAll,
} from 'angular-html-parser/lib/compiler/src/ml_parser/ast.js'
import { ParseSourceSpan } from 'angular-html-parser/lib/compiler/src/parse_util.js'
import { runAsWorker } from 'synckit'

export interface BaseVisitorContext {
  parentNode: MLASTParentNode | null
  text: string
}

export interface VisitorContext<T extends MLToken = MLASTNode>
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
): MLToken
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

  const token: MLToken = {
    uuid: parserUtils.uuid(),
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
  // eslint-disable-next-line regexp/no-super-linear-backtracking, regexp/no-unused-capturing-group
  /^<!doctype\s+html\s+public\s*(["'])([^"']*)\1\s*((["'])([^"']*)\4)?.*>$/i

const htmlParser =
  'default' in _htmlParser
    ? (_htmlParser.default as typeof _htmlParser)
    : _htmlParser

const visitor = {
  visitElement(
    {
      startSourceSpan,
      endSourceSpan,
      name: nodeName,
      attrs,
      children,
    }: Element,
    { nodeList, namespace, ...options }: VisitorContext,
  ) {
    const partialStartTag = nodeMapper(startSourceSpan, options)

    const { text } = options
    const startTagText = getRaw(startSourceSpan, text)
    const endTagText = getRaw(endSourceSpan, text)

    const attributes: MLASTAttr[] = []
    const childNodes: MLASTNode[] = []

    // https://github.com/ikatyang/angular-html-parser/issues/22
    nodeName = nodeName.startsWith(':') ? nodeName.slice(1) : nodeName

    namespace =
      attrs.find(attr => attr.name === 'xmlns')?.value ||
      (nodeName === 'svg' || nodeName.startsWith('svg:')
        ? 'http://www.w3.org/2000/svg'
        : namespace || 'http://www.w3.org/1999/xhtml')

    const { endSpace, selfClosingSolidus } = htmlParser.parseRawTag(
      startTagText,
      partialStartTag.startLine,
      partialStartTag.startCol,
      partialStartTag.startOffset,
    )

    const isCustomElement = nodeName.includes('-')

    const startTag: MLASTElement = {
      ...partialStartTag,
      elementType: isCustomElement ? 'authored' : 'html',
      type: 'starttag',
      nodeName,
      namespace,
      attributes,
      childNodes,
      hasSpreadAttr: false,
      pearNode: null,
      selfClosingSolidus,
      endSpace,
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
      startTag.pearNode = endTag = {
        ...nodeMapper(endSourceSpan!, options),
        type: 'endtag',
        nodeName,
        namespace,
        attributes: [],
        pearNode: startTag,
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

    const node: MLASTAttr = htmlParser.attrTokenizer(
      getRaw(attribute, options.text),
      start.line + 1,
      start.col,
      start.offset,
    )

    const _value = value.trim()

    const dynamicName = // template reference or structural directive
      /^[#*]/.test(name) ||
      // dynamic attribute or Angular Input
      /^\[[^.[\]]+]$/.test(name) ||
      // event binding
      /^\([^().]+\)$/.test(name)
    const dynamicValue = /^{{.*}}$/.test(_value)

    if (dynamicName || dynamicValue) {
      node.isDynamicValue = true
    }

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
      .replace(/[()*@[\]]/g, '')

    node.potentialName = potentialName

    nodeList.push(node)
  },
  visitText(text: Text, { nodeList, ...options }: VisitorContext) {
    const node: MLASTText = {
      ...nodeMapper(text, options),
      type: 'text',
      nodeName: '#text',
    }
    nodeList.push(node)
  },
  visitCdata(cdata: CDATA, { nodeList, ...options }: VisitorContext) {
    // mark cdata as comment
    const node: MLASTComment = {
      ...nodeMapper(cdata, options),
      type: 'comment',
      nodeName: '#comment',
    }
    nodeList.push(node)
  },
  visitComment(comment: Comment, { nodeList, ...options }: VisitorContext) {
    const node: MLASTComment = {
      ...nodeMapper(comment, options),
      type: 'comment',
      nodeName: '#comment',
    }
    nodeList.push(node)
  },
  visitDocType(docType: DocType, { nodeList, ...options }: VisitorContext) {
    const partialDocType = nodeMapper(docType, options)
    const matched = DOCTYPE_REGEXP.exec(partialDocType.raw)
    const node: MLASTDoctype = {
      ...partialDocType,
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
    throw new Error('unexpected expansion node: ' + expansion.toString())
  },
  /* istanbul ignore next */
  visitExpansionCase(expansionCase: ExpansionCase, _context: VisitorContext) {
    throw new Error(
      'unexpected expansionCase node: ' + expansionCase.toString(),
    )
  },
}

runAsWorker((text: string) => {
  const { rootNodes, errors } = parse(text)

  const nodeList: MLASTNode[] = []

  visitAll(visitor, rootNodes, {
    parentNode: null,
    nodeList,
    text,
  })

  const document: MLASTDocument = {
    nodeList: parserUtils.flattenNodes(nodeList, text),
    isFragment: !nodeList.some(
      node =>
        node.type === 'doctype' ||
        (node.type === 'starttag' && node.nodeName.toLowerCase() === 'html'),
    ),
  }

  if (errors.length > 0) {
    document.unknownParseError = errors.map(err => err.toString()).join('\n')
  }

  return Promise.resolve(document)
})
