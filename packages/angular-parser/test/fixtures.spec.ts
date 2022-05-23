import path from 'node:path'
import { promisify } from 'node:util'

import glob from 'glob'
import { mlTestFile } from 'markuplint'

const asyncGlob = promisify(glob)

test('fixtures', async () => {
  const files = await asyncGlob(path.resolve(__dirname, 'fixtures/*.html'))
  for (const filePath of files) {
    const { violations } = await mlTestFile(filePath)
    expect(violations).toMatchSnapshot(path.basename(filePath))
  }
})
