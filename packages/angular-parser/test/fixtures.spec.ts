import path from 'path'

import { exec } from 'markuplint'

test('fixtures', async () => {
  const resultInfos = await exec({
    files: path.resolve(__dirname, 'fixtures/*.html'),
  })
  for (const { filePath, results } of resultInfos) {
    expect(results).toMatchSnapshot(path.basename(filePath))
  }
})
