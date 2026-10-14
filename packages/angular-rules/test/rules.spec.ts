import { mlRuleTest } from 'markuplint'

import { type Options, attributeGroupOrder } from 'markuplint-angular-rules'

const fewAttributes = [
  '<br>',
  '<div *ngIf="true"></div>',
  '<div [class.valid]="true"></div>',
  // Alphabetical-safe, so the cases with `alphabetical: true` can share this list
  '<div [class.red]="false" [class.valid]="true"></div>',
  '<div data-foo="bar"></div>',
  '<div data-col="2" data-foo="bar"></div>',
  '<div (click)="onClick()"></div>',
  '<div [(ngModel)]="foo"></div>',
]

interface Case {
  name: string
  options: Options['order']
  alphabetical?: boolean
  many: string[]
  incorrect: string[]
}

const animationGroups: Options['order'] = [
  '*structural',
  '#variable',
  'i18n',
  'attribute',
  '[input]',
  '[(two-way)]',
  '@animation',
]

async function countViolations(
  order: Options['order'],
  html: string,
  alphabetical = false,
): Promise<number> {
  const { violations } = await mlRuleTest(attributeGroupOrder, html, {
    rule: { value: true, options: { order, alphabetical } },
  })
  return violations.length
}

const cases: Case[] = [
  {
    name: 'order example 1',
    options: [
      '*structural',
      '#variable',
      'attribute',
      '[input]',
      '[(two-way)]',
      '(output)',
    ],
    many: [
      '<div *ngIf="true" [class.valid]="true"></div>',
      '<div *ngIf="true" #myDiv [class.valid]="true"></div>',
      '<div *ngIf="true" data-bar="foo" [class.valid]="true"></div>',
      '<div *ngIf="true" data-bar="foo" [class.valid]="true" (click)="onClick()"></div>',
      '<div *ngIf="true" data-bar="foo" [class.valid]="true" [(ngModel)]="foo" (click)="onClick()"></div>',
      '<div *ngIf="true" data-bar="foo" [class.valid]="true" [count]="2" [(ngModel)]="foo" (click)="onClick()"></div>',
      '<div data-bar="foo" [class.valid]="true" [count]="2" [(ngModel)]="foo" (click)="onClick()"></div>',
      '<div data-bar="foo" [class.valid]="true" [count]="2" (click)="onClick()"></div>',
      '<div data-bar="foo" [count]="2" (click)="onClick()"></div>',
      '<div data-bar="foo" [count]="2"></div>',
      '<div #myDiv data-bar="foo" [count]="2"></div>',
      '<div data-bar="foo" (click)="delete()"></div>',
    ],
    incorrect: [
      '<div [class.valid]="true" *ngIf="true"></div>',
      '<div #myDiv [class.valid]="true" *ngIf="true"></div>',
      '<div *ngIf="true" [class.valid]="true" data-bar="foo"></div>',
      '<div *ngIf="true" [class.valid]="true" (click)="onClick()" data-bar="foo"></div>',
      '<div data-bar="foo" [class.valid]="true" data-bar="foo"></div>',
      '<div data-bar="foo" (click)="onClick()" [class.valid]="true"></div>',
    ],
  },
  {
    name: 'order example 2',
    options: [
      '(output)',
      '[(two-way)]',
      '[input]',
      'attribute',
      '#variable',
      '*structural',
    ],
    many: [
      '<div [class.valid]="true" #myDiv *ngIf="true"></div>',
      '<div [class.valid]="true"  data-bar="foo" *ngIf="true"></div>',
      '<div (click)="onClick()" [class.valid]="true" data-bar="foo" *ngIf="true"></div>',
      '<div (click)="onClick()" [(ngModel)]="foo" [class.valid]="true" data-bar="foo" *ngIf="true"></div>',
      '<div (click)="onClick()" [class.valid]="true" [count]="2" data-bar="foo"></div>',
      '<div (click)="onClick()" [count]="2" data-bar="foo"></div>',
      '<div [count]="2" data-bar="foo"></div>',
      '<div (click)="delete()" data-bar="foo"></div>',
    ],
    incorrect: [
      '<div *ngIf="true" [class.valid]="true"></div>',
      '<div #myDiv [class.valid]="true"></div>',
      '<div *ngIf="true" [class.valid]="true" data-bar="foo"></div>',
      '<div *ngIf="true" [class.valid]="true" (click)="onClick()" data-bar="foo"></div>',
      '<div data-bar="foo" [class.valid]="true" data-bar="foo"></div>',
      '<div data-bar="foo" (click)="onClick()" [class.valid]="true"></div>',
    ],
  },
  {
    name: 'partially supplied definitions',
    options: ['*structural', 'attribute', '(output)'],
    many: [
      '<div *ngIf="true" [class.valid]="true"></div>',
      '<div *ngIf="true" style="color: red;"></div>',
      '<div *ngIf="true" style="color: red;" (click)="delete()"></div>',
      '<div *ngIf="true" style="color: red;" disabled (click)="delete()"></div>',
      '<div *ngIf="true" (click)="delete()"></div>',
      '<div *ngIf="true" [class.valid]="true" (click)="delete()"></div>',
    ],
    incorrect: [
      '<div disabled *ngIf="true"></div>',
      '<div *ngIf="true" (click)="delete" disabled></div>',
      '<div color="red" (click)="delete" disabled></div>',
      '<div (click)="delete" disabled *ngIf="true""></div>',
    ],
  },
  {
    name: 'animation and i18n',
    options: [...animationGroups, '(output)'],
    many: [
      '<div *ngIf="true" #myDiv i18n="@@id" data-bar="foo" [count]="2" [(ngModel)]="foo" @fadeIn="state" (click)="onClick()"></div>',
      '<div i18n i18n-title="@@title" title="Title"></div>',
      '<div [@fadeIn]="state" @fadeOut="state" (click)="onClick()"></div>',
      '<div @fadeIn="state" (@fadeIn.done)="onDone()"></div>',
      // `i18n.foo` is not an Angular i18n attribute, so it is a plain attribute
      '<div title="Title" i18n.foo="@@id"></div>',
    ],
    incorrect: [
      '<div @fadeIn="state" [count]="2"></div>',
      '<div data-bar="foo" i18n="@@id"></div>',
      '<div (click)="onClick()" @fadeIn="state"></div>',
      '<div [@fadeIn]="state" [count]="2"></div>',
    ],
  },
  {
    name: 'alphabetical',
    options: [...animationGroups, '(output)'],
    alphabetical: true,
    many: [
      '<div *ngIf="true" #aRef data-bar="foo" data-col="2" [count]="2" [(ngModel)]="foo" @fadeIn="state" (click)="onClick()"></div>',
      '<div i18n="@@id" i18n-title="@@title" title="Title"></div>',
    ],
    incorrect: [
      '<div data-col="2" data-bar="foo"></div>',
      '<div [count]="2" [class.valid]="true"></div>',
      '<div title="Title" i18n-title="@@title"></div>',
    ],
  },
]

