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
  /**
   * Order of the attribute groups.
   *
   * @default defaultOrder
   */
  order?: AngularAttributeType[]
  /**
   * Sort the attributes of the same group alphabetically.
   *
   * @default false
   */
  alphabetical?: boolean
}

/** An attribute in source order with its resolved group. */
interface AttributeEntry {
  /** The bare name, e.g. `[@trigger]` or `i18n-title` */
  name: string
  /** The whole attribute, e.g. `[@trigger]="state"` */
  raw: string
  startOffset: number
  endOffset: number
  type: AngularAttributeType
}

export default createRule<boolean, Options>({
  defaultSeverity: 'error',
  defaultValue: true,
  defaultOptions: {
    order: defaultOrder,
    alphabetical: false,
  },
  async verify(context) {
    await context.document.walkOn('Element', node => {
      validateOptions(node.rule.options)
      const { order = defaultOrder, alphabetical = false } = node.rule.options

      const entries = node.attributes.map<AttributeEntry>(attribute => {
        // The name token is the bare name (`[@trigger]`, `i18n-title`), while `raw` also
        // carries the `="value"` part
        const name = attribute.nameNode?.raw ?? ''
        return {
          name,
          raw: attribute.raw,
          startOffset: attribute.startOffset,
          endOffset: attribute.endOffset,
          type: resolveType(getAttributeType(name), order),
        }
      })

      const outOfOrder = findOutOfOrder(entries, order, alphabetical)
      if (!outOfOrder) {
        return
      }

      const message = context.t(
        'Attribute "{0}" is out of order. Expected order is {1}',
        outOfOrder.raw,
        order.join(', '),
      )

      const sorted = [...entries].sort(byOrder(order, alphabetical))
      const isSorted = sorted.every((entry, index) => entry === entries[index])
      // An attribute of a group that is not listed in `order` has no rank, so the
      // attributes cannot be sorted as a whole
      const isSortable = entries.every(entry => order.includes(entry.type))
      if (isSorted || !isSortable) {
        context.report({ message, scope: node })
        return
      }

      const first = entries[0]
      const last = entries.at(-1)!
      const range = [first.startOffset, last.endOffset] as const
      /**
       * The gaps between the attributes are kept and only the attribute texts are moved, so
       * that the indentation, the line breaks and any comment between them stay as they are.
       *
       * The gaps come from the source rather than from `spacesBeforeName`, which is empty for
       * parsers that start an attribute token at its name, such as `markuplint-angular-parser`.
       */
      const source = context.document.toString()
      const text = sorted
        .map((target, index) =>
          index === 0
            ? target.raw
            : source.slice(
                entries[index - 1].endOffset,
                entries[index].startOffset,
              ) + target.raw,
        )
        .join('')

      context.report({
        message,
        scope: node,
        fix: fixer => fixer.replaceRange(range, text),
      })
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

/** Returns the first attribute that breaks the expected order, if any. */
function findOutOfOrder(
  entries: readonly AttributeEntry[],
  order: AngularAttributeType[],
  alphabetical: boolean,
): AttributeEntry | undefined {
  let last: AttributeEntry | undefined
  for (const entry of entries) {
    if (!last) {
      last = entry
      continue
    }

    if (last.type === entry.type) {
      if (alphabetical && compareNames(last.name, entry.name) > 0) {
        return entry
      }
      last = entry
      continue
    }

    // A group that is not listed in `order` is ignored, and does not become the
    // reference for the following attributes either
    if (!order.includes(entry.type)) {
      continue
    }

    if (order.indexOf(entry.type) < order.indexOf(last.type)) {
      return entry
    }
    last = entry
  }
  return undefined
}

/**
 * Compares attributes of the same group by name.
 *
 * `i18n-title` is compared as `title`, and sorts after it, so that an attribute and its
 * `i18n-` counterpart stay together.
 */
function compareNames(one: string, other: string): number {
  if (one === other) {
    return 0
  }

  const oneNormalized = one.replace(/^i18n-/, '')
  const otherNormalized = other.replace(/^i18n-/, '')
  if (oneNormalized === otherNormalized) {
    return one.startsWith('i18n-') ? 1 : -1
  }
  return oneNormalized > otherNormalized ? 1 : -1
}

function byOrder(
  order: AngularAttributeType[],
  alphabetical: boolean,
): (one: AttributeEntry, other: AttributeEntry) => number {
  return (one, other) => {
    const indexDifference = order.indexOf(one.type) - order.indexOf(other.type)
    if (indexDifference !== 0 || !alphabetical) {
      return indexDifference
    }
    return compareNames(one.name, other.name)
  }
}

function validateOptions(options: Options): void {
  const { order = defaultOrder, alphabetical } = options
  if (!Array.isArray(order)) {
    throw new TypeError('The "order" option must be an array.')
  }

  if (alphabetical != null && typeof alphabetical !== 'boolean') {
    throw new TypeError('The "alphabetical" option must be a boolean.')
  }

  for (const group of order) {
    if (defaultOrder.includes(group)) {
      continue
    }

    throw new Error(`Unexpected attribute group "${group}".`)
  }
}
