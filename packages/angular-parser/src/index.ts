import { MLASTNode, Parse } from '@markuplint/ml-ast'
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

const visitor = {
  visitElement(_element: Element, nodeList: MLASTNode[]) {
    nodeList.push()
  },
  visitAttribute(_attribute: Attribute, nodeList: MLASTNode[]) {
    nodeList.push()
  },
  visitText(_text: Text, nodeList: MLASTNode[]) {
    nodeList.push()
  },
  visitCdata(_text: CDATA, nodeList: MLASTNode[]) {
    nodeList.push()
  },
  visitComment(_comment: Comment, nodeList: MLASTNode[]) {
    nodeList.push()
  },
  visitDocType(_docType: DocType, nodeList: MLASTNode[]) {
    nodeList.push()
  },
  visitExpansion(_expansion: Expansion, nodeList: MLASTNode[]) {
    nodeList.push()
  },
  visitExpansionCase(_expansionCase: ExpansionCase, nodeList: MLASTNode[]) {
    nodeList.push()
  },
}

export const parse: Parse = code => {
  const { rootNodes, errors } = ngHtmlParser.parse(code)
  const nodeList: MLASTNode[] = []
  visitAll(visitor, rootNodes, nodeList)
  return {
    nodeList,
    isFragment: true,
    parseError:
      errors.length > 0
        ? errors.map(err => err.toString()).join('\n')
        : undefined,
  }
}
