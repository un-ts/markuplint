import type {
  MLASTAttr,
  MLASTChildNode,
  MLASTComment,
  MLASTDoctype,
  MLASTDocument,
  MLASTElement,
  MLASTElementCloseTag,
  MLASTHTMLAttr,
  MLASTNodeTreeItem,
  MLASTParentNode,
  MLASTText,
  MLASTToken,
  NamespaceURI,
} from '@markuplint/ml-ast'
import { Parser } from '@markuplint/parser-utils'
import {
  type Ast,
  type ParseSourceSpan,
  parse,
  visitAll,
} from 'angular-html-parser'
import type { Writable } from 'type-fest'
import { v4 as uuid } from 'uuid'

import attrTokenizer from './attr-tokenizer.js'
import parseSelfClosingSolidus from './parse-self-closing-solidus.js'

export interface BaseVisitorContext {
  parentNode: MLASTParentNode | null
  text: string
}

export interface VisitorContext<T extends MLASTToken = MLASTToken>
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

type MLASTNodeBase = MLASTToken & {
  readonly parentNodeUuid: string | null
}

function nodeMapper(
  nodeOrSourceSpan: ParseSourceSpan | { sourceSpan: ParseSourceSpan },
  options: Required<NodeMapperOptions<true>>,
): MLASTToken
function nodeMapper(
  nodeOrSourceSpan: ParseSourceSpan | { sourceSpan: ParseSourceSpan },
  options: NodeMapperOptions<false>,
): MLASTNodeBase
function nodeMapper(
  nodeOrSourceSpan: ParseSourceSpan | { sourceSpan: ParseSourceSpan },
  { parentNode, text, simpleToken }: NodeMapperOptions,
): MLASTNodeBase | MLASTToken {
  const { start } = getSourceSpan(nodeOrSourceSpan)

  const token: MLASTToken = {
    uuid: uuid(),
    raw: getRaw(nodeOrSourceSpan, text),
    offset: start.offset,
    line: start.line + 1,
    col: start.col + 1,
  }

  return simpleToken
    ? token
    : { ...token, parentNodeUuid: parentNode?.uuid ?? null }
}

const DOCTYPE_REGEXP =
  // eslint-disable-next-line regexp/no-super-linear-backtracking, regexp/no-unused-capturing-group, sonarjs/super-linear-regex
  /^<!doctype\s+html\s+public\s*(["'])([^"']*)\1\s*((["'])([^"']*)\4)?.*>$/i

const visitor: Ast.Visitor = {
  visitElement(
    {
      startSourceSpan,
      endSourceSpan,
      name: nodeName,
      attrs,
      children,
    }: Ast.Element,
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
      partialStartTag.line,
      partialStartTag.col,
      partialStartTag.offset,
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
      namespace: namespace as NamespaceURI,
      attributes,
      childNodes,
      hasSpreadAttr: false,
      blockBehavior: null,
      pairNodeUuid: null,
      tagOpenChar: '<',
      tagCloseChar: (selfClosingSolidus.raw.trim() ? '/' : '') + '>',
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
      endTag = {
        ...nodeMapper(endSourceSpan!, options),
        type: 'endtag',
        depth: 0,
        parentNodeUuid: null,
        pairNodeUuid: startTag.uuid,
        nodeName,
        tagOpenChar: '</',
        tagCloseChar: '>',
      }
      startTag.pairNodeUuid = endTag.uuid
    }

    nodeList.push(startTag)

    if (endTag) {
      nodeList.push(endTag)
    }
  },
  visitAttribute(
    attribute: Ast.Attribute,
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
       * Remove leading `[attr.`
       *
       * @example
       *   `<input [attr.type]="type" />`
       *
       *   Notice `<input attr.type="number" />` is not same as `<input type="number" />`,
       *   what means `[]` wrapper is required
       */
      .replace(/^\[attr\./, '')
      // remove leading `*`, `@`, `[]` and `()` wrapper
      .replaceAll(/[()*@[\]]/g, '')

    node.potentialName = potentialName

    nodeList.push(node)
  },
  visitText(text: Ast.Text, { nodeList, ...options }: VisitorContext) {
    const node: MLASTText = {
      ...nodeMapper(text, options),
      depth: 0,
      type: 'text',
      nodeName: '#text',
    }
    nodeList.push(node)
  },
  visitCdata(cdata: Ast.CDATA, { nodeList, ...options }: VisitorContext) {
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
  visitComment(comment: Ast.Comment, { nodeList, ...options }: VisitorContext) {
    const node: MLASTComment = {
      ...nodeMapper(comment, options),
      depth: 0,
      type: 'comment',
      nodeName: '#comment',
      isBogus: false,
    }
    nodeList.push(node)
  },
  visitDocType(docType: Ast.DocType, { nodeList, ...options }: VisitorContext) {
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
  visitExpansion(expansion: Ast.Expansion, _context: VisitorContext) {
    throw new Error(
      'unexpected expansion node: ' +
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        expansion.toString(),
    )
  },
  /* istanbul ignore next */
  visitExpansionCase(
    expansionCase: Ast.ExpansionCase,
    _context: VisitorContext,
  ) {
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
  visitComponent() {
    // markuplint does not support angular component
  },
  visitDirective() {
    // markuplint does not support angular directive
  },
}

export class AngularParser extends Parser<Ast.Node> {
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
