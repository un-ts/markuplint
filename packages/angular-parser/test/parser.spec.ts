import { parse } from 'markuplint-angular-parser'

describe('parser', () => {
  test('empty', () => {
    expect(parse('')).toMatchSnapshot()
  })
})
