# @unts/markuplint

[![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/un-ts/markuplint/ci.yml?branch=main)](https://github.com/un-ts/markuplint/actions/workflows/ci.yml?query=branch%3Amain)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fun-ts%2Fmarkuplint.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fun-ts%2Fmarkuplint?ref=badge_shield)
[![Codecov](https://img.shields.io/codecov/c/gh/un-ts/markuplint)](https://codecov.io/gh/un-ts/markuplint)
[![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/un-ts/markuplint)](https://coderabbit.ai)
[![type-coverage](https://img.shields.io/badge/dynamic/json.svg?label=type-coverage&prefix=%E2%89%A5&suffix=%&query=$.typeCoverage.atLeast&uri=https%3A%2F%2Fraw.githubusercontent.com%2Fun-ts%2Feslint%2Fmain%2Fpackage.json)](https://github.com/plantain-00/type-coverage)
[![GitHub release](https://img.shields.io/github/release/un-ts/markuplint)](https://github.com/un-ts/markuplint/releases)

[![Conventional Commits](https://img.shields.io/badge/conventional%20commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![Renovate enabled](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Code Style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![changesets](https://img.shields.io/badge/maintained%20with-changesets-176de3.svg)](https://github.com/changesets/changesets)

> Incredible [markuplint][] plugins, make markuplint greater.

## TOC <!-- omit in toc -->

- [Angular parser](#angular-parser)
- [Angular-specific rules](#angular-specific-rules)
- [Packages](#packages)
- [Sponsors and Backers](#sponsors-and-backers)
  - [Sponsors](#sponsors)
  - [Backers](#backers)
- [Changelog](#changelog)
- [License](#license)

## Angular parser

To enable Angular parser, install `markuplint-angular-parser` and adjust your `.markuplintrc`:

```jsonc
{
  "parser": {
    ".html$": "markuplint-angular-parser",
  },
  "rules": {
    // ...
  },
}
```

## Angular-specific rules

If you want to enable additional Angular-specific linter rules, install `markuplint-angular-rules` and enable them in your `.markuplintrc`:

```json
{
  "parser": {
    ".html$": "markuplint-angular-parser"
  },
  "plugins": ["markuplint-angular-rules"],
  "rules": {
    "markuplint-angular-rules/attribute-group-order": true
  }
}
```

See [markuplint-angular-rules](./packages/angular-rules/README.md) for list of rules.

## Packages

This repository is a monorepo managed by [changesets][] what means we actually publish several packages to npm from same codebase, including:

| Package                                                 | Description                            | Version                                                                                                                                                                                                                                                         |
| ------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`markuplint-angular-parser`](/packages/angular-parser) | Angular parser for markuplint.         | [![npm](https://img.shields.io/npm/v/markuplint-angular-parser.svg)](https://www.npmjs.com/package/markuplint-angular-parser) [![View changelog](https://img.shields.io/badge/changelog-explore-brightgreen)](https://changelogs.xyz/markuplint-angular-parser) |
| [`markuplint-angular-rules`](/packages/angular-rules)   | Angular specific rules for Markuplint. | [![npm](https://img.shields.io/npm/v/markuplint-angular-rules.svg)](https://www.npmjs.com/package/markuplint-angular-rules) [![View changelog](https://img.shields.io/badge/changelog-explore-brightgreen)](https://changelogs.xyz/markuplint-angular-rules)    |

`markuplint-sync` has been deprecated, please use [`synckit`][synckit] to wrap it directly instead.

## Sponsors and Backers

[![Sponsors and Backers](https://raw.githubusercontent.com/1stG/static/master/sponsors.svg)](https://github.com/sponsors/JounQin)

### Sponsors

| 1stG                                                                                                                   | RxTS                                                                                                                   | UnTS                                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [![1stG Open Collective sponsors](https://opencollective.com/1stG/organizations.svg)](https://opencollective.com/1stG) | [![RxTS Open Collective sponsors](https://opencollective.com/rxts/organizations.svg)](https://opencollective.com/rxts) | [![UnTS Open Collective sponsors](https://opencollective.com/unts/organizations.svg)](https://opencollective.com/unts) |

### Backers

| 1stG                                                                                                                | RxTS                                                                                                                | UnTS                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [![1stG Open Collective backers](https://opencollective.com/1stG/individuals.svg)](https://opencollective.com/1stG) | [![RxTS Open Collective backers](https://opencollective.com/rxts/individuals.svg)](https://opencollective.com/rxts) | [![UnTS Open Collective backers](https://opencollective.com/unts/individuals.svg)](https://opencollective.com/unts) |

## Changelog

Detailed changes for each release are documented in [CHANGELOG.md](./CHANGELOG.md).

## License

[MIT][] © [JounQin][]@[1stG.me][]

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fun-ts%2Fmarkuplint.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fun-ts%2Fmarkuplint?ref=badge_large)

[1stG.me]: https://www.1stG.me
[changesets]: https://GitHub.com/atlassian/changesets
[JounQin]: https://github.com/JounQin
[markuplint]: https://github.com/markuplint/markuplint
[MIT]: http://opensource.org/licenses/MIT
[synckit]: https://github.com/un-ts/synckit
