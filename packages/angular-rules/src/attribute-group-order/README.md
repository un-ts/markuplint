# `attribute-group-order`

Enforces certain order of inputs, outputs, directives and other attributes on html elements.

## Rule Details

👎 Examples of **incorrect** code for this rule with default configuration.

```html
<div
  [class.invalid]="true"
  title="Invalid order"
  *ngIf="isVisible"
></div>
```

👍 Examples of **correct** code for this rule with default configuration.

```html
<div
  *ngIf="isVisible"
  title="Valid order"
  [class.valid]="true"
></div>
```

## Options

| Property       | Type       | Optional | Default Value                                                                                                                                    | Description                                                                                                                                                                                               |
| -------------- | ---------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `order`        | `string[]` | ✔        | <br/>`*structural`<br/>`#variable`<br/>`i18n`<br/>`attribute`<br/>`[input]`<br/>`[(two-way)]`<br/>`@animation`<br/>`[@animation]`<br/>`(output)` | Specify order of attribute groups. Available tokens are: <br/>`*structural`<br/>`#variable`<br/>`i18n`<br/>`attribute`<br/>`[input]`<br/>`[(two-way)]`<br/>`@animation`<br/>`[@animation]`<br/>`(output)` |
| `alphabetical` | `boolean`  | ✔        | `false`                                                                                                                                          | Sort the attributes of the same group alphabetically. Like `@angular-eslint`, `i18n-title` is compared as `title` and sorts after it.                                                                     |

`@animation`, `[@animation]` and `i18n` are refinements. `[@animation]` matches the difference between a static `@trigger` attribute and a bound `[@trigger]="expression"` animation. When one of them is not listed in `order`, the attributes it covers are checked as the group they belonged to before it existed — `[@trigger]` as `@animation`, then as `[input]`, and `@trigger` and `i18n-*` as `attribute` — so configurations written before these groups existed keep working.

This rule supports autofix: when every attribute's group is listed in `order`, the attributes are reordered for you, keeping the whitespace of each position so that the indentation and the line breaks stay as they are. Attributes of an unlisted group are only reported, because they have no rank to be sorted by.

Angular itself does not prescribe an attribute order, but [`@angular-eslint/template/attributes-order`](https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin-template/docs/rules/attributes-order.md) does, and this rule's core groups match it one to one: `STRUCTURAL_DIRECTIVE` → `TEMPLATE_REFERENCE` → `ATTRIBUTE_BINDING` → `INPUT_BINDING` → `TWO_WAY_BINDING` → `OUTPUT_BINDING` is the same sequence as `*structural`, `#variable`, `attribute`, `[input]`, `[(two-way)]`, `(output)`.

`i18n`, `@animation` and `[@animation]` go beyond that convention: `@angular-eslint` has no dedicated group for them (it treats `[@trigger]` as an input binding and bare `@trigger` as a plain attribute), and Vue's [element attribute order](https://vuejs.org/style-guide/rules-recommended.html#element-attribute-order) is finer grained in a different way. They are therefore opt-in refinements, as described above. Use the `order` option to follow your own convention.

### Example config

```json
"markuplint-angular-rules/attribute-group-order": {
  "option": {
    "order": [
      "*structural",
      "#variable",
      "i18n",
      "attribute",
      "[input]",
      "[(two-way)]",
      "@animation",
      "[@animation]",
      "(output)"
    ]
  }
}
```

### Default severity

`error`
