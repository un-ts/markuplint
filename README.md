# markuplint-sync

[![GitHub Actions](https://github.com/rx-ts/markuplint-sync/workflows/CI/badge.svg)](https://github.com/rx-ts/markuplint-sync/actions/workflows/ci.yml)
[![Codecov](https://img.shields.io/codecov/c/github/rx-ts/markuplint-sync.svg)](https://codecov.io/gh/rx-ts/markuplint-sync)
[![Codacy Grade](https://img.shields.io/codacy/grade/b9c7ab8f6c644e7fa6cf80528ad306c6)](https://www.codacy.com/gh/rx-ts/markuplint-sync)
[![type-coverage](https://img.shields.io/badge/dynamic/json.svg?label=type-coverage&prefix=%E2%89%A5&suffix=%&query=$.typeCoverage.atLeast&uri=https%3A%2F%2Fraw.githubusercontent.com%2Frx-ts%2Fmarkuplint-sync%2Fmain%2Fpackage.json)](https://github.com/plantain-00/type-coverage)
[![npm](https://img.shields.io/npm/v/markuplint-sync.svg)](https://www.npmjs.com/package/markuplint-sync)
[![GitHub Release](https://img.shields.io/github/release/rx-ts/markuplint-sync)](https://github.com/rx-ts/markuplint-sync/releases)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Frx-ts%2Fmarkuplint-sync.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Frx-ts%2Fmarkuplint-sync?ref=badge_shield)

[![David Peer](https://img.shields.io/david/peer/rx-ts/markuplint-sync.svg)](https://david-dm.org/rx-ts/markuplint-sync?type=peer)
[![David](https://img.shields.io/david/rx-ts/markuplint-sync.svg)](https://david-dm.org/rx-ts/markuplint-sync)
[![David Dev](https://img.shields.io/david/dev/rx-ts/markuplint-sync.svg)](https://david-dm.org/rx-ts/markuplint-sync?type=dev)

[![Conventional Commits](https://img.shields.io/badge/conventional%20commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![Renovate enabled](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Code Style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

Same as markuplint but extends with sync API.

## Usage

```sh
# yarn
yarn add markuplint-sync

# npm
npm i markuplint-sync
```

### API

```js
import { exec } from 'markuplint-sync'

const result = exec({
  files: './**/*.html',
})

console.log(result) // => The results in JSON format
```

## Changelog

Detailed changes for each release are documented in [CHANGELOG.md](./CHANGELOG.md).

## License

[MIT][] © [JounQin][]@[1stG.me][]

[1stg.me]: https://www.1stg.me
[jounqin]: https://GitHub.com/JounQin
[mit]: http://opensource.org/licenses/MIT


[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Frx-ts%2Fmarkuplint-sync.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Frx-ts%2Fmarkuplint-sync?ref=badge_large)