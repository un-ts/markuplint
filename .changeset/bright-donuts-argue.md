---
"markuplint-angular-parser": patch
---

fix: mark the dotted, event and interpolated attribute values of Angular bindings as dynamic

- Dotted bindings are recognized for the prefixes Angular special-cases (`attr.`, `class.`, `style.` and `animate.`), so `[class.x]`, `[class.md:flex]`, `[class.w-1/2]`, `[style.width.px]`, `[style.--my-var]`, `[attr.aria-label]` and `[attr.xlink:href]` are marked as dynamic values. A segment after those prefixes may contain any character except a separator or a wrapper, so namespaced attributes and arbitrary class names are covered, while unknown or invalid names such as `[class..x]` or `[foo.bar]` deliberately stay unmarked: this parser does not validate binding names the way Angular's binding parser and schema registry do.
- Attribute names may contain `/`, so `[class.w-1/2]="true"` is no longer truncated into `[class.w-1`.
- Event bindings such as `(@fadeIn.done)` and `(window:resize)` are recognized.
- An attribute value that contains an interpolation anywhere (e.g. `title="Hello {{ name }}"`) is marked as a dynamic value.
- Attribute tokenization is delegated to `@markuplint/parser-utils`' `Parser#visitAttr` instead of a local copy, so `isDynamicValue` is only present on attributes that actually have a dynamic value.
