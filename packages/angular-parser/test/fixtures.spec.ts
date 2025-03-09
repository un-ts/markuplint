import path from 'node:path'

import { glob } from 'glob'
import { mlTestFile } from 'markuplint'

test('fixtures', async () => {
  const files = await glob(path.resolve(__dirname, 'fixtures/*.html'))
  for (const filePath of files) {
    const { violations } = await mlTestFile(filePath)
    expect(violations).toMatchSnapshot(path.basename(filePath))
  }
})
