import path from 'path'

import { ExtendedSpec, MLMLSpec } from '@markuplint/ml-spec'
import { MLMarkupLanguageParser } from '@markuplint/ml-ast'
import { RuleConfigValue, VerifiedResult } from '@markuplint/ml-config'
import {
  MLParseError,
  convertRuleset,
  Document,
  MLRule,
} from '@markuplint/ml-core'
import { ConfigSet } from '@markuplint/file-resolver'
import { MLResultInfo } from 'markuplint/lib/types'
import { toRegxp } from 'markuplint/lib/util'

import { MLCoreSync } from './ml-core'
import { MLFile } from './file-resolver'
import { moduleAutoLoader } from './module-auto-loader'
import { i18n } from './i18n'
import { tryRequirePkg } from './helper'

// eslint-disable-next-line sonarjs/cognitive-complexity
export function lintFile(
  file: MLFile,
  configs: Map<MLFile, ConfigSet>,
  rulesAutoResolve: boolean,
  rules: Array<MLRule<RuleConfigValue, unknown>>,
  locale?: string,
  fix?: boolean,
): MLResultInfo {
  const configSet: ConfigSet = configs.get(file) || {
    config: {},
    files: new Set(),
    errs: [],
  }

  // Get parser
  let parserModName = '@markuplint/html-parser'
  if (configSet.config.parser) {
    for (const pattern of Object.keys(configSet.config.parser)) {
      if ((toRegxp(pattern) as RegExp).test(path.basename(file.path))) {
        parserModName = configSet.config.parser[pattern]
      }
    }
  }
  const parser = tryRequirePkg<MLMarkupLanguageParser>(parserModName)!
  const parserOptions = configSet.config.parserOptions || {}

  // Resolve ruleset
  const ruleset = convertRuleset(configSet.config)

  // Schemas
  const specs = configSet.config.specs
    ? Array.isArray(configSet.config.specs)
      ? configSet.config.specs
      : [configSet.config.specs]
    : []
  const htmlSpec = tryRequirePkg<MLMLSpec>('@markuplint/html-spec')!
  const extendedSpecs = specs.map(spec => tryRequirePkg<ExtendedSpec>(spec)!)
  const schemas = [htmlSpec, ...extendedSpecs] as const

  // Addition rules
  if (rulesAutoResolve) {
    const { rules: additionalRules } = moduleAutoLoader<RuleConfigValue>(
      ruleset,
    )
    rules = [...rules, ...additionalRules]
  }

  // create MLCore
  const sourceCode = file.getContext()
  const i18nSettings = i18n(locale)

  let results: VerifiedResult[] = []
  let fixedCode = sourceCode
  let document: Document<RuleConfigValue, unknown> | null = null

  try {
    const core = new MLCoreSync(
      parser,
      sourceCode,
      ruleset,
      rules,
      i18nSettings,
      schemas,
      parserOptions,
    )
    results = core.verifySync(fix)
    fixedCode = core.document.toString()
    document = core.document
  } catch (err) {
    if (err instanceof MLParseError) {
      results = [
        {
          ruleId: 'parse-error',
          severity: 'error',
          message: err.message,
          col: err.col,
          line: err.line,
          raw: err.raw,
        },
      ]
    } else {
      throw err
    }
  }

  return {
    results,
    filePath: file.path,
    sourceCode,
    fixedCode,
    document,
    parser: parserModName,
    locale,
    ruleset,
    configSet: {
      config: configSet.config,
      // eslint-disable-next-line unicorn/prefer-spread
      files: Array.from(configSet.files),
      error: configSet.errs.map(e => `${String(e)}`),
    },
  }
}
