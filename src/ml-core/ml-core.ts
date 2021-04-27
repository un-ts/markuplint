import { MLRuleSync } from './patch-ml-rule'

import { ExtendedSpec, MLMLSpec } from '@markuplint/ml-spec'
import { MLMarkupLanguageParser } from '@markuplint/ml-ast'
import {
  ParserOptions,
  RuleConfigValue,
  VerifiedResult,
} from '@markuplint/ml-config'
import { MLCore, MLRule, Ruleset } from '@markuplint/ml-core'
import { I18n } from '@markuplint/i18n'

export class MLCoreSync extends MLCore {
  #ruleset: Ruleset
  #rules: Array<MLRuleSync<RuleConfigValue, unknown>>
  #i18n: I18n

  constructor(
    parser: MLMarkupLanguageParser,
    sourceCode: string,
    ruleset: Partial<Ruleset>,
    rules: Array<MLRule<RuleConfigValue, unknown>>,
    i18n: I18n,
    schemas: Readonly<[MLMLSpec, ...ExtendedSpec[]]>,
    parserOptions: ParserOptions,
  ) {
    super(parser, sourceCode, ruleset, rules, i18n, schemas, parserOptions)
    this.#ruleset = {
      rules: ruleset.rules || {},
      nodeRules: ruleset.nodeRules || [],
      childNodeRules: ruleset.childNodeRules || [],
    }
    this.#rules = rules as Array<MLRuleSync<RuleConfigValue, unknown>>
    this.#i18n = i18n
  }

  verifySync(fix = false) {
    const reports: VerifiedResult[] = []
    for (const rule of this.#rules) {
      const ruleInfo = rule.optimizeOption(
        this.#ruleset.rules[rule.name] || false,
      )
      if (ruleInfo.disabled) {
        continue
      }
      if (fix) {
        rule.fixSync(this.document, ruleInfo)
      }
      const results = rule.verifySync(this.document, this.#i18n, ruleInfo)
      reports.push(...results)
    }
    return reports
  }
}
