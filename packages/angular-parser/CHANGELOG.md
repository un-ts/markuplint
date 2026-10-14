# markuplint-angular-parser

## 4.0.1

### Patch Changes

- [#145](https://github.com/un-ts/markuplint/pull/145) [`a2233ff`](https://github.com/un-ts/markuplint/commit/a2233ffb267fc358762297abe83d23cb62e470c5) Thanks [@JounQin](https://github.com/JounQin)! - fix: mark the dotted, event and interpolated attribute values of Angular bindings as dynamic

  - Dotted bindings are recognized for the prefixes Angular special-cases (`attr.`, `class.`, `style.` and `animate.`), so `[class.x]`, `[class.md:flex]`, `[class.w-1/2]`, `[style.width.px]`, `[style.--my-var]`, `[attr.aria-label]` and `[attr.xlink:href]` are marked as dynamic values. A segment after those prefixes may contain any character except a separator or a wrapper, so namespaced attributes and arbitrary class names are covered, while unknown or invalid names such as `[class..x]` or `[foo.bar]` deliberately stay unmarked: this parser does not validate binding names the way Angular's binding parser and schema registry do.
  - Attribute names may contain `/`, so `[class.w-1/2]="true"` is no longer truncated into `[class.w-1`.
  - Event bindings such as `(@fadeIn.done)` and `(window:resize)` are recognized.
  - An attribute value that contains an interpolation anywhere (e.g. `title="Hello {{ name }}"`) is marked as a dynamic value.
  - Attribute tokenization is delegated to `@markuplint/parser-utils`' `Parser#visitAttr` instead of a local copy, so `isDynamicValue` is only present on attributes that actually have a dynamic value.

- [#144](https://github.com/un-ts/markuplint/pull/144) [`a02c723`](https://github.com/un-ts/markuplint/commit/a02c72335133ee15fb2486c2c005c71e9f4ab5dd) Thanks [@JounQin](https://github.com/JounQin)! - fix: parse comments inside Angular start tags

  Angular allows `/* ... */` and `// ...` comments inside a start tag. They are now consumed instead of being reported as parse errors, and the attributes that follow them are kept instead of being dropped. The comments are also exposed as `#comment` nodes so that rules can inspect them.

  This requires `angular-html-parser` 10.10.0 or later, which is the first version that accepts `allowStartTagComments`.

## 4.0.0

### Major Changes

- [#135](https://github.com/un-ts/markuplint/pull/135) [`a555c69`](https://github.com/un-ts/markuplint/commit/a555c695443e1300dda7fa96da4de571ae3ac3e3) Thanks [@renovate](https://github.com/apps/renovate)! - feat: migrate to `markuplint` v5 and support Angular control flow

  - `markuplint-angular-parser` now targets `@markuplint/*` v5 and `angular-html-parser` v10.
  - Angular control-flow syntax (`@if` / `@else if` / `@else`, `@for` / `@empty`, `@switch` / `@case` / `@default`, `@let`) is mapped to markuplint `psblock` nodes with the matching `blockBehavior`, so content-model rules can analyse each branch.

## 3.0.2

### Patch Changes

- [#133](https://github.com/un-ts/markuplint/pull/133) [`a0f46d6`](https://github.com/un-ts/markuplint/commit/a0f46d6d9eed18a1e3cf5f3925e3763278a49963) Thanks [@JounQin](https://github.com/JounQin)! - fix: should run `build` for `release`

## 3.0.1

### Patch Changes

- [#129](https://github.com/un-ts/markuplint/pull/129) [`ee14968`](https://github.com/un-ts/markuplint/commit/ee1496823998c86b648853ac90f543adaa55ba07) Thanks [@JounQin](https://github.com/JounQin)! - fix: incorrect pkg entries

## 3.0.0

### Major Changes

- [#127](https://github.com/un-ts/markuplint/pull/127) [`78012fd`](https://github.com/un-ts/markuplint/commit/78012fd281c60880eee56b7daab7dcfa75537cbe) Thanks [@JounQin](https://github.com/JounQin)! - chore: bump to `markuplint` v4

## 2.0.0

### Major Changes

- [#114](https://github.com/un-ts/markuplint/pull/114) [`343a77e`](https://github.com/un-ts/markuplint/commit/343a77ed29792edc4bf0329fb29024cc8cd8de70) Thanks [@JounQin](https://github.com/JounQin)! - feat!: migrate to markuplint v3

## 1.1.3

### Patch Changes

- [`77a7bfb`](https://github.com/un-ts/markuplint/commit/77a7bfb4a14c0241f7cf2fb918428639d3eae989) Thanks [@JounQin](https://github.com/JounQin)! - chore: add donate field, bump deps

## 1.1.2

### Patch Changes

- [`b96e62a`](https://github.com/un-ts/markuplint/commit/b96e62a863ddcec5905e654db73be314e0e7a534) Thanks [@JounQin](https://github.com/JounQin)! - fix(types): add types field to exports

## 1.1.1

### Patch Changes

- [#85](https://github.com/un-ts/markuplint/pull/85) [`4cc79ea`](https://github.com/un-ts/markuplint/commit/4cc79eaa01b6929831ba9640a5f99b4a2babe00f) Thanks [@JounQin](https://github.com/JounQin)! - fix: animation trigger starts with @

## 1.1.0

### Minor Changes

- [`3cf3099`](https://github.com/un-ts/markuplint/commit/3cf30995cd29f08be2aa69a0b81ffb3e27de951d) Thanks [@JounQin](https://github.com/JounQin)! - feat: upgrade markuplint core modules

## 1.0.1

### Patch Changes

- [#75](https://github.com/un-ts/markuplint/pull/75) [`32d0bb8`](https://github.com/un-ts/markuplint/commit/32d0bb8c0fca8f58d236540a450dba2479873bdc) Thanks [@YusukeHirao](https://github.com/YusukeHirao)! - fix: avoid throwing the error when the attribute is invalid

## 1.0.0

### Major Changes

- [#73](https://github.com/un-ts/markuplint/pull/73) [`5da0de0`](https://github.com/un-ts/markuplint/commit/5da0de06d64dce2e0a00580566bc8acb84b33892) Thanks [@YusukeHirao](https://github.com/YusukeHirao)! - feat: markuplint-angular-parser supports v2

## 0.3.5

### Patch Changes

- [#63](https://github.com/un-ts/markuplint/pull/63) [`26bb1f3`](https://github.com/un-ts/markuplint/commit/26bb1f32e2b3c2199a2a024b9ed57345198fcb05) Thanks [@JounQin](https://github.com/JounQin)! - fix: svg should always be in svg namespace

## 0.3.4

### Patch Changes

- [#46](https://github.com/un-ts/markuplint/pull/46) [`47f09b2`](https://github.com/un-ts/markuplint/commit/47f09b2a40123d04626f0bc2894b7535e3a1fa52) Thanks [@JounQin](https://github.com/JounQin)! - fix(angular-parser): parse tags with namespace correctly

- [#48](https://github.com/un-ts/markuplint/pull/48) [`be30afb`](https://github.com/un-ts/markuplint/commit/be30afb65f5420cf8e8dbd046927716e0ec60919) Thanks [@JounQin](https://github.com/JounQin)! - fix(angular-parser): support namespaced svg tags like `svg:defs`

- [#46](https://github.com/un-ts/markuplint/pull/46) [`47f09b2`](https://github.com/un-ts/markuplint/commit/47f09b2a40123d04626f0bc2894b7535e3a1fa52) Thanks [@JounQin](https://github.com/JounQin)! - fix(angular-parser): support parsing void element like `<img>`

## 0.3.3

### Patch Changes

- [#43](https://github.com/un-ts/markuplint/pull/43) [`1af57ba`](https://github.com/un-ts/markuplint/commit/1af57ba23b014a2817f275516fa9e4dd25399355) Thanks [@JounQin](https://github.com/JounQin)! - fix(angular-parser): mark `html` tag as non fragment

## 0.3.2

### Patch Changes

- [`c4378d5`](https://github.com/un-ts/markuplint/commit/c4378d5a0ef9b6f4cb01e8093927646d8828080a) Thanks [@JounQin](https://github.com/JounQin)! - chore: bump upstream markuplint packages

## 0.3.1

### Patch Changes

- [#31](https://github.com/un-ts/markuplint/pull/31) [`b68f1af`](https://github.com/un-ts/markuplint/commit/b68f1af1398e2b22b475a0a9a30448ec67c7b113) Thanks [@JounQin](https://github.com/JounQin)! - fix: potential name should not consider #

## 0.3.0

### Minor Changes

- [#27](https://github.com/un-ts/markuplint/pull/27) [`8d0299a`](https://github.com/un-ts/markuplint/commit/8d0299ab80e9495a2aac852a4e48d071e8594eaf) Thanks [@JounQin](https://github.com/JounQin)! - build: targeting es2017 as markuplint itself

## 0.2.0

### Minor Changes

- [`bb39d0a`](https://github.com/un-ts/markuplint/commit/bb39d0ad3a68503141a78593aa46e49b1ba2ab06) Thanks [@JounQin](https://github.com/JounQin)! - feat!: drop node 10 support

## 0.1.4

### Patch Changes

- [#16](https://github.com/un-ts/markuplint/pull/16) [`3019a0a`](https://github.com/un-ts/markuplint/commit/3019a0ac3a1b4eaef1cd11c24cc6f06aaf39112a) Thanks [@JounQin](https://github.com/JounQin)! - fix: support mapping `[attr.attrName]` to `attrName`

## 0.1.3

### Patch Changes

- [#14](https://github.com/un-ts/markuplint/pull/14) [`7015eee`](https://github.com/un-ts/markuplint/commit/7015eee1d298a44eed9297a094d6513d11446749) Thanks [@JounQin](https://github.com/JounQin)! - fix: parse dynamic attributes as MLASTAttr

## 0.1.2

### Patch Changes

- [#11](https://github.com/un-ts/markuplint/pull/11) [`4aa725f`](https://github.com/un-ts/markuplint/commit/4aa725ff49b50ff9e31e3e982b8a6a15a87820bc) Thanks [@JounQin](https://github.com/JounQin)! - fix: support doctype publicId and systemId

## 0.1.1

### Patch Changes

- [#9](https://github.com/un-ts/markuplint/pull/9) [`405d02b`](https://github.com/un-ts/markuplint/commit/405d02b5cbe5b5077996da83b6f2d403770e5316) Thanks [@JounQin](https://github.com/JounQin)! - fix: incorrect col number, difference with official html-parser

## 0.1.0

### Minor Changes

- [#7](https://github.com/un-ts/markuplint/pull/7) [`63786f7`](https://github.com/un-ts/markuplint/commit/63786f77ce5379432a250c6efe61fa23708825f5) Thanks [@JounQin](https://github.com/JounQin)! - feat: integration with angular-html-parser correctly
