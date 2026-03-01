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

| Property | Type       | Optional | Default Value                                                                                     | Description                                                                                                                                                |
| -------- | ---------- | -------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `order`  | `string[]` | ✔        | <br/>`*structural`<br/>`#variable`<br/>`attribute`<br/>`[input]`<br/>`[(two-way)]`<br/>`(output)` | Specify order of attribute groups. Available tokens are: <br/>`*structural`<br/>`#variable`<br/>`attribute`<br/>`[input]`<br/>`[(two-way)]`<br/>`(output)` |

### Example config

```json
"markuplint-angular-rules/attribute-group-order": {
  "option": {
    "order": [
      "*structural",
      "#variable",
      "attribute",
      "[input]",
      "[(two-way)]",
      "(output)"
    ]
  }
}
```

### Default severity

`error`
