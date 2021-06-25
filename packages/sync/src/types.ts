import { MLRule, RuleConfigValue } from '@markuplint/ml-core'
import { exec } from 'markuplint'

export type MarkupLintOptions = Parameters<typeof exec>[0]

export type MLRules = Array<MLRule<RuleConfigValue, unknown>>
