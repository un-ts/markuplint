---
"markuplint-angular-parser": patch
---

fix: parse comments inside Angular start tags

Angular allows `/* ... */` and `// ...` comments inside a start tag. They are now consumed instead of being reported as parse errors, and the attributes that follow them are kept instead of being dropped. The comments are also exposed as `#comment` nodes so that rules can inspect them.

This requires `angular-html-parser` 10.10.0 or later, which is the first version that accepts `allowStartTagComments`.
