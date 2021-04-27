const fs = require('fs')
const path = require('path')

const PKGS_DIR = path.resolve(__dirname, '../markuplint/packages')
const SUB_PKGS_DIR = '@markuplint'

const pkgs = fs.readdirSync(PKGS_DIR).reduce((acc, dir) => {
  if (dir === SUB_PKGS_DIR) {
    return [
      ...acc,
      ...fs
        .readdirSync(path.resolve(PKGS_DIR, SUB_PKGS_DIR))
        .map(dir => `${SUB_PKGS_DIR}/${dir}`),
    ]
  }
  acc.push(dir)
  return acc
}, [])

module.exports = pkgs
