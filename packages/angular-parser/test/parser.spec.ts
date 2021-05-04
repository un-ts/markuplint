import { parse } from '@markuplint/html-parser'
import snapshotDiff from 'snapshot-diff'

import { cleanParse } from './helper'

describe('parser', () => {
  test('parse', () => {
    expect(
      cleanParse(/* HTML */ `<!DOCTYPE html>
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
            <input type="radio" [checked]="true" />
            <input type="number" [value]="123" />
            <select>
              <option selected="{{ true }}"></option>
            </select>
            <div>
              Text1
              <span>Text</span>
              Text2
            </div>
          </body>
        </html>`),
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
    const html = /* HTML */ `<div>
      Text1
      <span>Text</span>
      Text2
    </div>`
    expect(
      snapshotDiff(cleanParse(parse(html)), cleanParse(html)),
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
    expect(snapshotDiff(cleanParse(parse(html)), doc)).toMatchSnapshot()
  })
})