for (const { name, options, many, incorrect, alphabetical } of cases) {
  describe(name, () => {
    const config = {
      rule: {
        value: true,
        options: { order: options, alphabetical },
      },
    }

    it('passes correct code with few attributes', async () => {
      for (const example of fewAttributes) {
        const result = await mlRuleTest(attributeGroupOrder, example, config)
        expect(result.violations.length).toBe(0)
      }
    })

    it('passes correct code with many attributes', async () => {
      for (const example of many) {
        const result = await mlRuleTest(attributeGroupOrder, example, config)
        expect(result.violations.length).toBe(0)
      }
    })

    it('fails incorrect markup', async () => {
      for (const example of incorrect) {
        const result = await mlRuleTest(attributeGroupOrder, example, config)

        expect(result.violations).toMatchSnapshot()
      }
    })
  })
}

describe('autofix', () => {
  const order: Options['order'] = [...animationGroups, '(output)']
  const config = { rule: { value: true, options: { order } } }

  it('reorders the attributes', async () => {
    const { fixedCode } = await mlRuleTest(
      attributeGroupOrder,
      '<div [count]="2" *ngIf="true"></div>',
      config,
      true,
    )
    expect(fixedCode).toBe('<div *ngIf="true" [count]="2"></div>')
  })

  it('keeps the indentation of a multiline tag', async () => {
    const { fixedCode } = await mlRuleTest(
      attributeGroupOrder,
      '<div\n  [count]="2"\n  *ngIf="true"\n></div>',
      config,
      true,
    )
    expect(fixedCode).toBe('<div\n  *ngIf="true"\n  [count]="2"\n></div>')
  })

  it('sorts alphabetically when enabled', async () => {
    const { fixedCode } = await mlRuleTest(
      attributeGroupOrder,
      '<div data-b="2" data-a="1"></div>',
      { rule: { value: true, options: { order, alphabetical: true } } },
      true,
    )
    expect(fixedCode).toBe('<div data-a="1" data-b="2"></div>')
  })

  it('does not reorder when a group is not listed in `order`', async () => {
    const html = '<div title="t" [count]="2" *ngIf="true"></div>'
    const { fixedCode, violations } = await mlRuleTest(
      attributeGroupOrder,
      html,
      {
        rule: {
          value: true,
          options: { order: ['*structural', 'attribute', '(output)'] },
        },
      },
      true,
    )
    expect(violations.length).toBe(1)
    expect(fixedCode).toBe(html)
  })
})

