import { parser } from '@markuplint/html-parser'
import snapshotDiff from 'snapshot-diff'

import { cleanParse } from './helper.js'

import { visitor } from 'markuplint-angular-parser'

describe('parser', () => {
  test('parser.parse', () => {
    expect(
      cleanParse(/* HTML */ `
        <!DOCTYPE html>
        <![CDATA[ Within this Character Data block I can use double dashes as
        much as I want (along with <, &, ', and ") *and* %MyParamEntity; will be
        expanded to the text "Has been expanded" ... however, I can't use the
        CEND sequence. If I need to use CEND I must escape one of the brackets
        or the greater-than sign using concatenated CDATA sections. ]]>
        <!-- top level comment -->
        <html lang="en">
          <body>
            <!-- body comment -->
            <input [type]="'text'" />
            <input
              type="radio"
              [checked]="true"
            />
            <input
              type="number"
              [value]="123"
            />
            <select>
              <option selected="{{ true }}"></option>
            </select>
            <div>
              Text1
              <span>Text</span>
              Text2
            </div>
            <div @triggerName="expression"></div>
            <div [@triggerName]="'expression'"></div>
          </body>
        </html>
      `),
    ).toMatchSnapshot()
  })

  test('invalid tag', () => {
    expect(
      cleanParse(
        '<a [*ngIf]="1 === 1" ng-*-if="2 === 2" href="{{" download="{ { downloadUrl } }" /></>',
      ),
    ).toMatchSnapshot()
  })

  test('html parser difference', () => {
    const html = /* HTML */ `
      <div>
        Text1
        <span>Text</span>
        Text2
      </div>
    `
    expect(
      snapshotDiff(cleanParse(parser.parse(html)), cleanParse(html)),
    ).toMatchSnapshot()
  })

  test('doctype', () => {
    const html = /* HTML */ `<!DOCTYPE html public "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">`
    const doc = cleanParse(html)
    expect(doc).toMatchSnapshot()
    expect(
      cleanParse(
        /* HTML */ `<!DOCTYPE html public "-//W3C//DTD HTML 4.01 Transitional//EN">`,
      ),
    ).toMatchSnapshot()
    expect(snapshotDiff(cleanParse(parser.parse(html)), doc)).toMatchSnapshot()
    expect(cleanParse(`<html></html>`)).toMatchSnapshot()
  })

  test('void element', () => {
    const html = `<img>`
    const doc = cleanParse(html)
    expect(doc).toMatchSnapshot()
    expect(snapshotDiff(cleanParse(parser.parse(html)), doc)).toMatchSnapshot()
  })

  test('tag namespace', () => {
    const html = /* HTML */ `
      <svg:defs>
        <svg:linearGradient></svg:linearGradient>
      </svg:defs>
    `
    const doc = cleanParse(html)
    expect(doc).toMatchSnapshot()
    expect(snapshotDiff(cleanParse(parser.parse(html)), doc)).toMatchSnapshot()
  })

  test('control flow blocks', () => {
    expect(
      cleanParse(/* HTML */ `
        @if (loggedIn) {
        <b>hello</b>
        } @else if (pending) {
        <i>wait</i>
        } @else {
        <u>guest</u>
        } @for (item of items; track item.id) {
        <span>{{ item.name }}</span>
        } @empty {
        <em>empty</em>
        } @switch (value) { @case (1) {
        <b>one</b>
        } @default {
        <i>other</i>
        } } @let total = items.length;
      `),
    ).toMatchSnapshot()
  })

  test('unreachable angular nodes stay ignored', () => {
    // Selectorless components/directives need `enableAngularSelectorlessSyntax`,
    // which hangs the upstream lexer on lowercase `@directive`, and block
    // parameters are part of the block signature, not nodes of their own.
    const context = { nodeList: [] }
    expect(
      visitor.visitBlockParameter(undefined as never, context),
    ).toBeUndefined()
    expect(visitor.visitComponent(undefined as never, context)).toBeUndefined()
    expect(visitor.visitDirective(undefined as never, context)).toBeUndefined()
  })
})
