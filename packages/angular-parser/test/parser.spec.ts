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
    expect(cleanParse('<a/></>')).toMatchSnapshot()
  })
})
