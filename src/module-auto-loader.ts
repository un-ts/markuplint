import { MLRule, Ruleset } from '@markuplint/ml-core'
import { RuleConfigValue } from '@markuplint/ml-config'

import { tryRequirePkg } from './helper'

export function moduleAutoLoader<T extends RuleConfigValue, O = unknown>(
  ruleset: Ruleset,
) {
  const rules: Array<MLRule<T, O>> = []
  const errors: unknown[] = []

  for (const ruleName of Object.keys(ruleset.rules)) {
    let rule: MLRule<T, O> | null = null

    try {
      rule = tryRequirePkg<MLRule<T, O>>(`@markuplint/rule-${ruleName}`, true)
    } catch (e) {
      errors.push(e)
    }

    if (!rule) {
      continue
    }

    try {
      rule = tryRequirePkg<MLRule<T, O>>(`markuplint-rule-${ruleName}`, true)
    } catch (e) {
      errors.push(e)
    }

    // https://github.com/typescript-eslint/typescript-eslint/issues/3322
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!rule) {
      continue
    }

    rules.push(rule)
  }

  return {
    rules,
    errors,
  }
}
