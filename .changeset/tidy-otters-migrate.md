---
"markuplint-angular-parser": major
"markuplint-angular-rules": major
---

feat: migrate to `markuplint` v5 and support Angular control flow

- `markuplint-angular-parser` now targets `@markuplint/*` v5 and `angular-html-parser` v10.
- Angular control-flow syntax (`@if` / `@else if` / `@else`, `@for` / `@empty`, `@switch` / `@case` / `@default`, `@let`) is mapped to markuplint `psblock` nodes with the matching `blockBehavior`, so content-model rules can analyse each branch.
