import { createRule } from '@markuplint/ml-core'

export type AngularAttributeType =
  | '(output)'
  | '[(two-way)]'
  | '[@animation]'
  | '[input]'
  | '@animation'
  | '*structural'
  | '#variable'
  | 'attribute'
  | 'i18n'

export const defaultOrder: AngularAttributeType[] = [
  '*structural',
  '#variable',
  'i18n',
  'attribute',
  '[input]',
  '[(two-way)]',
  '@animation',
  '[@animation]',
  '(output)',
]

export interface Options {
  order: AngularAttributeType[]
}

export default createRule<boolean, Options>({
  defaultSeverity: 'error',
  defaultValue: true,
  defaultOptions: {
    order: defaultOrder,
  },
  async verify(context) {
    await context.document.walkOn('Element', node => {
      validateOptions(node.rule.options)
      const order = node.rule.options.order
      const attributes = node.attributes
      let lastFoundType: AngularAttributeType | null = null
      for (const attribute of attributes) {
        // The name token is the bare name (`[@trigger]`, `i18n-title`), while `raw` also
        // carries the `="value"` part
        const attributeType = resolveType(
          getAttributeType(attribute.nameNode?.raw),
          order,
        )

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

/**
 * Matched in order, so `[@trigger]` is recognized before `[input]`.
 *
 * `@trigger` is a static attribute, `[@trigger]` is an animation binding, and `i18n` and
 * `i18n-attribute` are compile-time metadata.
 */
const ATTRIBUTE_TYPES: ReadonlyArray<
  readonly [AngularAttributeType, (name: string) => boolean]
> = [
  ['*structural', name => name.startsWith('*')],
  ['#variable', name => name.startsWith('#')],
  ['[@animation]', name => name.startsWith('[@')],
  ['@animation', name => name.startsWith('@')],
  ['[(two-way)]', name => name.startsWith('[(')],
  ['[input]', name => name.startsWith('[')],
  ['(output)', name => name.startsWith('(')],
  ['i18n', name => /^i18n(?:-|$)/.test(name)],
]

function getAttributeType(name: string | undefined): AngularAttributeType {
  return (
    ATTRIBUTE_TYPES.find(([, matches]) => matches(name ?? ''))?.[0] ??
    'attribute'
  )
}

/**
 * The groups added later (`@animation`, `[@animation]` and `i18n`) are refinements: when one
 * of them is not listed in `order`, the attributes it covers degrade to the group they were
 * checked as before it existed, instead of being ignored. Configurations written before
 * those groups existed therefore keep checking them (`[@trigger]` as `[input]`, and
 * `@trigger` and `i18n-*` as `attribute`).
 */
function resolveType(
  type: AngularAttributeType,
  order: AngularAttributeType[],
): AngularAttributeType {
  if (order.includes(type)) {
    return type
  }

  switch (type) {
    // `[@trigger]` was `[input]`, and `@animation` before `[@animation]` was introduced
    case '[@animation]': {
      return order.includes('@animation') ? '@animation' : '[input]'
    }
    // `@trigger` and `i18n-*` were plain attributes
    case '@animation':
    case 'i18n': {
      return 'attribute'
    }
    default: {
      return type
    }
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
