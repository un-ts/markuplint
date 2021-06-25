import { MLResultInfo } from 'markuplint/lib/types'

import { lintFile } from './lint-file'
import { resolveConfigs } from './resolve-configs'
import { resolveLintTargetFiles } from './resolve-lint-target-files'
import { resolveRules } from './resolve-rules'
import { MarkupLintOptions } from './types'

export function lint(options: MarkupLintOptions) {
  const rulesAutoResolve = options.rulesAutoResolve ?? true

  const files = resolveLintTargetFiles(options)
  const configs = resolveConfigs(files, options)
  const rules = resolveRules(options)

  const totalResults: MLResultInfo[] = []

  for (const file of files) {
    const result = lintFile(
      file,
      configs,
      rulesAutoResolve,
      rules,
      options.locale,
      options.fix,
      options.extMatch,
    )
    if (result) {
      totalResults.push(result)
    }
  }

  return totalResults
}
