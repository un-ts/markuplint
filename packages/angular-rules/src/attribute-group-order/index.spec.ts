import { mlRuleTest } from 'markuplint'

import { type Options, attributeGroupOrder } from 'markuplint-angular-rules'

describe('order example 1', () => {
  const config = {
    rule: {
      value: true,
      option: {
        order: [
          '*structural',
          '#variable',
          'attribute',
          '[input]',
          '[(two-way)]',
          '(output)',
        ],
      } as Options,
    },
  }

  it('passes correct code with few attributes', async () => {
    const correctCode = [
      '<br>',
      '<div #myDiv"></div>',
      '<div *ngIf="true"></div>',
      '<div [class.valid]="true"></div>',
      '<div [class.valid]="true" [class.red]="false"></div>',
      '<div data-foo="bar"></div>',
      '<div data-foo="bar" data-col="2"></div>',
      '<div (click)="onClick()"></div>',
      '<div [(ngModel)]="foo"></div>',
    ]

    for (const example of correctCode) {
      const result = await mlRuleTest(attributeGroupOrder, example, config)
      expect(result.violations.length).toBe(0)
    }
  })

  it('passes correct code with many attributes', async () => {
    const correctCode = [
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
    ]

    for (const example of correctCode) {
      const result = await mlRuleTest(attributeGroupOrder, example, config)
      expect(result.violations.length).toBe(0)
    }
  })

  it('fails incorrect markup', async () => {
    const incorrectCode = [
      '<div [class.valid]="true" *ngIf="true"></div>',
      '<div #myDiv [class.valid]="true" *ngIf="true"></div>',
      '<div *ngIf="true" [class.valid]="true" data-bar="foo"></div>',
      '<div *ngIf="true" [class.valid]="true" (click)="onClick()" data-bar="foo"></div>',
      '<div data-bar="foo" [class.valid]="true" data-bar="foo"></div>',
      '<div data-bar="foo" (click)="onClick()" [class.valid]="true"></div>',
    ]

    for (const example of incorrectCode) {
      const result = await mlRuleTest(attributeGroupOrder, example, config)

      expect(result.violations).toMatchSnapshot()
    }
  })
})

describe('order example 2', () => {
  const config = {
    rule: {
      value: true,
      option: {
        order: [
          '(output)',
          '[(two-way)]',
          '[input]',
          'attribute',
          '#variable',
          '*structural',
        ],
      } as Options,
    },
  }

  it('passes correct code with few attributes', async () => {
    const correctCode = [
      '<br>',
      '<div *ngIf="true"></div>',
      '<div [class.valid]="true"></div>',
      '<div [class.valid]="true" [class.red]="false"></div>',
      '<div data-foo="bar"></div>',
      '<div data-foo="bar" data-col="2"></div>',
      '<div (click)="onClick()"></div>',
      '<div [(ngModel)]="foo"></div>',
    ]

    for (const example of correctCode) {
      const result = await mlRuleTest(attributeGroupOrder, example, config)
      expect(result.violations.length).toBe(0)
    }
  })

  it('passes correct code with many attributes', async () => {
    const correctCode = [
      '<div [class.valid]="true" #myDiv *ngIf="true"></div>',
      '<div [class.valid]="true"  data-bar="foo" *ngIf="true"></div>',
      '<div (click)="onClick()" [class.valid]="true" data-bar="foo" *ngIf="true"></div>',
      '<div (click)="onClick()" [(ngModel)]="foo" [class.valid]="true" data-bar="foo" *ngIf="true"></div>',
      '<div (click)="onClick()" [class.valid]="true" [count]="2" data-bar="foo"></div>',
      '<div (click)="onClick()" [count]="2" data-bar="foo"></div>',
      '<div [count]="2" data-bar="foo"></div>',
      '<div (click)="delete()" data-bar="foo"></div>',
    ]

    for (const example of correctCode) {
      const result = await mlRuleTest(attributeGroupOrder, example, config)
      expect(result.violations.length).toBe(0)
    }
  })

  it('fails incorrect markup', async () => {
    const incorrectCode = [
      '<div *ngIf="true" [class.valid]="true"></div>',
      '<div #myDiv [class.valid]="true"></div>',
      '<div *ngIf="true" [class.valid]="true" data-bar="foo"></div>',
      '<div *ngIf="true" [class.valid]="true" (click)="onClick()" data-bar="foo"></div>',
      '<div data-bar="foo" [class.valid]="true" data-bar="foo"></div>',
      '<div data-bar="foo" (click)="onClick()" [class.valid]="true"></div>',
    ]

    for (const example of incorrectCode) {
      const result = await mlRuleTest(attributeGroupOrder, example, config)

      expect(result.violations).toMatchSnapshot()
    }
  })
})

describe('partially supplied definitions', () => {
  const config = {
    rule: {
      value: true,
      option: {
        order: ['*structural', 'attribute', '(output)'],
      } as Options,
    },
  }

  it('passes correct code with few attributes', async () => {
    const correctCode = [
      '<br>',
      '<div *ngIf="true"></div>',
      '<div [class.valid]="true"></div>',
      '<div [class.valid]="true" [class.red]="false"></div>',
      '<div data-foo="bar"></div>',
      '<div data-foo="bar" data-col="2"></div>',
      '<div (click)="onClick()"></div>',
      '<div [(ngModel)]="foo"></div>',
    ]

    for (const example of correctCode) {
      const result = await mlRuleTest(attributeGroupOrder, example, config)
      expect(result.violations.length).toBe(0)
    }
  })

  it('passes correct code with many attributes', async () => {
    const correctCode = [
      '<div *ngIf="true" [class.valid]="true"></div>',
      '<div *ngIf="true" style="color: red;"></div>',
      '<div *ngIf="true" style="color: red;" (click)="delete()"></div>',
      '<div *ngIf="true" style="color: red;" disabled (click)="delete()"></div>',
      '<div *ngIf="true" (click)="delete()"></div>',
      '<div *ngIf="true" [class.valid]="true" (click)="delete()"></div>',
    ]

    for (const example of correctCode) {
      const result = await mlRuleTest(attributeGroupOrder, example, config)
      expect(result.violations.length).toBe(0)
    }
  })

  it('fails incorrect markup', async () => {
    const incorrectCode = [
      '<div disabled *ngIf="true"></div>',
      '<div *ngIf="true" (click)="delete" disabled></div>',
      '<div color="red" (click)="delete" disabled></div>',
      '<div (click)="delete" disabled *ngIf="true""></div>',
    ]

    for (const example of incorrectCode) {
      const result = await mlRuleTest(attributeGroupOrder, example, config)

      expect(result.violations).toMatchSnapshot()
    }
  })
})

describe('options validation', () => {
  it('throws an error when an order option is not an array', async () => {
    const result = await mlRuleTest(attributeGroupOrder, '<div></div>', {
      rule: {
        value: true,
        options: {
          // @ts-expect-error
          order: 'incorrect',
        },
      },
    })
    expect(result.violations[0].message).toMatch(
      /Error: The "order" option must be an array./,
    )
  })

  it('throws an error when an incorrect order option is supplied', async () => {
    const result = await mlRuleTest(attributeGroupOrder, '<div></div>', {
      rule: {
        value: true,
        options: {
          // @ts-expect-error
          order: ['incorrect'],
        },
      },
    })
    expect(result.violations[0].message).toMatch(
      /Error: Unexpected attribute group "incorrect"/,
    )
  })
})