describe('optional groups', () => {
  // `[@animation]` refines `@animation`, so with it configured the bound form must no
  // longer share the group of the static form
  const boundPair = '<div [@fadeOut]="state" @fadeIn="state"></div>'
  // The order used before `@animation`, `[@animation]` and `i18n` existed
  const legacyOrder: Options['order'] = [
    '*structural',
    '#variable',
    'attribute',
    '[input]',
    '[(two-way)]',
    '(output)',
  ]

  it('falls back to `@animation` when `[@animation]` is not configured', async () => {
    expect(
      await countViolations([...animationGroups, '(output)'], boundPair),
    ).toBe(0)
  })

  it('is checked separately when `[@animation]` is configured', async () => {
    expect(
      await countViolations(
        [...animationGroups, '[@animation]', '(output)'],
        boundPair,
      ),
    ).toBe(1)
  })

  it('degrades `[@trigger]` to `[input]` for legacy orders', async () => {
    expect(
      await countViolations(
        legacyOrder,
        '<div [@fadeIn]="state" title="t"></div>',
      ),
    ).toBe(1)
  })

  it('degrades `@trigger` and `i18n` to attributes for legacy orders', async () => {
    expect(
      await countViolations(
        legacyOrder,
        '<div [count]="2" @fadeIn="state"></div>',
      ),
    ).toBe(1)
    expect(
      await countViolations(legacyOrder, '<div [count]="2" i18n="@@id"></div>'),
    ).toBe(1)
  })
})

describe('alphabetical', () => {
  const order: Options['order'] = [...animationGroups, '(output)']
  // Without the `i18n` group, an `i18n-` attribute and its plain counterpart share the
  // `attribute` group
  const legacyOrder: Options['order'] = [
    '*structural',
    '#variable',
    'attribute',
    '[input]',
    '[(two-way)]',
    '(output)',
  ]

  it('sorts the attributes of a group by name', async () => {
    expect(
      await countViolations(order, '<div data-b="2" data-a="1"></div>', true),
    ).toBe(1)
    expect(
      await countViolations(order, '<div data-a="1" data-b="2"></div>', true),
    ).toBe(0)
  })

  it('sorts an `i18n-` attribute after its plain counterpart', async () => {
    expect(
      await countViolations(
        legacyOrder,
        '<div i18n-title="@@t" title="T"></div>',
        true,
      ),
    ).toBe(1)
    expect(
      await countViolations(
        legacyOrder,
        '<div title="T" i18n-title="@@t"></div>',
        true,
      ),
    ).toBe(0)
  })
})

describe('options validation', () => {
  it('throws an error when an order option is not an array', async () => {
    await expect(
      mlRuleTest(attributeGroupOrder, '<div></div>', {
        rule: {
          value: true,
          options: {
            // @ts-expect-error -- testing
            order: 'incorrect',
          },
        },
      }),
    ).rejects.toThrow('The "order" option must be an array.')
  })

  it('throws an error when an alphabetical option is not a boolean', async () => {
    await expect(
      mlRuleTest(attributeGroupOrder, '<div></div>', {
        rule: {
          value: true,
          options: {
            // @ts-expect-error -- testing
            alphabetical: 'incorrect',
          },
        },
      }),
    ).rejects.toThrow('The "alphabetical" option must be a boolean.')
  })

  it('throws an error when an incorrect order option is supplied', async () => {
    const result = await mlRuleTest(attributeGroupOrder, '<div></div>', {
      rule: {
        value: true,
        options: {
          // @ts-expect-error -- testing
          order: ['incorrect'],
        },
      },
    })
    expect(result.violations[0].message).toMatch(
      /Error: Unexpected attribute group "incorrect"/,
    )
  })
})
