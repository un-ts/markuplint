import { createRule } from '@markuplint/ml-core'

type AngularAttributeType =
  | '(output)'
  | '[(two-way)]'
  | '[input]'
  | '*structural'
  | '#variable'
  | 'attribute'

const defaultOrder: AngularAttributeType[] = [
  '*structural',
  '#variable',
  'attribute',
  '[input]',
  '[(two-way)]',
  '(output)',
]

export interface Options {
  order: AngularAttributeType[]
}

export default createRule<boolean, Options>({
  defaultServerity: 'error',
  defaultValue: true,
  defaultOptions: {
    order: defaultOrder,
  },
  async verify(context) {
    await context.document.walkOn('Element', node => {
      validateOptions(node.rule.option)
      const order = node.rule.option.order
      const attributes = node.attributes
      let lastFoundType: AngularAttributeType | null = null
      for (const attribute of attributes) {
        const attributeType = getAttributeType(attribute.raw)

        if (!lastFoundType || lastFoundType === attributeType) {
          lastFoundType = attributeType
          continue
        }

        if (!order.includes(attributeType)) {
          continue
        }

        const isOutOfOrder =
          order.indexOf(attributeType) < order.indexOf(lastFoundType)
        if (!isOutOfOrder) {
          lastFoundType = attributeType
          continue
        }

        context.report({
          message: context.t(
            'Attribute "{0}" is out of order. Expected order is {1}',
            attribute.raw,
            order.join(', '),
          ),
          scope: node,
        })
        break
      }
    })
  },
})

function getAttributeType(attribute: string): AngularAttributeType {
  switch (true) {
    case attribute.startsWith('*'):
      return '*structural'
    case attribute.startsWith('[('):
      return '[(two-way)]'
    case attribute.startsWith('['):
      return '[input]'
    case attribute.startsWith('('):
      return '(output)'
    case attribute.startsWith('#'):
      return '#variable'
    default:
      return 'attribute'
  }
}

function validateOptions(options: Options): void {
  if (!Array.isArray(options.order)) {
    throw new TypeError('The "order" option must be an array.')
  }

  const order = options.order
  for (const group of order) {
    if (defaultOrder.includes(group)) {
      continue
    }

    throw new Error(`Unexpected attribute group "${group}".`)
  }
}
