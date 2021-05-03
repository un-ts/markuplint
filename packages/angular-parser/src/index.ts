import {
  MLASTAttr,
  MLASTComment,
  MLASTDoctype,
  MLASTDocument,
  MLASTElement,
  MLASTElementCloseTag,
  MLASTNode,
  MLASTNodeType,
  MLASTParentNode,
  MLASTPreprocessorSpecificAttr,
  MLASTText,
  MLToken,
  Parse,
} from '@markuplint/ml-ast'
import { attrTokenizer, flattenNodes } from '@markuplint/html-parser'
import { tokenizer, uuid } from '@markuplint/parser-utils'
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

export interface VisitorContext<T extends MLToken = MLASTNode> {
  parentNode: MLASTParentNode | null
  nodeList: T[]
  text: string
  namespace?: string
}

const getSourceSpan = (
  nodeOrSourceSpan: { sourceSpan: ParseSourceSpan } | ParseSourceSpan,
) =>
  'sourceSpan' in nodeOrSourceSpan
    ? nodeOrSourceSpan.sourceSpan
    : nodeOrSourceSpan

const getRaw = (
  nodeOrSourceSpan: { sourceSpan: ParseSourceSpan } | ParseSourceSpan,
  text: string,
) => {
  const { start, end } = getSourceSpan(nodeOrSourceSpan)
  return text.slice(start.offset, end.offset)
}

const nodeMapper = (
  nodeOrSourceSpan: { sourceSpan: ParseSourceSpan } | ParseSourceSpan,
  { parentNode, text }: Omit<VisitorContext, 'nodeList'>,
) => {
  const { start, end } = getSourceSpan(nodeOrSourceSpan)
  const startOffset = start.offset
  const endOffset = end.offset
  return {
    uuid: uuid(),
    raw: getRaw(nodeOrSourceSpan, text),
    startOffset,
    endOffset,
    startLine: start.line + 1,
    endLine: end.line + 1,
    startCol: start.col,
    endCol: end.col,
    parentNode,
    prevNode: null,
    nextNode: null,
    isFragment: false,
    isGhost: false,
  }
}

const reEndTokens = /(\s*\/)?(\s*)>$/

const visitor = {
  visitElement(
    element: Element,
    { nodeList, namespace, ...options }: VisitorContext,
  ) {
    const partialStartTag = nodeMapper(element.startSourceSpan!, options)

    const { text } = options
    const startTagText = getRaw(element.startSourceSpan!, text)
    const endTagText = getRaw(element.endSourceSpan!, text)

    const attributes: MLASTAttr[] = []
    const childNodes: MLASTNode[] = []

    namespace =
      element.attrs.find(attr => attr.name === 'xmlns')?.value ||
      namespace ||
      element.name === 'svg'
        ? 'http://www.w3.org/2000/svg'
        : 'http://www.w3.org/1999/xhtml'

    const endTokens = reEndTokens.exec(startTagText)

    const startTag: MLASTElement = {
      ...partialStartTag,
      type: MLASTNodeType.StartTag,
      nodeName: element.name,
      namespace,
      attributes,
      childNodes,
      pearNode: null,
      selfClosingSolidus: tokenizer(
        endTokens?.[1] || '',
        partialStartTag.startLine,
        partialStartTag.startCol,
        partialStartTag.startOffset,
      ),
      endSpace: tokenizer(
        endTokens?.[2] || '',
        partialStartTag.startLine,
        partialStartTag.startCol,
        partialStartTag.startOffset,
      ),
      tagOpenChar: '<',
      tagCloseChar: '>',
    }

    visitAll(visitor, element.attrs, {
      parentNode: startTag,
      nodeList: attributes,
      text,
      namespace,
    })

    visitAll(visitor, element.children, {
      parentNode: startTag,
      nodeList: childNodes,
      text,
      namespace,
    })

    let endTag: MLASTElementCloseTag | null = null

    if (startTagText === endTagText) {
      startTag.tagCloseChar = '/>'
    } else {
      endTag = {
        ...nodeMapper(element.endSourceSpan!, options),
        type: MLASTNodeType.EndTag,
        nodeName: element.name,
        namespace,
        attributes: [],
        pearNode: startTag,
        tagOpenChar: '</',
        tagCloseChar: '>',
      }
    }

    startTag.pearNode = endTag

    nodeList.push(startTag)

    if (endTag) {
      nodeList.push(endTag)
    }
  },
  visitAttribute(
    attribute: Attribute,
    { nodeList, ...options }: VisitorContext<MLASTAttr>,
  ) {
    const { name, sourceSpan, value } = attribute

    let node: MLASTAttr

    if (
      // dynamic attribute or Angular Input
      /^\[[^.[\]]+]$/.test(name) ||
      // event binding
      /^\([^().]+\)$/.test(name) ||
      // template reference or structural directive
      /^[#*]/.test(name)
    ) {
      const matched = /^\s*(["'`])([^\1]*)(\1)\s*$/.exec(value)
      const preNode: MLASTPreprocessorSpecificAttr = {
        ...nodeMapper(attribute, options),
        type: 'ps-attr',
        potentialName: name
          // remove leading `#*`
          .replace(/^[#*]/, '')
          // remove `[]` wrapper
          .replace(/(^\[)|(]$)/g, '')
          // remove `()` wrapper
          .replace(/(^\()|(\)$)/g, ''),

        potentialValue: matched ? matched[2] : value,
        valueType: matched
          ? 'string'
          : /^\d+$/.test(value)
          ? 'number'
          : ['true', 'false'].includes(value)
          ? 'boolean'
          : 'code',
        isDuplicatable: false,
      }
      node = preNode
    } else {
      const { start } = sourceSpan
      node = attrTokenizer(
        getRaw(attribute, options.text),
        start.line + 1,
        start.col,
        start.offset,
      )
    }

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
    const node: MLASTDoctype = {
      ...nodeMapper(docType, options),
      type: MLASTNodeType.Doctype,
      name: docType.value!,
      nodeName: '#doctype',
      // TODO
      publicId: '',
      // TODO
      systemId: '',
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
