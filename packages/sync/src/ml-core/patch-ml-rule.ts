import { I18n } from '@markuplint/i18n'
import {
  RuleConfigValue,
  RuleInfo,
  VerifiedResult,
} from '@markuplint/ml-config'
import { Document, MLRule } from '@markuplint/ml-core'

export abstract class MLRuleSync<T extends RuleConfigValue, O = null>
  // @ts-expect-error - MLRule constructor is private
  extends MLRule<T, O>
{
  abstract verifySync(
    document: Document<T, O>,
    i18n: I18n,
    rule: RuleInfo<T, O>,
  ): VerifiedResult[]

  abstract fixSync(document: Document<T, O>, rule: RuleInfo<T, O>): void
}

function verifySync<T extends RuleConfigValue, O = null>(
  this: MLRule<T, O>,
  document: Document<T, O>,
  i18n: I18n,
  rule: RuleInfo<T, O>,
): VerifiedResult[] {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!this.v) {
    return []
  }

  document.setRule(this)

  const results = this.v(document, i18n.translator(), rule)

  if (results instanceof Promise) {
    throw new TypeError('`verifySync` finished async. Use `verify` instead')
  }

  document.setRule(null)

  return results.map<VerifiedResult>(result => ({
    severity: result.severity,
    message: result.message,
    line: result.line,
    col: result.col,
    raw: result.raw,
    ruleId: this.name,
  }))
}

function fixSync<T extends RuleConfigValue, O = null>(
  this: MLRule<T, O>,
  document: Document<T, O>,
  rule: RuleInfo<T, O>,
): void {
  if (!this.f) {
    return
  }

  document.setRule(this)

  const result = this.f(document, rule)

  if (result instanceof Promise) {
    throw new TypeError('`fixSync` finished async. Use `fix` instead')
  }

  document.setRule(null)
}

const originalVerifySync = Object.getOwnPropertyDescriptor(
  MLRule.prototype,
  'verifySync',
)?.value as typeof verifySync | undefined

if (originalVerifySync && originalVerifySync !== verifySync) {
  console.warn(
    '`markuplint-sync` is patching `MLRule#verifySync` with different function, make sure what you are doing',
  )
}

Object.defineProperty(MLRule.prototype, 'verifySync', {
  configurable: true,
  writable: true,
  value: verifySync,
})

const originalFixSync = Object.getOwnPropertyDescriptor(
  MLRule.prototype,
  'fixSync',
)?.value as typeof fixSync | undefined

if (originalFixSync && originalFixSync !== fixSync) {
  console.warn(
    '`markuplint-sync` is patching `MLRule#fixSync` with different function, make sure what you are doing',
  )
}

Object.defineProperty(MLRule.prototype, 'fixSync', {
  configurable: true,
  writable: true,
  value: fixSync,
})
