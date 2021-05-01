import path from 'path'

import { exec } from 'markuplint-sync'

describe('fixtures', () => {
  it('should just work', () => {
    const resultInfos = exec({
      files: path.resolve(__dirname, 'fixtures/*.html'),
    })

    for (const resultInfo of resultInfos) {
      expect(resultInfo.results).toMatchSnapshot(
        path.relative(__dirname, resultInfo.filePath),
      )
    }
  })
})
