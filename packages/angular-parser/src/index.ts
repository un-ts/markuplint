import {
  MLASTAbstructNode,
  MLASTAttr,
  MLASTComment,
  MLASTDoctype,
  MLASTDocument,
  MLASTElement,
  MLASTElementCloseTag,
  MLASTNode,
  MLASTNodeType,
  MLASTParentNode,
  MLASTText,
  MLToken,
  Parse,
} from '@markuplint/ml-ast'
import {
  attrTokenizer,
  flattenNodes,
  parseRawTag,
} from '@markuplint/html-parser'
import { uuid } from '@markuplint/parser-utils'
import * as ngHtmlParser from 'angular-html-parser'
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
} from 'angular-html-parser/lib/compiler/src/ml_parser/ast'
import { ParseSourceSpan } from 'angular-html-parser/lib/compiler/src/parse_util'

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
  nodeOrSourceSpan: ParseSourceSpan | { sourceSpan: ParseSourceSpan },
  text: string,
) => {
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
): Omit<MLASTAbstructNode, 'nodeName' | 'type'>
function nodeMapper(
  nodeOrSourceSpan: ParseSourceSpan | { sourceSpan: ParseSourceSpan },
  { parentNode, text, simpleToken }: NodeMapperOptions,
) {
  const { start, end } = getSourceSpan(nodeOrSourceSpan)
  const startOffset = start.offset
  const endOffset = end.offset

  const token: MLToken = {
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
  /^<!doctype\s+html\s+public\s*(["'])([^"']*)\1\s*((["'])([^"']*)\4)?.*>$/i

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
    const partialStartTag = nodeMapper(startSourceSpan!, options)

    const { text } = options
    const startTagText = getRaw(startSourceSpan!, text)
    const endTagText = getRaw(endSourceSpan!, text)

    const attributes: MLASTAttr[] = []
    const childNodes: MLASTNode[] = []

    namespace =
      attrs.find(attr => attr.name === 'xmlns')?.value ||
      namespace ||
      (nodeName === 'svg'
        ? 'http://www.w3.org/2000/svg'
        : 'http://www.w3.org/1999/xhtml')

    const { endSpace, selfClosingSolidus } = parseRawTag(
      startTagText,
      partialStartTag.startLine,
      partialStartTag.startCol,
      partialStartTag.startOffset,
    )

    const isCustomElement = nodeName.includes('-')

    const startTag: MLASTElement = {
      ...partialStartTag,
      type: MLASTNodeType.StartTag,
      nodeName,
      namespace,
      attributes,
      childNodes,
      hasSpreadAttr: false,
      pearNode: null,
      selfClosingSolidus,
      endSpace,
      tagOpenChar: '<',
      tagCloseChar: '>',
      isCustomElement,
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

    if (startTagText === endTagText) {
      startTag.tagCloseChar = '/>'
    } else {
      startTag.pearNode = endTag = {
        ...nodeMapper(endSourceSpan!, options),
        type: MLASTNodeType.EndTag,
        nodeName,
        namespace,
        attributes: [],
        pearNode: startTag,
        tagOpenChar: '</',
        tagCloseChar: '>',
        isCustomElement,
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

    const node: MLASTAttr = attrTokenizer(
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
      // remove leading `*`, `[]` and `()` wrapper
      .replace(/[()*[\]]/g, '')
    // remove leading `#`
    const plainName = potentialName.replace(/#/g, '')
    const potentialValue = _value.replace(/(^{\s*{)|(}\s*}$)/g, '')

    node.potentialName = potentialName
    node.isInvalid =
      ![
        plainName,
        `#${plainName}`,
        `*${plainName}`,
        `[${plainName}]`,
        `(${plainName})`,
        `[(${plainName})]`,
      ].includes(name) ||
      ![potentialValue, `{{${potentialValue}}}`].includes(_value) ||
      (dynamicName && dynamicValue)

    nodeList.push(node)
  },
  visitText(text: Text, { nodeList, ...options }: VisitorContext) {
    const node: MLASTText = {
      ...nodeMapper(text, options),
      type: MLASTNodeType.Text,
      nodeName: '#text',
    }
    nodeList.push(node)
  },
  visitCdata(cdata: CDATA, { nodeList, ...options }: VisitorContext) {
    // mark cdata as comment
    const node: MLASTComment = {
      ...nodeMapper(cdata, options),
      type: MLASTNodeType.Comment,
      nodeName: '#comment',
    }
    nodeList.push(node)
  },
  visitComment(comment: Comment, { nodeList, ...options }: VisitorContext) {
    const node: MLASTComment = {
      ...nodeMapper(comment, options),
      type: MLASTNodeType.Comment,
      nodeName: '#comment',
    }
    nodeList.push(node)
  },
  visitDocType(docType: DocType, { nodeList, ...options }: VisitorContext) {
    const partialDocType = nodeMapper(docType, options)
    const matched = DOCTYPE_REGEXP.exec(partialDocType.raw)
    const node: MLASTDoctype = {
      ...partialDocType,
      type: MLASTNodeType.Doctype,
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

export const parse: Parse = text => {
  const { rootNodes, errors } = ngHtmlParser.parse(text)

  const nodeList: MLASTNode[] = []

  visitAll(visitor, rootNodes, {
    parentNode: null,
    nodeList,
    text,
  })

  const document: MLASTDocument = {
    nodeList: flattenNodes(nodeList, text),
    isFragment: !nodeList.some(node => node.type === MLASTNodeType.Doctype),
  }

  if (errors.length > 0) {
    document.parseError = errors.map(err => err.toString()).join('\n')
  }

  return document
}
