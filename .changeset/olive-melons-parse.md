---
"markuplint-angular-parser": patch
---

fix: parse comments inside Angular start tags

Angular allows `/* ... */` and `// ...` comments inside a start tag. They are now consumed instead of being reported as parse errors, and the attributes that follow them are kept instead of being dropped.
