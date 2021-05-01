/**
 * All rules are actually runnable in sync mode actually,
 * we're here removing all `async/await` key words to
 * mark sure that it is compatible with sync API
 */

const fs = require('fs')
const path = require('path')

const { copySync } = require('fs-extra')

copySync(
  path.resolve(__dirname, '../../../node_modules/@markuplint/rules/lib'),
  'rules',
  {
    filter: src =>
      !src.includes('test') && (!src.includes('.') || src.endsWith('.js')),
  },
)

const rules = fs.readdirSync('rules').filter(path => !path.endsWith('.js'))

for (const rule of rules) {
  const filename = path.resolve(__dirname, `../rules/${rule}/index.js`)
  fs.writeFileSync(
    filename,
    fs.readFileSync(filename, 'utf-8').replace(/(async|await)/g, ''),
  )
}
