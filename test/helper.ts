import { MLRule, RuleConfigValue } from '@markuplint/ml-core'

import { tryRequirePkg } from 'markuplint-sync'

export const loadRule = (rule: string) =>
  tryRequirePkg<MLRule<RuleConfigValue, unknown>>(`../rules/${rule}`)!
