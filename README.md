# @rxts/markuplint

[![GitHub Actions](https://github.com/rx-ts/markuplint/workflows/CI/badge.svg)](https://github.com/rx-ts/markuplint/actions/workflows/ci.yml)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Frx-ts%2Fmarkuplint.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Frx-ts%2Fmarkuplint?ref=badge_shield)
[![Codacy Grade](https://img.shields.io/codacy/grade/41541a8ad8544f7d8df7b7df002f38c8)](https://www.codacy.com/gh/rx-ts/markuplint)
[![Codecov](https://img.shields.io/codecov/c/gh/rx-ts/markuplint)](https://codecov.io/gh/rx-ts/markuplint)
[![type-coverage](https://img.shields.io/badge/dynamic/json.svg?label=type-coverage&prefix=%E2%89%A5&suffix=%&query=$.typeCoverage.atLeast&uri=https%3A%2F%2Fraw.githubusercontent.com%2Frx-ts%2Feslint%2Fmain%2Fpackage.json)](https://github.com/plantain-00/type-coverage)
[![GitHub release](https://img.shields.io/github/release/rx-ts/markuplint)](https://github.com/rx-ts/markuplint/releases)
[![David Dev](https://img.shields.io/david/dev/rx-ts/markuplint.svg)](https://david-dm.org/rx-ts/markuplint?type=dev)

[![Conventional Commits](https://img.shields.io/badge/conventional%20commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![Renovate enabled](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com/)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Code Style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![changesets](https://img.shields.io/badge/maintained%20with-changesets-176de3.svg)](https://github.com/atlassian/changesets)

> Incredible [markuplint][] plugins, make markuplint greater.

## Packages

This repository is a monorepo managed by [changesets][] what means we actually publish several packages to npm from same codebase, including:

| Package                                                 | Description                    | Version                                                                                                                                                                                                                                                         | (Peer) Dependencies                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`markuplint-angular-parser`](/packages/angular-parser) | Angular parser for markuplint. | [![npm](https://img.shields.io/npm/v/markuplint-angular-parser.svg)](https://www.npmjs.com/package/markuplint-angular-parser) [![View changelog](https://img.shields.io/badge/changelog-explore-brightgreen)](https://changelogs.xyz/markuplint-angular-parser) | [![David Peer](https://img.shields.io/david/peer/rx-ts/markuplint.svg?path=packages/angular-parser)](https://david-dm.org/rx-ts/markuplint?path=packages/angular-parser&type=peer) [![David](https://img.shields.io/david/rx-ts/markuplint.svg?path=packages/angular-parser)](https://david-dm.org/rx-ts/markuplint?path=packages/angular-parser) |

`markuplint-sync` has been deprecated, please use [`synckit`][] to wrap it directly instead.

## License

[MIT][] © [JounQin][]@[1stG.me][]

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Frx-ts%2Fmarkuplint.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Frx-ts%2Fmarkuplint?ref=badge_large)

[1stg.me]: https://www.1stg.me
[changesets]: https://GitHub.com/atlassian/changesets
[jounqin]: https://GitHub.com/JounQin
[markuplint]: https://GitHub.com/markuplint/markuplint
[mit]: http://opensource.org/licenses/MIT
[`synckit`]: https://github.com/rx-ts/synckit
