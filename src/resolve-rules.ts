import { RuleConfigValue } from '@markuplint/ml-config'
import { MLRule } from '@markuplint/ml-core'

export function resolveRules(options: {
  rules?: Array<MLRule<RuleConfigValue, unknown>>
}) {
  let rules: Array<MLRule<RuleConfigValue, unknown>>
  if (options.rules) {
    rules = options.rules
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires, node/no-missing-require
    const r = require('@markuplint/rules')
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    rules = r.default
  }

  return rules
}
