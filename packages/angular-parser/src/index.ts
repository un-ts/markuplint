import type {
  MLASTAttr,
  MLASTBlockBehavior,
  MLASTBlockBehaviorType,
  MLASTChildNode,
  MLASTComment,
  MLASTDoctype,
  MLASTDocument,
  MLASTElement,
  MLASTElementCloseTag,
  MLASTHTMLAttr,
  MLASTNodeTreeItem,
  MLASTParentNode,
  MLASTPreprocessorSpecificBlock,
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

import parseSelfClosingSolidus from './parse-self-closing-solidus.js'

type Expansion = Ast.Expansion
type ExpansionCase = Ast.ExpansionCase
type Block = Ast.Block
type BlockParameter = Ast.BlockParameter
type LetDeclaration = Ast.LetDeclaration

export interface BaseVisitorContext {
  parentNode: MLASTParentNode | null
  text: string
}

export interface VisitorContext<
  T extends MLASTToken = MLASTToken,
> extends BaseVisitorContext {
  nodeList: T[]
  namespace?: string
  /**
   * The parser instance, so that the visitors can reuse the upstream `@markuplint/parser-utils`
   * utilities (e.g. `visitAttr`) instead of maintaining their own copies.
   */
  parser: AngularParser
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

/**
 * Angular's lexer only ends an attribute name at a newline while brackets are open, which is
 * what makes bindings such as `[class.w-1/2]`, `[style.--my-var]` and `[attr.xlink:href]`
 * possible:
 * https://github.com/angular/angular/blob/e699fd72de588b98a10efefdd37e43ed1d3f2198/packages/compiler/src/ml_parser/lexer.ts#L1068-L1087
 *
 * The tokenizer of `@markuplint/parser-utils` follows the HTML attribute-name state and ends
 * the name at `/`, so `/` inside the name is protected while tokenizing and restored after.
 */
const SLASH_PLACEHOLDER = '\uE000'

const protectSlashes = (
  raw: string,
  keySpan: ParseSourceSpan | undefined,
): string => {
  const nameLength = keySpan ? keySpan.end.offset - keySpan.start.offset : 0
  const name = raw.slice(0, nameLength)
  if (!name.includes('/')) {
    return raw
  }
  return name.replaceAll('/', SLASH_PLACEHOLDER) + raw.slice(nameLength)
}

const restoreSlashes = (text: string) => text.replaceAll(SLASH_PLACEHOLDER, '/')

export interface NodeMapperOptions<
  T extends boolean = boolean,
> extends BaseVisitorContext {
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

const blockBehaviorTypes: Record<string, MLASTBlockBehaviorType | undefined> = {
  if: 'if',
  'else if': 'if:elseif',
  else: 'if:else',
  for: 'each',
  empty: 'each:empty',
  case: 'switch:case',
  default: 'switch:default',
}

const getBlockBehavior = (block: Block): MLASTBlockBehavior | null => {
  const type = blockBehaviorTypes[block.name]
  if (!type) {
    return null
  }
  return {
    type,
    expression: block.parameters
      .map(parameter => parameter.expression)
      .join('; '),
  }
}

export const visitor: Ast.Visitor = {
  visitElement(
    {
      startSourceSpan,
      endSourceSpan,
      name: nodeName,
      attrs,
      comments,
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
      parser: options.parser,
    })

    visitAll(visitor, comments, {
      parentNode: startTag,
      nodeList: childNodes,
      text,
      namespace,
      parser: options.parser,
    })

    visitAll(visitor, children, {
      parentNode: startTag,
      nodeList: childNodes,
      text,
      namespace,
      parser: options.parser,
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
      /**
       * Two-way, property or animation binding.
       *
       * Angular's binding parser splits a property name on `.` and special-cases the
       * `attr`, `class`, `style` and `animate` prefixes:
       * https://github.com/angular/angular/blob/e699fd72de588b98a10efefdd37e43ed1d3f2198/packages/compiler/src/template_parser/binding_parser.ts#L42-L46
       * https://github.com/angular/angular/blob/e699fd72de588b98a10efefdd37e43ed1d3f2198/packages/compiler/src/template_parser/binding_parser.ts#L571-L615
       *
       * `@trigger` and `[@trigger]` are the keyword form of the same parser:
       * https://github.com/angular/angular/blob/e699fd72de588b98a10efefdd37e43ed1d3f2198/packages/compiler/src/render3/r3_template_transform.ts#L40-L55
       *
       * A segment after those prefixes may contain any character that is not a separator
       * or a wrapper, so that namespaced attributes (`[attr.xlink:href]`) and arbitrary
       * class names (`[class.md:flex]`, `[class.w-1/2]`) are covered, while empty
       * segments are still rejected.
       *
       * Invalid or unknown names such as `[class..x]`, `[]` or `[foo.bar]` are not
       * matched, because this parser does not validate binding names the way
       * Angular's binding parser and schema registry do.
       */
      /^\[(?:@?[\w$-]+|\([\w$-]+\)|(?:attr|class|style|animate)(?:\.[^\s.[\]]+)+)\]$/.test(
        name,
      ) ||
      /**
       * Event binding, including a target (`(window:resize)`) and animation callbacks
       * (`(@fadeIn.done)`); the `[]`, `()` and `[()]` delimiters are detected in
       * https://github.com/angular/angular/blob/e699fd72de588b98a10efefdd37e43ed1d3f2198/packages/compiler/src/render3/r3_template_transform.ts#L853-L858
       */
      /^\(@?[\w$-]+(?::[\w$-]+)?(?:\.[\w$-]+)*\)$/.test(name)
    // An interpolation may appear anywhere in the value, e.g. `title="Hello {{ name }}"`
    const interpolationStart = _value.indexOf('{{')
    const dynamicValue =
      interpolationStart !== -1 && _value.includes('}}', interpolationStart + 2)

    const parsed = options.parser.visitAttr({
      raw: protectSlashes(getRaw(attribute, options.text), attribute.keySpan),
      offset: start.offset,
      line: start.line + 1,
      col: start.col,
    })

    if (parsed.type === 'spread') {
      nodeList.push({ ...parsed, raw: restoreSlashes(parsed.raw) })
      return
    }

    // The protected slashes of the name are restored before the node is exposed
    const node: MLASTHTMLAttr = {
      ...parsed,
      raw: restoreSlashes(parsed.raw),
      nodeName: restoreSlashes(parsed.nodeName),
      name: { ...parsed.name, raw: restoreSlashes(parsed.name.raw) },
      potentialName: name
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
        .replaceAll(/[()*@[\]]/g, ''),
      ...((dynamicName || dynamicValue) && { isDynamicValue: true }),
    }

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
  visitStartTagComment(
    comment: Ast.StartTagComment,
    { nodeList, ...options }: VisitorContext,
  ) {
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
  visitBlock(
    block: Block,
    { nodeList, namespace, ...options }: VisitorContext,
  ) {
    const childNodes: MLASTChildNode[] = []
    const node: Writable<MLASTPreprocessorSpecificBlock> = {
      ...nodeMapper(block, options),
      type: 'psblock',
      depth: 0,
      nodeName: block.name,
      isFragment: false,
      childNodes,
      blockBehavior: getBlockBehavior(block),
      isBogus: false,
    }
    visitAll(visitor, block.children, {
      parentNode: node,
      nodeList: childNodes,
      text: options.text,
      namespace,
      parser: options.parser,
    })
    nodeList.push(node)
  },
  visitBlockParameter(_parameter: BlockParameter, _context: VisitorContext) {
    // parameters are part of the block signature, not separate nodes
  },
  visitLetDeclaration(
    declaration: LetDeclaration,
    { nodeList, ...options }: VisitorContext,
  ) {
    const node: Writable<MLASTPreprocessorSpecificBlock> = {
      ...nodeMapper(declaration, options),
      type: 'psblock',
      depth: 0,
      nodeName: 'let',
      isFragment: false,
      childNodes: [],
      blockBehavior: null,
      isBogus: false,
    }
    nodeList.push(node)
  },
  /* istanbul ignore next */
  visitComponent() {
    // markuplint does not support angular component
  },
  /* istanbul ignore next */
  visitDirective() {
    // markuplint does not support angular directive
  },
}

export class AngularParser extends Parser<Ast.Node> {
  override parse(text: string) {
    const { rootNodes, errors } = parse(text, {
      tokenizeAngularBlocks: true,
      tokenizeAngularLetDeclaration: true,
      // Angular allows `/* ... */` and `// ...` comments inside a start tag
      allowStartTagComments: true,
    })

    const nodeList: MLASTNodeTreeItem[] = []

    visitAll(visitor, rootNodes, {
      parentNode: null,
      nodeList,
      text,
      parser: this,
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
