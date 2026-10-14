# markuplint-angular-rules

## 3.1.0

### Minor Changes

- [#145](https://github.com/un-ts/markuplint/pull/145) [`a2233ff`](https://github.com/un-ts/markuplint/commit/a2233ffb267fc358762297abe83d23cb62e470c5) Thanks [@JounQin](https://github.com/JounQin)! - feat: add the `@animation`, `[@animation]` and `i18n` attribute groups to `attribute-group-order`

  - `@trigger` (a static attribute) is grouped as `@animation` instead of `attribute`.
  - `[@trigger]` (an animation binding) is grouped as `[@animation]` instead of `[input]`.
  - `i18n` and `i18n-attribute` are grouped as `i18n` instead of `attribute`.
  - The new `alphabetical` option sorts the attributes of the same group alphabetically, like `@angular-eslint`.
  - The attributes are reordered automatically with autofix.
  - The `order` option is optional now, as documented: it falls back to the default order, so only `alphabetical` can be configured.

  These groups are refinements: when one of them is not listed in `order`, the attributes it covers are checked as the group they belonged to before it existed — `[@trigger]` as `@animation`, then as `[input]`, and `@trigger` and `i18n-*` as `attribute` — so configurations written before these groups existed keep working.

## 3.0.0

### Major Changes

- [#135](https://github.com/un-ts/markuplint/pull/135) [`a555c69`](https://github.com/un-ts/markuplint/commit/a555c695443e1300dda7fa96da4de571ae3ac3e3) Thanks [@renovate](https://github.com/apps/renovate)! - feat: migrate to `markuplint` v5 and support Angular control flow

  - `markuplint-angular-parser` now targets `@markuplint/*` v5 and `angular-html-parser` v10.
  - Angular control-flow syntax (`@if` / `@else if` / `@else`, `@for` / `@empty`, `@switch` / `@case` / `@default`, `@let`) is mapped to markuplint `psblock` nodes with the matching `blockBehavior`, so content-model rules can analyse each branch.

## 2.0.2

### Patch Changes

- [#133](https://github.com/un-ts/markuplint/pull/133) [`a0f46d6`](https://github.com/un-ts/markuplint/commit/a0f46d6d9eed18a1e3cf5f3925e3763278a49963) Thanks [@JounQin](https://github.com/JounQin)! - fix: should run `build` for `release`

## 2.0.1

### Patch Changes

- [#129](https://github.com/un-ts/markuplint/pull/129) [`ee14968`](https://github.com/un-ts/markuplint/commit/ee1496823998c86b648853ac90f543adaa55ba07) Thanks [@JounQin](https://github.com/JounQin)! - fix: incorrect pkg entries

## 2.0.0

### Major Changes

- [#127](https://github.com/un-ts/markuplint/pull/127) [`78012fd`](https://github.com/un-ts/markuplint/commit/78012fd281c60880eee56b7daab7dcfa75537cbe) Thanks [@JounQin](https://github.com/JounQin)! - chore: bump to `markuplint` v4

## 1.0.0

### Major Changes

- [#114](https://github.com/un-ts/markuplint/pull/114) [`343a77e`](https://github.com/un-ts/markuplint/commit/343a77ed29792edc4bf0329fb29024cc8cd8de70) Thanks [@JounQin](https://github.com/JounQin)! - feat!: migrate to markuplint v3

## 0.1.1

### Patch Changes

- [#104](https://github.com/un-ts/markuplint/pull/104) [`2c694ba`](https://github.com/un-ts/markuplint/commit/2c694babf4674edd78b00dc34b808b8b259748e1) Thanks [@undsoft](https://github.com/undsoft)! - fix(markuplint-angular-rules): fix build

## 0.1.0

### Minor Changes

- [#101](https://github.com/un-ts/markuplint/pull/101) [`0ad8c32`](https://github.com/un-ts/markuplint/commit/0ad8c325791266df442c435b952392fc4bbe4211) Thanks [@undsoft](https://github.com/undsoft)! - feat(markuplint-angular-rules): creating package with first rule `attribute-group-order`
