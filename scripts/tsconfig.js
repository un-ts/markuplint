const fs = require('fs')

const tsconfig = require('../tsconfig.json')

const pkgs = require('./pkgs')

tsconfig.compilerOptions.paths = pkgs.reduce(
  (acc, pkg) =>
    Object.assign(
      acc,
      pkg === '@markuplint/html-spec'
        ? {
            [pkg]: [`./markuplint/packages/${pkg}`],
          }
        : {
            [pkg]: [`./markuplint/packages/${pkg}/src`],
            [`${pkg}/lib/*`]: [`./markuplint/packages/${pkg}/src/*`],
          },
    ),
  {
    'markuplint-sync': ['./src'],
  },
)

fs.writeFileSync('tsconfig.json', JSON.stringify(tsconfig, null, 2))
