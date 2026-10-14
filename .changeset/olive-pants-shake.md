---
"markuplint-angular-rules": minor
---

feat: add the `@animation`, `[@animation]` and `i18n` attribute groups to `attribute-group-order`

- `@trigger` (a static attribute) is grouped as `@animation` instead of `attribute`.
- `[@trigger]` (an animation binding) is grouped as `[@animation]` instead of `[input]`.
- `i18n` and `i18n-attribute` are grouped as `i18n` instead of `attribute`.

These groups are refinements: when one of them is not listed in `order`, the attributes it covers are checked as the group they belonged to before it existed — `[@trigger]` as `@animation`, then as `[input]`, and `@trigger` and `i18n-*` as `attribute` — so configurations written before these groups existed keep working.
